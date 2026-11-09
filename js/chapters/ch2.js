// 第二章【難行與易行——陸路與水路】（出處：龍樹菩薩《十住毘婆沙論・易行品》）
// 左邊崎嶇高山：落石不斷、燈籠漸暗，怎麼走都會被擋回山腳（刻意的「反設計」，試三次後出現提示）。
// 右邊大河：在岸邊稱名，「願船」便來，載著玩家輕鬆到達西岸。
// 重點在「凡夫自力難成」，不是貶低聖道門，用語保持溫和。
import { TILE } from '../engine.js';
import { chibi } from '../draw.js';
import { dialog, hint, toast, grant } from '../ui.js';
import * as A from '../audio.js';

const ROWS = 40, COLS = 13;
const FOOT = 34;          // 山腳／岸邊的第一列
const PUSH_ROW = 12;      // 爬到這裡就會被落石擋回
const BOULDERS = [[2, 29], [4, 26], [1, 23], [3, 20], [5, 17], [2, 15], [4, 11], [1, 8]];
const RIVER_X = 10;

function buildMap() {
  const m = [];
  for (let y = 0; y < ROWS; y++) {
    let r = '';
    for (let x = 0; x < COLS; x++) {
      if (y === ROWS - 1 || x === 0 || x === COLS - 1 && y >= FOOT) r += 'M';
      else if (y >= FOOT) r += (x >= 8 && y === FOOT) ? 'd' : '.';
      else if (x >= 8) r += y <= 2 ? 'g' : 'R';
      else if (x >= 6) r += 'C';
      else if (y <= 3) r += 'M';
      else r += BOULDERS.some(([bx, by]) => bx === x && by === y) ? 'r' : '^';
    }
    m.push(r);
  }
  return m;
}

