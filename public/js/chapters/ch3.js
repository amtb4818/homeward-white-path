// 第三章【二河白道】（出處：善導大師《觀經四帖疏・散善義》）
// 手機直式：地圖由下往上，下方東岸（釋迦發遣）、上方西岸（彌陀召喚）。
// 南（左）火河＝瞋憎，北（右）水河＝貪愛，中間四五寸白道。
import { TILE } from '../engine.js';
import { buddha } from '../draw.js';
import { dialog, hint, toast, choice, grant } from '../ui.js';
import * as A from '../audio.js';

const COLS = 11, PATH = 5;
const WEST_END = 6, EAST_START = 67, ROWS = 75;
const FOG_ROWS = [61, 48, 31, 15];
const CHECKPOINTS = [57, 41, 23];
const CALL_ROW = 35;

function buildMap() {
  const m = [];
  for (let y = 0; y < ROWS; y++) {
    let r = '';
    for (let x = 0; x < COLS; x++) {
      if (y <= WEST_END) r += (y <= 1 && (x <= 1 || x >= 9)) || (y === 0) ? 'l' : 'g';
      else if (y >= EAST_START) r += (y >= 73 && (x === 0 || x === 10)) ? 'b' : 'e';
      else r += x < PATH ? 'F' : x > PATH ? 'R' : (FOG_ROWS.includes(y) ? 'f' : 'w');
    }
    m.push(r);
  }
  return m;
}

