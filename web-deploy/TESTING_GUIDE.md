# 守護核心 SentinelCore v3.0 — 測試指南

## 快速開始

### 啟動本地開發伺服器

```bash
cd web-deploy
node dev-server.js
```

伺服器將在 `http://localhost:8080` 啟動，整合前端靜態檔案和完整 Worker API。

### 端到端測試流程

完整的金鑰配對測試需要兩個角色：

---

## 被觀察方（Subject）流程

1. 開啟平台首頁
2. 點擊「📱 被觀察方 Subject」卡片
3. 詳細閱讀《使用責任協議》七條條款
4. 勾選「我已詳閱並同意《使用責任協議》所有條款」
5. 點擊「簽署協議並生成配對金鑰」
6. **系統生成配對金鑰（格式：XXXX-XXXX，如 3YMN-EZDD）**
7. 將金鑰提供給監護人（觀察方）
8. 在下方確認框中重新輸入金鑰
9. 點擊「🔑 確認並部署至背景」
10. 部署完成後介面自動消失，監控服務在背景運行

---

## 觀察方（Observer）流程

1. 開啟平台首頁（可在另一裝置或另一瀏覽器視窗）
2. 點擊「👁️ 觀察方 Observer」卡片
3. 在「配對金鑰」欄位輸入被觀察方提供的金鑰（格式自動轉換為大寫+橫線）
4. 點擊「🔑 驗證並連線」
5. 系統後端驗證金鑰有效性 → 配對成功 → 進入監控主控台
6. 監控主控台顯示：即時威脅態勢、裝置列表、威脅分類統計

---

## API 端點測試

使用 curl 直接測試 API：

```bash
# 健康檢查
curl http://localhost:8080/api/health

# 生成金鑰
curl -X POST http://localhost:8080/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo":"test-device"}'

# 驗證金鑰
curl -X POST http://localhost:8080/api/keys/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"XXXX-XXXX"}'

# 配對金鑰
curl -X POST http://localhost:8080/api/keys/pair \
  -H "Content-Type: application/json" \
  -d '{"key":"XXXX-XXXX"}'

# 被觀察方確認
curl -X POST http://localhost:8080/api/keys/confirm-subject \
  -H "Content-Type: application/json" \
  -d '{"key":"XXXX-XXXX"}'

# 查詢金鑰狀態
curl "http://localhost:8080/api/keys/status?key=XXXX-XXXX"

# 撤銷金鑰
curl -X POST http://localhost:8080/api/keys/revoke \
  -H "Content-Type: application/json" \
  -d '{"key":"XXXX-XXXX"}'

# 列出所有金鑰
curl http://localhost:8080/api/keys/list

# 審計日誌
curl http://localhost:8080/api/audit
```

---

## 金鑰生命週期

```
生成(active) → 驗證(validate) → 配對(paired) → 確認部署(confirmed)
                                                    ↓
                                              過期(expired)
                                              撤銷(revoked)
```

- 金鑰格式：8位大寫字母+數字，排除易混淆字符（0/O/1/I/L）
- 有效期：24小時
- 每個金鑰只能配對一次
- 配對後金鑰狀態從 `active` 轉為 `paired`

---

## 安全性驗證測試

| 測試案例 | 預期結果 |
|---------|---------|
| 輸入不存在金鑰 | 404 金鑰不存在或已過期 |
| 重複配對同一金鑰 | 400 金鑰狀態為 paired |
| 使用過期金鑰 | 400 金鑰已過期 |
| 格式錯誤金鑰 | 400 金鑰格式不正確 |
| 已撤銷金鑰 | 400 金鑰已撤銷 |

---

## 開發伺服器架構

```
dev-server.js (port 8080)
├── /api/* → Worker API (本地 KV 模擬器)
│   ├── /api/health
│   ├── /api/keys/generate
│   ├── /api/keys/validate
│   ├── /api/keys/pair
│   ├── /api/keys/confirm-subject
│   ├── /api/keys/status
│   ├── /api/keys/revoke
│   ├── /api/keys/list
│   ├── /api/devices
│   ├── /api/threats
│   ├── /api/audit
│   └── /api/rules
└── /* → 靜態檔案服務 (index.html, app.js, styles.css)
```

特點：
- 同源架構，無 CORS 問題
- 本地 KV 模擬器（Map 實作）
- 完整金鑰配對生命週期
- 審計日誌記錄
- SPA 路由 fallback

---

## 正式部署注意事項

正式部署時需：
1. 將 `app.js` 的 `API_BASE` 改回 `https://api.autoecoops.io`
2. 使用 `wrangler` 部署 Worker 到 Cloudflare
3. 建立 KV namespace：`wrangler kv:namespace create SCREEN_MONITOR_KV`
4. 更新 `wrangler.toml` 中的 KV namespace ID
5. 設定 DNS：`api.autoecoops.io` → Worker 自訂網域