export function createCh2() {
  const st = { tries: 0, intro: false, boat: 0, talked: false, done: false };
  // boat: 0 未來 / 1 駛來中 / 2 停靠 / 3 載行中 / 4 抵達
  let E = null, rocks = [], rockT = 1, slideT = 0, flash = 0;
  const boat = { x: (RIVER_X + .5) * TILE, y: 0, phase: 0 };

  const hx = 4.5 * TILE, hy = 36.85 * TILE;
  const hermit = {
    id: 'hermit', x: hx, y: hy, h: 42, block: [[4, 36]], name: '山腳的修行人',
    draw: c => chibi(c, hx, hy, { robe: '#a08a6a', sash: '#6a5a40', hair: '#e0e0e0', facing: 'down', after: cc => { cc.strokeStyle = '#6b5236'; cc.lineWidth = 2; cc.beginPath(); cc.moveTo(-11, 0); cc.lineTo(-11, -34); cc.stroke(); } }),
    interact: async () => {
      if (st.tries < 3) {
        await dialog([
          { name: '山腳的修行人', text: '這座山的頂上，就是西方。有大力量的菩薩，能一步一步登上去。' },
          { name: '山腳的修行人', text: '只是山路崎嶇，落石又多。你想試試看，就去吧。' },
        ]);
      } else {
        await dialog([
          { name: '山腳的修行人', text: '走不上去，是嗎？不要難過，我也是這樣。' },
          { name: '山腳的修行人', text: '龍樹菩薩說：佛法有無量門，如世間道，有難有易。', sutra: true },
          { name: '山腳的修行人', text: '陸道步行則苦，水道乘船則樂。', sutra: true },
          { name: '山腳的修行人', text: '到右邊的河岸去，稱念「南無阿彌陀佛」吧。' },
        ]);
        st.talked = true;
      }
    },
  };
  const boatEnt = {
    id: 'boat', x: boat.x, y: 0, hidden: true,
    draw: (c, t) => drawBoat(c, boat.x, boat.y, t),
  };

  function onMountain(p) { return p.x < 6 * TILE && p.y < FOOT * TILE; }

  async function pushBack(reason) {
    st.tries++; slideT = 0; rocks = [];
    const p = E.player;
    A.sfx('bump'); flash = 1;
    await dialog([{ text: reason }]);
    p.x = 3.5 * TILE; p.y = (FOOT + 1.8) * TILE; p.facing = 'up'; p.lantern = 0.6; E.snapCam();
    toast(`被擋回山腳（第 ${st.tries} 次）`);
    if (st.tries === 3) hint('山腳的修行人好像有話要說。<br>或者……看看右邊的大河？', 6000);
  }

  async function callBoat() {
    if (st.boat) return;
    st.boat = 1; boat.y = -2 * TILE; boatEnt.hidden = false;
    A.sfx('grant');
    hint('河的上游，一艘船順著光明駛來……', 4000);
  }

  async function arrive() {
    st.boat = 4;
    await dialog([
      { text: '船行得又穩又快，不一會兒，就到了西岸。' },
      { text: '原來不必自己翻山越嶺，只要乘上阿彌陀佛的願船。' },
      { text: '陸道步行則苦，水道乘船則樂。', sutra: true },
    ]);
    await grant(['wuai'], 'ch2');
    E.complete('ch2', ['wuai'], ['ch2']);
  }

  return {
    id: 'ch2', name: '第二章・陸路與水路', map: buildMap(), start: [6, 37], startFacing: 'up',
    bg: '#2a2a30', ambient: { c: [16, 16, 30], a: 0.45 }, lanternDrain: 0.02, camBias: 0.58,
    theme: 'saha', entities: [hermit, boatEnt],
    tileSolid: ch => ch === 'M' || ch === 'R' || ch === 'C' || ch === 'r',
    drainMul: eng => onMountain(eng.player) ? 6 : 0.5,
    speedFactor: eng => onMountain(eng.player) ? 0.72 : 1,
    lockPlayer: () => st.boat === 3 || st.boat === 4,
    drawTile(c, ch, tx, ty, x, y, t) {
      const high = Math.max(0, (FOOT - ty) / FOOT);
      if (ch === '^' || ch === 'r') {
        c.fillStyle = `rgb(${92 - high * 20},${84 - high * 18},${76 - high * 10})`; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(0,0,0,.15)';
        c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x + 14, y + 22); c.lineTo(x + 26, y + 32); c.lineTo(x + 36, y + 24); c.lineTo(x + 36, y + 36); c.lineTo(x, y + 36); c.fill();
        c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x + (tx * 9) % 26 + 4, y + (ty * 13) % 22 + 4, 5, 2);
        if (ch === 'r') { c.fillStyle = '#7a7068'; c.strokeStyle = '#2a2420'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x + 18, y + 20, 15, 13, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(x + 13, y + 14, 6, 4, -0.5, 0, Math.PI * 2); c.fill(); }
      } else if (ch === 'M') {
        c.fillStyle = '#3a3638'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#4a4548'; c.beginPath(); c.moveTo(x, y + TILE); c.lineTo(x + 18, y + 4 + (tx * 7) % 10); c.lineTo(x + TILE, y + TILE); c.fill();
        if (ty <= 3 && tx > 0 && tx < 6) { c.fillStyle = 'rgba(240,240,255,.5)'; c.beginPath(); c.moveTo(x + 10, y + 14); c.lineTo(x + 18, y + 6); c.lineTo(x + 26, y + 14); c.fill(); }
      } else if (ch === 'C') {
        c.fillStyle = '#2e2a2c'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + 6, y, 3, TILE); c.fillRect(x + 22, y, 2, TILE);
      } else if (ch === 'R') {
        c.fillStyle = '#2f5878'; c.fillRect(x, y, TILE, TILE);
        c.strokeStyle = 'rgba(180,220,250,.35)'; c.lineWidth = 1.4;
        for (let i = 0; i < 2; i++) { const yy = y + ((ty * 9 + i * 18 + t * 30) % 36); c.beginPath(); c.moveTo(x + 4 + i * 10, yy); c.lineTo(x + 16 + i * 10, yy); c.stroke(); }
      } else if (ch === 'g') {
        c.fillStyle = '#e2c27a'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,250,220,.6)'; c.fillRect(x + (tx * 11) % 30, y + (ty * 17) % 30, 2, 2);
      } else if (ch === '.' || ch === 'd') {
        c.fillStyle = '#6a6458'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + (tx * 13) % 24 + 4, y + (ty * 7) % 24 + 4, 5, 3);
        if (ch === 'd') {
          c.fillStyle = '#2f5878'; c.fillRect(x, y, TILE, 10);
          if (tx === RIVER_X) { c.fillStyle = '#8a6a44'; c.fillRect(x + 6, y - 6, 24, TILE - 4); c.fillStyle = '#6a4e30'; for (let i = 0; i < 4; i++) c.fillRect(x + 6, y - 4 + i * 8, 24, 1.5); }
        }
      }
    },
    lights(eng) {
      const L = [{ x: (RIVER_X + .5) * TILE, y: 0, r: TILE * 5, a: 0.9 }];
      if (st.boat) L.push({ x: boat.x, y: boat.y - 20, r: TILE * 3, a: 1 });
      return L;
    },
    drawAdd(c, eng) {
      if (st.boat) { const r = TILE * 2.2; c.globalAlpha = 0.55; c.drawImage(eng.goldSprite, boat.x - r, boat.y - 30 - r, r * 2, r * 2); c.globalAlpha = 1; }
    },
    drawOver(c, eng) {
      for (const r of rocks) {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(r.x, r.gy, 8, 3, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#9a9088'; c.strokeStyle = '#2a2420'; c.lineWidth = 1.5; c.beginPath(); c.arc(r.x, r.y, r.s, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(r.x - 2, r.y - 2, r.s * 0.4, 0, Math.PI * 2); c.fill();
      }
    },
    drawScreen(c, eng) {
      if (flash > 0) { c.fillStyle = `rgba(40,30,20,${flash * 0.5})`; c.fillRect(0, 0, eng.W, eng.H); }
    },
    init(eng) { E = eng; boatEnt.hidden = !st.boat; if (st.boat >= 2) { st.boat = 2; boat.y = (FOOT + .4) * TILE; } },
    update(dt, eng) {
      const p = eng.player;
      flash = Math.max(0, flash - dt * 1.5);
      boat.phase += dt;
      boatEnt.y = boat.y - 10;   // 比小行者先畫，人站在船上

      // 願船
      if (st.boat === 1) {
        boat.y += 150 * dt;
        if (boat.y >= (FOOT + .4) * TILE) { boat.y = (FOOT + .4) * TILE; st.boat = 2; hint('願船靠岸了。走上碼頭，上船吧。', 4000); }
      } else if (st.boat === 2 && !eng.interacting) {
        if (Math.abs(p.x - boat.x) < TILE * 0.9 && p.y < (FOOT + 1.4) * TILE && p.x > 8 * TILE) {
          st.boat = 3; p.x = boat.x; p.y = boat.y - 4; p.facing = 'up';
          A.sfx('portal'); toast('乘上願船');
        }
      } else if (st.boat === 3) {
        boat.y -= 120 * dt; p.x = boat.x; p.y = boat.y - 4;
        if (p.glow < 1) p.glow = 2; p.lantern = 1;
        if (boat.y <= 2.6 * TILE) { boat.y = 2.6 * TILE; p.y = boat.y - 4; eng.interacting = true; arrive().finally(() => { eng.interacting = false; }); }
      }

      // 山路：落石
      if (onMountain(p) && !eng.interacting) {
        rockT -= dt;
        if (rockT <= 0) {
          rockT = 1.3 + Math.random() * 1.2;
          const col = 1 + Math.floor(Math.random() * 5);
          const gy = p.y - TILE * (0.5 + Math.random() * 3);
          rocks.push({ x: (col + .5) * TILE, y: eng.cam.y - 20, gy, vy: 120, s: 5 + Math.random() * 5, hit: false });
        }
        const row = Math.floor(p.y / TILE);
        if (row <= PUSH_ROW + 3 && !slideT) { slideT = 1; hint('上面傳來轟隆隆的聲音……', 2500); }
        if (row <= PUSH_ROW) { eng.interacting = true; pushBack('一陣大落石滾下來，把你擋了回去……').finally(() => { eng.interacting = false; }); return; }
      }
      for (const r of rocks) {
        r.vy += 400 * dt; r.y += r.vy * dt;
        if (!r.hit && Math.hypot(r.x - p.x, r.y - (p.y - 14)) < r.s + 10) {
          r.hit = true; A.sfx('bump'); flash = 0.5;
          p.lantern = Math.max(0.22, p.lantern - 0.25);
          const ny = p.y + TILE * 0.6; if (!eng.boxHits(p.x, ny)) p.y = ny;
          p.path = null;
        }
      }
      rocks = rocks.filter(r => !r.hit && r.y < r.gy + 4);

      // 第一次到山上的提示
      if (onMountain(p) && !st.mHint) { st.mHint = true; hint('山路崎嶇，燈籠越來越暗……', 3000); }
    },
    onChant(eng) {
      const p = eng.player;
      if (p.x > 7.5 * TILE && p.y > (FOOT - 1) * TILE) { callBoat(); return; }
      if (onMountain(p)) hint('佛光照來，彷彿在說：不必獨自翻山，往河邊去吧。', 4000);
    },
    async enter(eng) {
      if (st.intro) return;
      st.intro = true;
      await dialog([
        { text: '往西方去的路上，眼前出現了兩條路。' },
        { text: '左邊是一座崎嶇的高山；右邊是一條平靜的大河。' },
        { text: '山頂與河的上游，都通往西方。' },
      ]);
      hint('往哪邊走都可以。山腳下有一位修行人。', 4500);
    },
    getState() { return { tries: st.tries, intro: st.intro, talked: st.talked, boat: st.boat >= 2 ? 2 : 0 }; },
    setState(s) { Object.assign(st, s); },
  };
}