export function createCh3() {
  const st = { intro: false, cp: [], called: false, arrived: false, coverHint: false, bumps: 0 };
  let shoutT = 6, shout = null;

  const ax = (PATH + .5) * TILE, ay = 2.95 * TILE;
  const amitabha = { id: 'amitabha', x: ax, y: ay, block: [[4, 1], [5, 1], [6, 1], [4, 2], [5, 2], [6, 2]], draw: (c, t) => buddha(c, ax, ay, 112, 'amitabha', t, 1.2) };
  const sx = (PATH + .5) * TILE, sy = 73.9 * TILE;
  const shakya = { id: 'shakya', x: sx, y: sy, block: [[4, 72], [5, 72], [6, 72], [4, 73], [5, 73], [6, 73]], draw: (c, t) => buddha(c, sx, sy, 100, 'shakyamuni', t, 0.9) };
  const bandits = [[1.4, 72.6], [2.6, 74.2], [8.6, 72.8], [9.5, 74.3], [1.8, 70.2], [9.2, 70.4]].map(([bx, by], i) => ({
    id: 'b' + i, x: bx * TILE, y: by * TILE,
    draw: (c, t) => drawShadow(c, bx * TILE, by * TILE, t + i, i % 3 === 1),
  }));

  // 水火波浪：每一列各自週期湧上白道
  function cover(row, t, eng) {
    if (row <= WEST_END || row >= EAST_START) return { f: 0, w: 0 };
    const p = eng.player;
    if (p.glow > 0 && Math.abs(row - p.y / TILE) < 9) return { f: 0, w: 0, lit: Math.min(1, p.glow / 1.5) };
    const amp = 0.88 + 0.22 * Math.sin(t * 0.21 + row * 0.07);
    const f = Math.sin(t * 1.4 + row * 0.5) * amp, w = Math.sin(t * 1.22 - row * 0.43 + 2) * amp;
    return { f: f > 0.7 ? (f - 0.7) / 0.4 : 0, w: w > 0.7 ? (w - 0.7) / 0.4 : 0 };
  }

  async function checkpoint(eng, i) {
    st.cp.push(i);
    const pick = await choice('身 後 傳 來 呼 喚', '要回頭嗎？',
      '群賊惡獸在東岸喊著：「仁者迴來，此道嶮惡不得過，必死不疑，我等眾無惡心相向。」',
      ['回頭看看', '不理會，一心稱名前行']);
    if (pick === 0) {
      await dialog([
        { text: '你停下腳步，回頭望了一眼……' },
        { name: '釋迦牟尼佛（東岸）', text: '仁者但決定尋此道行，必無死難；若住即死。', sutra: true, voice: 'voice_faqian' },
        { text: '不必回頭，繼續向西走吧。' },
      ]);
    } else {
      eng.chant(); toast('一心正念，直向西行');
    }
  }

  async function call(eng) {
    st.called = true;
    await dialog([
      { text: '這時，西岸傳來呼喚——', sfx: 'open' },
      { name: '阿彌陀佛（西岸）', text: '汝一心正念直來，我能護汝，眾不畏墮於水火之難。', sutra: true, voice: 'voice_zhaohuan' },
    ]);
    eng.grantSutra && eng.grantSutra('ch3b');
  }

  async function arrive(eng) {
    st.arrived = true;
    await dialog([
      { text: '須臾即到西岸，永離諸難。善友相見，慶樂無已。', sutra: true },
      { text: '阿彌陀佛垂手相迎，光明照著小行者全身。' },
      { text: '水火的波浪、身後的喊聲，都已遠遠地留在東岸了。' },
    ]);
    await grant(['yanwang', 'buduan'], 'ch3b');
    eng.complete('ch3', ['yanwang', 'buduan'], ['ch3a', 'ch3b', 'ch3c']);
  }

  return {
    id: 'ch3', name: '第三章・二河白道', map: buildMap(), fogBase: 'w',
    start: [PATH, 69], startFacing: 'up',
    bg: '#120c18', ambient: { c: [10, 6, 20], a: 0.7 }, lanternDrain: 0.05, camBias: 0.64,
    theme: 'river', chantRadius: 3.4,
    glowTime: eng => (eng.lights && eng.lights.includes('buduan')) ? 6.5 : 4.5,
    entities: [amitabha, shakya, ...bandits],
    tileSolid: ch => ch === 'F' || ch === 'R' || ch === 'l' || ch === 'b',
    drawTile(c, ch, tx, ty, x, y, t, eng) {
      if (ch === 'F') drawFire(c, x, y, TILE, t, tx, ty);
      else if (ch === 'R') drawWater(c, x, y, TILE, t, tx, ty);
      else if (ch === 'w') {
        drawFire(c, x, y, 11, t, tx, ty); drawWater(c, x + 25, y, 11, t, tx, ty);
        const cv = cover(ty, t, eng);
        c.fillStyle = cv.lit ? `rgb(255,${246 - cv.lit * 10},${226 - cv.lit * 40})` : '#e9e5d8';
        c.fillRect(x + 11, y, 14, TILE);
        c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(x + 11, y, 1.5, TILE); c.fillRect(x + 23.5, y, 1.5, TILE);
        if (cv.f) { c.fillStyle = `rgba(255,110,40,${0.5 + cv.f * 0.4})`; flameTongue(c, x + 11, y + TILE, 14 * Math.min(1, cv.f + .3), TILE, t + ty); }
        if (cv.w) { c.fillStyle = `rgba(70,140,210,${0.55 + cv.w * 0.35})`; c.fillRect(x + 25 - 14 * Math.min(1, cv.w + .3), y + 4, 14 * Math.min(1, cv.w + .3), TILE - 8); }
      } else if (ch === 'e' || ch === 'b') {
        c.fillStyle = '#5a5249'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + (tx * 13) % 24 + 4, y + (ty * 7) % 24 + 4, 5, 3);
        if (ty === EAST_START) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y, TILE, 4); }
        if (ch === 'b') { c.fillStyle = '#3a342e'; c.beginPath(); c.arc(x + 18, y + 20, 15, 0, Math.PI * 2); c.fill(); }
      } else if (ch === 'g' || ch === 'l') {
        c.fillStyle = '#e2c27a'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,250,220,.7)';
        for (let i = 0; i < 3; i++) { const sp = (Math.sin(t * 2 + tx * 3 + ty * 5 + i * 2) + 1) / 2; c.globalAlpha = sp; c.fillRect(x + (tx * 11 + i * 13) % 32, y + (ty * 17 + i * 9) % 32, 2, 2); }
        c.globalAlpha = 1;
        if (ty === WEST_END) { c.fillStyle = 'rgba(120,80,20,.2)'; c.fillRect(x, y + TILE - 4, TILE, 4); }
        if (ch === 'l') {
          c.fillStyle = '#5fb3c9'; c.fillRect(x, y, TILE, TILE);
          c.fillStyle = '#7ccbdc'; c.fillRect(x, y + 8, TILE, 2);
          if ((tx + ty) % 2 === 0) { lotus(c, x + 18, y + 22, 7); }
        }
      }
    },
    lights(eng) {
      const L = [{ x: ax, y: ay - 50, r: TILE * 7.5, a: 1 }];
      const v = eng.view;
      if (v) for (let y = v.y0 - (v.y0 % 3); y <= v.y1; y += 3) if (y > WEST_END && y < EAST_START) L.push({ x: 2.2 * TILE, y: (y + .5) * TILE, r: TILE * 1.8, a: 0.16 + 0.06 * Math.sin(eng.t * 5 + y) });
      return L;
    },
    drawAdd(c, eng) {
      const v = eng.view, t = eng.t;
      if (v) for (let y = v.y0; y <= v.y1; y++) {
        if (y <= WEST_END || y >= EAST_START) continue;
        const fl = 0.18 + 0.1 * Math.sin(t * 7 + y * 1.7);
        c.globalAlpha = fl; c.drawImage(eng.fireSprite, 3.6 * TILE - 30, (y + .5) * TILE - 30, 60, 60);
        const cv = cover(y, t, eng);
        if (cv.f) { c.globalAlpha = 0.5 * cv.f; c.drawImage(eng.fireSprite, (PATH + .5) * TILE - 26, (y + .5) * TILE - 26, 52, 52); }
        if (cv.lit) { c.globalAlpha = 0.35 * cv.lit; c.drawImage(eng.goldSprite, (PATH + .5) * TILE - 30, (y + .5) * TILE - 30, 60, 60); }
      }
      const r = TILE * 5 + Math.sin(t) * 6;
      c.globalAlpha = 0.6; c.drawImage(eng.goldSprite, ax - r, ay - 50 - r, r * 2, r * 2);
      c.globalAlpha = 1;
    },
    drawScreen(c, eng) {
      if (!shout) return;
      const a = Math.min(1, shout.t * 3, (2.6 - shout.t) * 2);
      if (a <= 0) return;
      c.save(); c.globalAlpha = a;
      c.font = 'bold 15px "Noto Serif TC", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const x = eng.W / 2 + shout.dx, y = eng.H - 214;
      const w = c.measureText(shout.s).width + 24;
      c.fillStyle = 'rgba(30,20,30,.82)'; c.strokeStyle = 'rgba(200,80,80,.6)'; c.lineWidth = 1.5;
      c.beginPath(); c.roundRect ? c.roundRect(x - w / 2, y - 16, w, 32, 14) : c.rect(x - w / 2, y - 16, w, 32); c.fill(); c.stroke();
      c.fillStyle = '#f0c8c8'; c.fillText(shout.s, x, y + 1);
      c.fillStyle = 'rgba(30,20,30,.82)'; c.beginPath(); c.moveTo(x - 6, y + 16); c.lineTo(x, y + 26); c.lineTo(x + 6, y + 16); c.fill();
      c.restore();
    },
    speedFactor(eng) {
      const row = Math.floor((eng.player.y - 4) / TILE);
      const cv = cover(row, eng.t, eng);
      return (cv.f || cv.w) ? 0.35 : 1;
    },
    drainMul(eng) {
      const row = Math.floor((eng.player.y - 4) / TILE);
      if (row <= WEST_END) return 0;
      const cv = cover(row, eng.t, eng);
      return (cv.f || cv.w) ? 3 : 1;
    },
    init(eng) {},
    update(dt, eng) {
      const p = eng.player, row = Math.floor((p.y - 4) / TILE);
      if (shout) { shout.t += dt; if (shout.t > 2.6) shout = null; }
      if (row < 64 && row > WEST_END) {
        shoutT -= dt;
        if (shoutT <= 0) {
          shoutT = 8 + Math.random() * 6;
          const lines = ['迴來吧！', '此道嶮惡！', '過不去的！', '我們沒有惡意……'];
          shout = { s: lines[Math.floor(Math.random() * lines.length)], t: 0, dx: (Math.random() - .5) * 120 };
        }
      }
      if (eng.interacting) return;
      if (!st.coverHint && row < EAST_START && row > WEST_END) {
        const cv = cover(row, eng.t, eng);
        if (cv.f || cv.w) { st.coverHint = true; hint('水火漫上白道，腳步變得沉重……<br>稱念「南無阿彌陀佛」，白道就會發亮。', 5000); }
      }
      for (let i = 0; i < CHECKPOINTS.length; i++) {
        if (!st.cp.includes(i) && row <= CHECKPOINTS[i]) { run(eng, checkpoint(eng, i)); return; }
      }
      if (!st.called && row <= CALL_ROW) { run(eng, call(eng)); return; }
      if (!st.arrived && p.y < (WEST_END + .6) * TILE) { run(eng, arrive(eng)); return; }
    },
    onBumpFog(eng) {
      st.bumps++;
      hint(st.bumps < 2 ? '煩惱黑霧擋住了白道。' : '稱念「南無阿彌陀佛」，佛光會驅散黑霧。', 3200);
    },
    async enter(eng) {
      if (st.intro) return;
      st.intro = true;
      await dialog([
        { text: '眼前有兩條河：南邊是火河，北邊是水河。' },
        { text: '兩河之間，只有一條四五寸寬的白道，從東岸直通西岸。' },
        { text: '火焰燒著白道，水波漫著白道，一刻也不停息。' },
        { text: '這時，東岸傳來勸勉的聲音——' },
        { name: '釋迦牟尼佛（東岸）', text: '仁者但決定尋此道行，必無死難；若住即死。', sutra: true, voice: 'voice_faqian' },
      ]);
      eng.grantSutra && eng.grantSutra('ch3a');
      hint('往上（西方）走。水火湧上來時，稱念「南無阿彌陀佛」。', 5000);
    },
    getState() { return { ...st, cp: [...st.cp] }; },
    setState(s) { Object.assign(st, s); st.cp = [...(s.cp || [])]; },
  };
}

