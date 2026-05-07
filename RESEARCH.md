# iOS 螢幕共享技術調研報告

## 執行摘要

iOS 螢幕共享的實作受到 Apple 嚴格的隱私保護機制限制。目前可行的方案主要有兩種：

### 1. **Path A：應用內螢幕捕獲（In-app Capture）**
- 使用 `RPScreenRecorder.shared().startCapture`
- **限制**：僅能捕獲應用本身的畫面，當應用進入背景時停止
- **優勢**：實作簡單（1-2 天），無需 Extension
- **適用場景**：白板、文件檢視器、應用內演示

### 2. **Path B：廣播上傳擴展（Broadcast Upload Extension）**
- 使用 `RPBroadcastSampleHandler` 和系統級螢幕廣播
- **優勢**：可捕獲整個系統的螢幕（其他應用、主畫面、Safari 等）
- **限制**：
  - 擴展進程有 **50 MB 硬性記憶體上限**（超過一個位元組就會被系統殺死）
  - 需要 App Group 共享容器進行 IPC 通訊
  - 需要單獨的 Extension Target
- **實作複雜度**：7-14 天（含 QA）
- **使用者體驗**：通過系統廣播選擇器啟動，狀態列會顯示紅色錄製指示

## 技術架構選擇

### 推薦方案：Path B + WebRTC SFU 模式

**理由**：
1. 使用者需要監控「另一半的即時操作介面」，這需要系統級的螢幕捕獲
2. 被監控端（廣播方）需要啟動系統廣播，該操作在 iOS 上會顯示明顯的紅色錄製指示，確保知情同意

**架構流程**：

```
被監控方 (iOS 裝置)
├─ 主應用：提供啟動廣播的 UI
└─ Broadcast Upload Extension
   ├─ 接收系統螢幕幀
   ├─ 使用 H.264 硬體編碼器
   ├─ 降採樣至 720p、20-30 fps
   └─ 通過 WebSocket 發送至伺服器

伺服器 (Node.js + WebRTC SFU)
├─ 接收廣播方的螢幕流
├─ 管理連線與房間
└─ 轉發至監控方

監控方 (iOS 裝置)
├─ 連接至伺服器
├─ 接收即時螢幕流
└─ 顯示螢幕預覽（禁止任何操作）
```

## 記憶體優化策略

為了保持在 50 MB 限制內，需要：

1. **解析度降採樣**：目標 1280×720 NV12 格式（~1.4 MB/幀）
2. **編碼器選擇**：H.264 硬體編碼（禁止 VP8，軟體編碼會超限）
3. **幀率控制**：20-30 fps（不是 60 fps）
4. **及時釋放緩衝區**：使用 `autoreleasepool` 防止記憶體堆積

## 使用者知情同意

**iOS 系統保證**：
- 啟動螢幕廣播時，系統會彈出確認對話框
- 廣播進行中，狀態列顯示紅色錄製指示
- 使用者可隨時通過控制中心停止廣播

**應用層保證**：
- 首次啟動時顯示詳細的免責聲明
- 明確說明此應用的目的與隱私風險
- 要求使用者確認理解與同意

## 技術棧

- **前端**：React Native (Expo 54) + TypeScript
- **後端**：Node.js + Express + WebRTC SFU（mediasoup 或 LiveKit）
- **通訊**：WebSocket（信令）+ WebRTC（媒體流）
- **原生整合**：Broadcast Upload Extension (Swift)

## 下一步

1. ✅ 初始化 Expo 專案
2. ⏳ 設計應用架構與螢幕流程
3. ⏳ 開發廣播端 UI（主應用 + Extension）
4. ⏳ 開發監控端 UI
5. ⏳ 實作 WebRTC 伺服器
6. ⏳ 撰寫免責聲明與法律告知
7. ⏳ 整合與測試

## 參考資源

- Dyte iOS 螢幕共享指南：https://docs.dyte.io/ios-core/local-user/screen-share-guide
- Fora Soft 生產級實作指南：https://www.forasoft.com/blog/article/how-to-implement-screen-sharing-in-ios-1193