// 願船：蓮花船首，帆上寫「南無阿彌陀佛」
function drawBoat(c, x, y, t) {
  const bob = Math.sin(t * 2) * 1.5;
  c.save(); c.translate(x, y + bob);
  c.fillStyle = 'rgba(255,255,255,.25)';
  c.beginPath(); c.ellipse(0, 10, 22, 5, 0, 0, Math.PI * 2); c.fill();
  // 船身（直式：船頭朝上）
  c.fillStyle = '#9a6a3a';
  c.beginPath(); c.moveTo(0, -40); c.quadraticCurveTo(17, -26, 15, 6); c.quadraticCurveTo(0, 12, -15, 6); c.quadraticCurveTo(-17, -26, 0, -40); c.fill();
  c.fillStyle = '#c99a5a';
  c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(12, -22, 11, 3); c.quadraticCurveTo(0, 7, -11, 3); c.quadraticCurveTo(-12, -22, 0, -34); c.fill();
  c.strokeStyle = '#e8b84a'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, -40); c.quadraticCurveTo(17, -26, 15, 6); c.quadraticCurveTo(0, 12, -15, 6); c.quadraticCurveTo(-17, -26, 0, -40); c.stroke();
  // 蓮花船首
  c.fillStyle = '#f3a6b8';
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 4, -40, 3, 6, i * 0.4, 0, Math.PI * 2); c.fill(); }
  // 桅與帆
  c.fillStyle = '#6a4a2a'; c.fillRect(-1, -64, 2, 50);
  c.fillStyle = '#fff6e0'; c.strokeStyle = '#e8b84a'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(1, -62); c.quadraticCurveTo(16, -48, 2, -20); c.lineTo(1, -20); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#8a4a00'; c.font = 'bold 5px "Noto Serif TC", serif'; c.textAlign = 'center';
  '南無阿彌陀佛'.split('').forEach((ch, i) => c.fillText(ch, 6, -54 + i * 5.5));
  c.restore();
}