function run(eng, promise) {
  eng.interacting = true; eng.player.path = null;
  promise.finally(() => { eng.interacting = false; });
}

function drawFire(c, x, y, w, t, tx, ty) {
  const g = c.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, '#4a120a'); g.addColorStop(1, '#6e1c0c');
  c.fillStyle = g; c.fillRect(x, y, w, TILE);
  c.fillStyle = 'rgba(255,120,40,.75)';
  flameTongue(c, x, y + TILE, w, TILE * (0.6 + 0.3 * Math.sin(t * 6 + tx * 2 + ty)), t + tx + ty * 1.3);
  c.fillStyle = 'rgba(255,200,90,.65)';
  flameTongue(c, x + w * 0.2, y + TILE, w * 0.6, TILE * (0.35 + 0.2 * Math.sin(t * 8 + ty * 2)), t * 1.3 + ty);
}
function flameTongue(c, x, base, w, h, ph) {
  c.beginPath(); c.moveTo(x, base);
  const n = Math.max(1, Math.round(w / 9));
  for (let i = 0; i < n; i++) {
    const x0 = x + (i / n) * w, x1 = x + ((i + 1) / n) * w, mid = (x0 + x1) / 2;
    const hh = h * (0.7 + 0.3 * Math.sin(ph * 5 + i * 2.1));
    c.quadraticCurveTo(x0, base - hh * 0.5, mid + Math.sin(ph * 4 + i) * 2, base - hh);
    c.quadraticCurveTo(x1, base - hh * 0.5, x1, base);
  }
  c.closePath(); c.fill();
}
function drawWater(c, x, y, w, t, tx, ty) {
  c.fillStyle = '#0f2a48'; c.fillRect(x, y, w, TILE);
  c.strokeStyle = 'rgba(110,170,230,.5)'; c.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) {
    const yy = y + 10 + i * 16 + Math.sin(t * 2 + tx + ty * 0.7 + i) * 3;
    c.beginPath();
    for (let xx = 0; xx <= w; xx += 4) {
      const py = yy + Math.sin((x + xx) * 0.25 + t * 3 + i * 2) * 2.2;
      xx === 0 ? c.moveTo(x + xx, py) : c.lineTo(x + xx, py);
    }
    c.stroke();
  }
}
function lotus(c, x, y, r) {
  c.fillStyle = '#4a9a6a'; c.beginPath(); c.ellipse(x, y + 3, r * 1.4, r * 0.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#f3a6b8';
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(x + i * r * 0.35, y - r * 0.3, r * 0.3, r * 0.75, i * 0.35, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(x, y - r * 0.2, r * 0.22, 0, Math.PI * 2); c.fill();
}
// 群賊惡獸（只是剪影與發光眼睛，不做驚嚇造型）
function drawShadow(c, x, y, t, beast) {
  const sway = Math.sin(t * 1.5) * 2;
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y, 12, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(28,22,32,.92)';
  c.beginPath();
  if (beast) { c.ellipse(x + sway, y - 10, 15, 10, 0, 0, Math.PI * 2); c.moveTo(x + 10 + sway, y - 18); c.lineTo(x + 16 + sway, y - 28); c.lineTo(x + 18 + sway, y - 16); }
  else { c.moveTo(x - 10, y); c.quadraticCurveTo(x - 12 + sway, y - 30, x + sway, y - 36); c.quadraticCurveTo(x + 12 + sway, y - 30, x + 10, y); }
  c.fill();
  c.fillStyle = 'rgba(255,90,80,.85)';
  const ey = beast ? y - 12 : y - 26;
  c.fillRect(x - 4 + sway, ey, 2.5, 2); c.fillRect(x + 2 + sway, ey, 2.5, 2);
}
