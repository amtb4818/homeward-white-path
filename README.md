# 歸去來：白道之旅（Homeward: The White Path）

淨土宗 2D 俯視角闖關遊戲。手機直式優先，電腦同一份程式自動適應。純 HTML／CSS／JavaScript，不需要安裝套件。

## 本機試玩
```
node tools/serve.mjs 4321
```
然後開 http://localhost:4321

## 目前進度
- 已完成可玩：序章（王舍城）、第一章（四十八願碑林）、第二章（陸路與水路）、第三章（二河白道）、第四章（蓮花化生過場）、第五章（極樂七寶池）、終章（回到娑婆）——七章全部可玩

## 檔案
- js/engine.js：移動、碰撞、A* 點哪走哪、稱名光波、小燈籠、黑霧、光影
- js/chapters/：各章關卡
- js/data.js：十二光、章節、經文圖鑑、法物
- js/draw.js：人物與佛像繪製（全部程式畫成，沒有圖檔）
- audio/：佛號與配音音檔（見裡面的說明）
- sw.js、manifest.webmanifest：PWA，可加到主畫面、離線可玩

## 上線
整個資料夾直接放到任何靜態網站空間（Cloudflare Pages、GitHub Pages、Netlify）。必須是 https，加到主畫面和離線功能才會生效。
