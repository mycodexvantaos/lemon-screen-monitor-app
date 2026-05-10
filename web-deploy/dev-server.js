/**
 * SentinelCore v3.0 本地開發伺服器
 * 整合靜態檔案服務 + Worker API，同一端口，無 CORS 問題
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STATIC_DIR = __dirname;

// ─── 本地 KV 模擬器 ───────────────────────────────────────────
const kvStore = new Map();
const localKV = {
  async get(key) { return kvStore.get(key) || null; },
  async put(key, value) { kvStore.set(key, value); },
  async delete(key) { kvStore.delete(key); },
};

// ─── 金鑰生成函數（與 Worker 相同） ─────────────────────────
function generatePairingKey() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key.slice(0, 4) + '-' + key.slice(4);
}

// ─── CORS 處理 ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:8080', 'http://localhost:8787', 'http://localhost:3000',
  'https://autoecoops.io', 'https://www.autoecoops.io', 'https://app.autoecoops.io',
];

function corsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function jsonResponse(data, status = 200, req) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

// ─── 金鑰活躍列表 ───────────────────────────────────────────
async function getActiveKeys() {
  const raw = await localKV.get('keys:active');
  return raw ? JSON.parse(raw) : [];
}

async function addActiveKey(key) {
  const keys = await getActiveKeys();
  if (!keys.includes(key)) keys.push(key);
  await localKV.put('keys:active', JSON.stringify(keys));
}

async function removeActiveKey(key) {
  const keys = await getActiveKeys();
  const idx = keys.indexOf(key);
  if (idx >= 0) keys.splice(idx, 1);
  await localKV.put('keys:active', JSON.stringify(keys));
}

// ─── 審計日誌 ───────────────────────────────────────────────
async function appendAuditLog(entry) {
  const raw = await localKV.get('audit:logs');
  const logs = raw ? JSON.parse(raw) : [];
  logs.push(entry);
  await localKV.put('audit:logs', JSON.stringify(logs));
}

// ─── API 路由處理 ───────────────────────────────────────────
async function handleAPI(req, urlPath, body) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  // ─── 健康檢查 ───
  if (urlPath === '/api/health') {
    return jsonResponse({
      status: 'healthy', version: '3.0.0-dev',
      timestamp: Date.now(), kv: true,
      mode: 'local-dev-server',
      activeKeys: (await getActiveKeys()).length,
    }, 200, req);
  }

  // ─── 生成金鑰 ───
  if (urlPath === '/api/keys/generate' && req.method === 'POST') {
    const key = generatePairingKey();
    const now = Date.now();
    const record = {
      key, status: 'active',
      createdAt: now,
      expiresAt: now + 86400000,
      deviceInfo: body?.deviceInfo || null,
      subjectConfirmed: false,
    };
    await localKV.put(`key:${key}`, JSON.stringify(record));
    await addActiveKey(key);
    await appendAuditLog({
      action: 'key_generated', key: `${key.slice(0,4)}-****`,
      timestamp: now, level: 'info',
      detail: '被觀察方生成配對金鑰',
    });
    console.log(`[KEY] 生成金鑰: ${key}`);
    return jsonResponse({ success: true, key, status: 'active', expiresAt: now + 86400000, createdAt: now }, 201, req);
  }

  // ─── 驗證金鑰 ───
  if (urlPath === '/api/keys/validate' && req.method === 'POST') {
    const { key } = body || {};
    if (!key) return jsonResponse({ valid: false, error: '缺少金鑰' }, 400, req);
    const keyFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!keyFormat.test(key)) return jsonResponse({ valid: false, error: '金鑰格式不正確' }, 400, req);
    
    const raw = await localKV.get(`key:${key}`);
    if (!raw) {
      console.log(`[KEY] 驗證失敗 - 金鑰不存在: ${key}`);
      return jsonResponse({ valid: false, status: 'not_found', error: '金鑰不存在或已過期' }, 404, req);
    }
    const record = JSON.parse(raw);
    if (record.status !== 'active') {
      console.log(`[KEY] 驗證失敗 - 金鑰狀態: ${record.status}`);
      return jsonResponse({ valid: false, status: record.status, error: `金鑰已${record.status === 'paired' ? '配對' : record.status === 'expired' ? '過期' : '撤銷'}` }, 400, req);
    }
    if (record.expiresAt < Date.now()) {
      record.status = 'expired';
      await localKV.put(`key:${key}`, JSON.stringify(record));
      await removeActiveKey(key);
      return jsonResponse({ valid: false, status: 'expired', error: '金鑰已過期' }, 400, req);
    }
    console.log(`[KEY] 驗證成功: ${key}`);
    return jsonResponse({ valid: true, status: 'active', expiresAt: record.expiresAt }, 200, req);
  }

  // ─── 配對金鑰 ───
  if (urlPath === '/api/keys/pair' && req.method === 'POST') {
    const { key } = body || {};
    if (!key) return jsonResponse({ paired: false, error: '缺少金鑰' }, 400, req);
    
    const raw = await localKV.get(`key:${key}`);
    if (!raw) return jsonResponse({ paired: false, error: '金鑰不存在' }, 404, req);
    const record = JSON.parse(raw);
    if (record.status !== 'active') return jsonResponse({ paired: false, error: `金鑰狀態為 ${record.status}` }, 400, req);
    if (record.expiresAt < Date.now()) return jsonResponse({ paired: false, error: '金鑰已過期' }, 400, req);

    const sessionId = crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const deviceId = `DEV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = Date.now();

    record.status = 'paired';
    record.pairedAt = now;
    record.pairedDevice = deviceId;
    await localKV.put(`key:${key}`, JSON.stringify(record));
    await removeActiveKey(key);

    // 建立裝置和會話記錄
    await localKV.put(`device:${deviceId}`, JSON.stringify({
      deviceId, key, status: 'online', lastSeen: now, pairedAt: now,
    }));
    await localKV.put(`session:${sessionId}`, JSON.stringify({
      sessionId, key, deviceId, createdAt: now, status: 'active',
    }));

    await appendAuditLog({
      action: 'key_paired', key: `${key.slice(0,4)}-****`,
      timestamp: now, level: 'info',
      detail: `觀察方使用金鑰配對成功，Session: ${sessionId}`,
    });
    console.log(`[KEY] 配對成功: ${key} → Session: ${sessionId}`);
    return jsonResponse({ paired: true, session: sessionId, device: deviceId, pairedAt: now }, 200, req);
  }

  // ─── 被觀察方確認 ───
  if (urlPath === '/api/keys/confirm-subject' && req.method === 'POST') {
    const { key } = body || {};
    if (!key) return jsonResponse({ confirmed: false, error: '缺少金鑰' }, 400, req);
    
    const raw = await localKV.get(`key:${key}`);
    if (!raw) return jsonResponse({ confirmed: false, error: '金鑰不存在' }, 404, req);
    const record = JSON.parse(raw);
    record.subjectConfirmed = true;
    record.confirmedAt = Date.now();
    await localKV.put(`key:${key}`, JSON.stringify(record));
    await appendAuditLog({
      action: 'subject_confirmed', key: `${key.slice(0,4)}-****`,
      timestamp: Date.now(), level: 'info',
      detail: '被觀察方確認金鑰部署',
    });
    console.log(`[KEY] 被觀察方確認: ${key}`);
    return jsonResponse({ confirmed: true, confirmedAt: record.confirmedAt }, 200, req);
  }

  // ─── 金鑰狀態查詢 ───
  if (urlPath === '/api/keys/status' && req.method === 'GET') {
    const key = new URL(req.url, `http://localhost:${PORT}`).searchParams.get('key');
    if (!key) return jsonResponse({ error: '缺少 key 參數' }, 400, req);
    const raw = await localKV.get(`key:${key}`);
    if (!raw) return jsonResponse({ key, status: 'not_found' }, 404, req);
    const record = JSON.parse(raw);
    return jsonResponse({ key, status: record.status, ...record }, 200, req);
  }

  // ─── 撤銷金鑰 ───
  if (urlPath === '/api/keys/revoke' && req.method === 'POST') {
    const { key } = body || {};
    if (!key) return jsonResponse({ revoked: false, error: '缺少金鑰' }, 400, req);
    const raw = await localKV.get(`key:${key}`);
    if (!raw) return jsonResponse({ revoked: false, error: '金鑰不存在' }, 404, req);
    const record = JSON.parse(raw);
    record.status = 'revoked';
    record.revokedAt = Date.now();
    await localKV.put(`key:${key}`, JSON.stringify(record));
    await removeActiveKey(key);
    await appendAuditLog({
      action: 'key_revoked', key: `${key.slice(0,4)}-****`,
      timestamp: Date.now(), level: 'high',
      detail: '金鑰已被撤銷',
    });
    console.log(`[KEY] 撤銷: ${key}`);
    return jsonResponse({ revoked: true }, 200, req);
  }

  // ─── 列出所有金鑰 ───
  if (urlPath === '/api/keys/list' && req.method === 'GET') {
    const activeKeys = await getActiveKeys();
    const allKeys = [];
    for (const key of activeKeys) {
      const raw = await localKV.get(`key:${key}`);
      if (raw) allKeys.push(JSON.parse(raw));
    }
    return jsonResponse({ keys: allKeys, total: allKeys.length }, 200, req);
  }

  // ─── 裝置列表 ───
  if (urlPath === '/api/devices') {
    return jsonResponse({ devices: [
      { id: 'DEV-DEMO1', name: '示範裝置', status: 'online', lastSeen: Date.now() },
    ] }, 200, req);
  }

  // ─── 威脅紀錄 ───
  if (urlPath === '/api/threats') {
    return jsonResponse({ threats: [] }, 200, req);
  }

  // ─── 審計紀錄 ───
  if (urlPath === '/api/audit') {
    const raw = await localKV.get('audit:logs');
    return jsonResponse({ entries: raw ? JSON.parse(raw) : [] }, 200, req);
  }

  // ─── 監控規則 ───
  if (urlPath === '/api/rules') {
    return jsonResponse({ rules: [
      { id: 'R001', name: '賭博網站偵測', category: 'gambling', severity: 'high', enabled: true },
      { id: 'R002', name: '成人內容偵測', category: 'adult', severity: 'high', enabled: true },
      { id: 'R003', name: '暴力內容偵測', category: 'violence', severity: 'high', enabled: true },
      { id: 'R004', name: '藥物資訊偵測', category: 'drugs', severity: 'medium', enabled: true },
      { id: 'R005', name: '有害接觸偵測', category: 'harmful_contact', severity: 'high', enabled: true },
    ] }, 200, req);
  }

  // ─── 404 ───
  return jsonResponse({ error: 'Not Found', path: urlPath }, 404, req);
}

// ─── MIME 類型映射 ──────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// ─── HTTP 伺服器 ─────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const urlPath = url.pathname;

  // API 路由
  if (urlPath.startsWith('/api/')) {
    let body = null;
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { body = {}; }
    }
    try {
      const response = await handleAPI(req, urlPath, body);
      const headers = Object.fromEntries(response.headers.entries());
      const responseBody = await response.text();
      res.writeHead(response.status, headers);
      res.end(responseBody);
    } catch (err) {
      console.error('[API Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders(req) });
      res.end(JSON.stringify({ error: 'Internal Server Error', detail: err.message }));
    }
    return;
  }

  // 靜態檔案服務
  let filePath = path.join(STATIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  
  // 安全性檢查：防止目錄遍歷
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // SPA fallback
      try {
        const indexData = await fs.promises.readFile(path.join(STATIC_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexData);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   守護核心 SentinelCore v3.0 — 本地開發伺服器           ║');
  console.log('║   Local Dev Server with Full Key Pairing API            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║   前端 + API:  http://localhost:${PORT}                    ║`);
  console.log('║   KV 模式:    本地記憶體 (Map)                          ║');
  console.log('║   金鑰有效期: 24 小時                                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║   測試流程:                                              ║');
  console.log('║   1. 被觀察方: 同意協議 → 生成金鑰 → 顯示金鑰          ║');
  console.log('║   2. 觀察方: 輸入金鑰 → 後端驗證 → 配對成功            ║');
  console.log('║   3. 監控主控台即時運作                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n[SERVER] 正在關閉...');
  server.close(() => process.exit(0));
});
