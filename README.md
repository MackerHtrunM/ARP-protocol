# ARP 小小網路探險隊

一個給國中生看的 ARP 與 ARP spoofing 互動教學網站。網站使用原生 HTML、CSS、JavaScript，可直接部署到 GitHub Pages，不需要後端或套件安裝。

## 本機預覽

```bash
python3 serve.py
```

開啟終端機顯示的網址，通常是 <http://localhost:8000>。也可以直接用瀏覽器開啟 `index.html`。

## 部署到 GitHub Pages

1. 將整個資料夾推送到 GitHub repository 的 `main` 分支。
2. 到 repository 的 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **Deploy from a branch**，分支選 `main`，資料夾選 `/ (root)`。
4. 儲存後，等待 GitHub Pages 顯示網站網址。

## 專案內容

- `index.html`：教學內容與互動介面
- `styles.css`：響應式視覺設計
- `script.js`：封包動畫、情境切換與小測驗
- `serve.py`：Python 標準函式庫本機靜態伺服器
- `docs/設計簡報.md`：網站定位、頁面結構、視覺方向與內容依據

## 來源

- [RFC 826：Ethernet Address Resolution Protocol](https://datatracker.ietf.org/doc/html/rfc826)
- [Cisco：Dynamic ARP Inspection](https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9600/software/release/17-13/configuration_guide/sec/b_1713_sec_9600_cg/configuring_dynamic_arp_inspection.html)
- [Dilum Sanjaya 的繁體中文個人網站（視覺參考）](https://dilum.dev/zh-Hant)
- [web-design-skill 導讀（設計流程參考）](https://recca0120.github.io/2026/04/25/web-design-skill-claude-design/)

教學中的網路與 MAC/IP 範例皆為虛構。ARP spoofing 模擬只改變網頁中的動畫與說明，不會送出任何網路封包。
