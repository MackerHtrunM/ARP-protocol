# ARP 小小網路探險隊

一個給國中生看的 ARP 與 ARP spoofing 互動教學網站。教學頁以原生 HTML、CSS、JavaScript 製作；快問快答可連到 Python FastAPI 後端，由伺服器建立測驗、判分並提供解析。GitHub Pages 繼續託管前端與原始碼，後端需部署到支援執行 Python 的主機。

## 本機預覽

開兩個終端機：一個啟動前端靜態預覽，一個啟動 API。

```bash
python3 serve.py
```

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

開啟終端機顯示的網址，通常是 <http://localhost:8000>。也可以直接用瀏覽器開啟 `index.html`。

## 部署前端到 GitHub Pages

1. 將整個資料夾推送到 GitHub repository 的 `main` 分支。
2. 到 repository 的 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**，分支選 `main`，資料夾選 `/ (root)`。
4. 儲存後，等待 GitHub Pages 顯示網站網址。

GitHub Pages 只提供靜態檔案，不會執行 Python、PHP 或 Ruby 等伺服器程式。因此頁面仍在 GitHub Pages；API 透過根目錄的 `render.yaml` 部署到 Render。第一次部署時，在 Render 選擇 **New → Blueprint**，連結這個 GitHub repository，確認建立 `arp-protocol-api` Web Service。部署完成後測試 `https://<Render 網址>/api/health`。若 Render 分配的網址不是 `https://arp-protocol-api.onrender.com`，請更新 `api-config.js` 的 API 網址，並推送變更。

Render 免費 Web Service 閒置 15 分鐘會休眠，喚醒時第一次 API 呼叫可能需要等待；頁面會在無法連線時自動改成本機評分，不會卡住測驗。測驗分數只暫存在 API 記憶體中，不收集姓名或其他個人資料，服務重啟或休眠後不保留。

## 專案內容

- `index.html`：探險首頁與五個章節入口
- `arp.html`：ARP、IP 和 MAC 入門
- `lab.html`：快取命中 / 未命中 / 假冒回覆情境；ARP 欄位透視與快取變化
- `spoof.html` / `spoof.js`：ARP spoofing 學習站，互動比較正常與遭冒名的 ARP 快取，搭配原理、封包路徑、影響、防護與辨識練習
- `quiz.html`：十題由淺入深的封包判讀挑戰
- `flow-quiz.html` / `flow-quiz.js`：同網段、跨網段兩種 ARP 拖拉排序挑戰；支援拖放、點選放置與鍵盤操作
- `styles.css`：暖色課程工作台；桌機與較高手機視窗採單畫面排版
- `script.js`：封包動畫與小測驗互動
- `api-config.js`：前端呼叫 Python API 的網址（本機自動使用 `localhost:8001`）
- `backend/main.py`：FastAPI 健康檢查、測驗 session、伺服器端判分與結果
- `backend/requirements.txt`：API Python 套件
- `render.yaml`：Render Blueprint 部署設定
- `serve.py`：Python 標準函式庫本機靜態伺服器
- `docs/設計簡報.md`：網站定位、頁面結構、視覺方向與內容依據

## 來源

- [RFC 826：Ethernet Address Resolution Protocol](https://datatracker.ietf.org/doc/html/rfc826)
- [RFC 1812：IPv4 路由器與下一站轉送](https://datatracker.ietf.org/doc/html/rfc1812)
- [RFC 5227：IPv4 Address Conflict Detection](https://datatracker.ietf.org/doc/html/rfc5227)
- [Cisco：Dynamic ARP Inspection](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-13/configuration_guide/sec/b_1713_sec_9600_cg/configuring_dynamic_arp_inspection.html)
- [AI 互動網站案例：Below the Surface](https://learn.chatgpt.com/showcase/below-the-surface)
- [AI 互動網站案例：Living Cell](https://learn.chatgpt.com/showcase/living-cell-cross-section)
- [Dilum Sanjaya 的繁體中文個人網站（視覺參考）](https://dilum.dev/zh-Hant)
- [web-design-skill 導讀（設計流程參考）](https://recca0120.github.io/2026/04/25/web-design-skill-claude-design/)

教學中的網路與 MAC/IP 範例皆為虛構。ARP spoofing 模擬只改變網頁中的動畫與說明，不會送出任何網路封包。
