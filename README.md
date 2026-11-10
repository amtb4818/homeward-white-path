# 歸去來：白道之旅（Homeward: The White Path）

淨土宗 2D 俯視角闖關遊戲。手機直式優先，電腦同一份程式自動適應。純 HTML／CSS／JavaScript，不需要安裝套件。

## 本機試玩
```
node tools/serve.mjs 4321
```
然後開 http://localhost:4321

## 目前進度
- 已完成可玩：序章（王舍城）、第一章（四十八願碑林）、第二章（陸路與水路）、第三章（二河白道）、第四章（蓮花化生過場）、第五章（極樂七寶池）、終章（回到娑婆）——七章全部可玩

## 與願恩寺相連
- 網址加 `?ch=章節`（prologue、ch1～ch5、finale），開始畫面的按鈕改成「走入〈章名〉」，按下直接進那一章；願恩寺「法寶」經櫥的「走入經中」就是用這個。
- 選單、設定與終章圓滿的卡片都有「回到願恩寺」（網址寫在 `js/main.js` 的 `TEMPLE`，換網域時要一起改）。

## 檔案
- public/：整個遊戲（上線時只送出這個資料夾）
  - js/engine.js：移動、碰撞、A* 點哪走哪、稱名光波、小燈籠、黑霧、光影
  - js/chapters/：各章關卡
  - js/data.js：十二光、章節、法語
  - js/draw.js：人物與佛像繪製（全部程式畫成，沒有圖檔）
  - audio/：佛號與配音音檔（目前為暫用的語音合成版，見裡面的說明）
  - sw.js、manifest.webmanifest：PWA，可加到主畫面、離線可玩
- tools/serve.mjs：本機試玩用的小伺服器
- wrangler.jsonc：Cloudflare 部署設定

## 部署到 Cloudflare（與願恩寺相同做法）
上線版是一個 Cloudflare Worker，只送出 `public/` 的靜態檔案，免費方案即可。

### 從 GitHub 自動部署（推薦）
1. 把這個資料夾推上 GitHub。
2. Cloudflare 主控台 → Workers & Pages → 建立 → 匯入 Git 存放庫，選這個存放庫。
3. 建置指令留空；部署指令 `npx wrangler deploy`；根目錄就是存放庫根目錄。
4. 之後每次推上 GitHub 都會自動重新部署。

### 直接從這台電腦部署
```
npx wrangler login
npx wrangler deploy
```

## 經文
所有引文依 CBETA《大正藏》校對。
