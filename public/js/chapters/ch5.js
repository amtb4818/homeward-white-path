// 第五章【極樂七寶池】——自由探索（出處：《佛說阿彌陀經》）
// 找到六種演暢法音的鳥；之後「清旦」以衣裓盛眾妙華，飛往他方供佛（飛行小遊戲），食時還到本國。
import { TILE } from '../engine.js';
import { traveler } from '../draw.js';
import { dialog, hint, toast, grant, callText } from '../ui.js';
import { t as tr } from '../i18n.js';
import * as A from '../audio.js';

const COLS = 15, ROWS = 26;
function buildMap() {
  const m = [];
  for (let y = 0; y < ROWS; y++) {
    let r = '';
    for (let x = 0; x < COLS; x++) {
      let ch = 'g';
      if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) ch = '|';
      else if ((y === 2 || y === 22) && x % 2 === 1 && x !== 7) ch = 'T';
      else if (y >= 3 && y <= 5 && x >= 5 && x <= 9) ch = 'B';
      else if (y >= 9 && y <= 15 && x >= 4 && x <= 10) ch = '~';
      else if ([[2, 9], [12, 9], [2, 15], [12, 15]].some(([a, b]) => a === x && b === y)) ch = 'T';
      r += ch;
    }
    m.push(r);
  }
  return m;
}

// 六種法鳥，各說一句法音
const BIRDS = [
  { id: 'he',    tx: 3,  ty: 7,  name: '白鵠', kind: 'crane',
    lines: ['我唱的是「五根」：信、精進、念、定、慧。', '聽了這法音，心中自然念佛、念法、念僧。'] },
  { id: 'kq',    tx: 11, ty: 7,  name: '孔雀', kind: 'peacock',
    lines: ['我唱的是「五力」。', '信力、精進力、念力、定力、慧力。'] },
  { id: 'yw',    tx: 2,  ty: 12, name: '鸚鵡', kind: 'parrot',
    lines: ['我唱的是「七菩提分」。', '這裡晝夜六時，都有和雅的法音。'] },
  { id: 'sl',    tx: 12, ty: 12, name: '舍利', kind: 'shari',
    lines: ['我唱的是「八聖道分」。', '正見、正思惟、正語、正業、正命、正精進、正念、正定。'] },
  { id: 'jl',    tx: 5,  ty: 18, name: '迦陵頻伽', kind: 'kalavinka',
    lines: ['其土眾生，聞是音已，皆悉念佛、念法、念僧。', '我的聲音，是最美妙的法音。'] },
  { id: 'gm',    tx: 9,  ty: 18, name: '共命之鳥', kind: 'jivajiva',
    lines: ['我們是一身兩頭的鳥。', '告訴你一個祕密：我們這些鳥，都是阿彌陀佛為了讓法音宣流，變化而成的。', '所以者何？彼佛國土無三惡趣。'] },
];

export function createCh5() {
  const st = { found: [], flown: false, intro: false, done: false };
  let E = null;
  const petals = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), s: 0.6 + Math.random() * 0.8, r: Math.random() * 6, c: Math.random() }));
  const ents = BIRDS.map(b => {
    const x = (b.tx + .5) * TILE, y = (b.ty + .8) * TILE;
    return {
      id: b.id, x, y, h: 34, block: [[b.tx, b.ty]], name: b.name,
      draw: (c, t) => drawBird(c, x, y, b.kind, t + b.tx, st.found.includes(b.id)),
      interact: async () => {
        const first = !st.found.includes(b.id);
        A.sfx('open');
        await dialog(b.lines.map(text => ({ name: b.name, text, sutra: b.id === 'jl' && text.startsWith('其土') })));
        if (first) {
          st.found.push(b.id);
          toast(tr('找到法鳥 {n}／6', { n: st.found.length }));
          if (b.id === 'gm') E.grantSutra && E.grantSutra('ch5a');
          if (st.found.length === 6) dawn();
        }
      },
    };
  });

  async function dawn() {
    await dialog([
      { text: '天色漸漸明亮。這是極樂世界的清晨。' },
      { text: '其國眾生，常以清旦，各以衣裓盛眾妙華，供養他方十萬億佛。', sutra: true },
      { text: '小行者也捧起衣裓，飛向他方諸佛的國土。' },
    ]);
    startFlight();
  }

  // ---------- 飛行小遊戲 ----------
  let fl = null;
  const FLY_T = 26, OFFER_T = 7;
  function startFlight() {
    fl = { t: 0, x: E ? E.W / 2 : 180, tx: null, got: 0, flowers: [], clouds: Array.from({ length: 9 }, () => ({ x: Math.random() * 520, y: Math.random() * 800, s: 0.5 + Math.random() })), spawn: 0, offered: [] };
    L.custom = true;
    hint('左右移動，把飄落的妙華收進衣裓。<br><small>（按住畫面左右拖曳，或用方向鍵）</small>', 5000);
  }
  async function endFlight() {
    L.custom = false; fl = null;
    st.flown = true;
    E.snapCam();
    await dialog([
      { text: '即以食時，還到本國，飯食經行。', sutra: true },
      { text: '十方諸佛的光明，與阿彌陀佛的光明，交相輝映。' },
      { text: '小行者明白了：這光，無邊、無對、難以思議，也難以言說。' },
    ]);
    await grant(['wubian', 'wudui', 'nansi', 'wucheng'], 'ch5b');
    E.complete('ch5', ['wubian', 'wudui', 'nansi', 'wucheng'], ['ch5a', 'ch5b']);
  }

  function flightUpdate(dt, eng) {
    const f = fl; f.t += dt;
    const W = eng.W, H = eng.H;
    // 操控
    let vx = 0; const k = eng.keys;
    if (k.has('a') || k.has('arrowleft')) vx -= 1;
    if (k.has('d') || k.has('arrowright')) vx += 1;
    if (eng.joy.on) vx += eng.joy.x;
    if (vx) f.tx = null;
    if (f.tx != null) { const d = f.tx - f.x; vx = Math.max(-1, Math.min(1, d / 30)); }
    f.x = Math.max(24, Math.min(W - 24, f.x + vx * 190 * dt));
    for (const c of f.clouds) { c.y += 120 * c.s * dt; if (c.y > H + 60) { c.y = -60; c.x = Math.random() * W; } }
    const py = H * 0.68;
    if (f.t < FLY_T) {
      f.spawn -= dt;
      if (f.spawn <= 0) { f.spawn = 0.32 + Math.random() * 0.25; f.flowers.push({ x: 20 + Math.random() * (W - 40), y: -20, vy: 70 + Math.random() * 50, r: Math.random() * 6, c: Math.random() }); }
    }
    for (const fw of f.flowers) {
      fw.y += fw.vy * dt; fw.x += Math.sin(f.t * 2 + fw.r) * 12 * dt;
      if (!fw.got && Math.hypot(fw.x - f.x, fw.y - (py - 20)) < 28) { fw.got = true; f.got++; A.sfx('tap'); }
    }
    f.flowers = f.flowers.filter(fw => !fw.got && fw.y < H + 30);
    if (f.t >= FLY_T && !f.offering) {
      f.offering = true; f.flowers = [];
      callText('供養他方十萬億佛', '《佛說阿彌陀經》'); A.sfx('grant');
      const n = Math.max(10, Math.min(30, f.got));
      for (let i = 0; i < n; i++) f.offered.push({ i: i % 10, d: i * 0.12, r: Math.random() * 6 });
    }
    if (f.t >= FLY_T + OFFER_T && !f.ending) { f.ending = true; eng.interacting = true; endFlight().finally(() => { eng.interacting = false; }); }
  }

  function flightRender(c, eng) {
    const f = fl, W = eng.W, H = eng.H, t = f.t;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff3cf'); g.addColorStop(0.5, '#f7d9a0'); g.addColorStop(1, '#f3c0c8');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.75)';
    for (const cl of f.clouds) { c.beginPath(); c.ellipse(cl.x, cl.y, 40 * cl.s, 14 * cl.s, 0, 0, Math.PI * 2); c.ellipse(cl.x + 22 * cl.s, cl.y - 8 * cl.s, 26 * cl.s, 12 * cl.s, 0, 0, Math.PI * 2); c.fill(); }
    // 他方諸佛的光明（供養時出現）
    if (f.offering) {
      const k = Math.min(1, (t - FLY_T) / 1.5);
      for (let i = 0; i < 10; i++) {
        const hx = 30 + (i % 5) * ((W - 60) / 4), hy = 90 + Math.floor(i / 5) * 70;
        c.globalAlpha = k; c.globalCompositeOperation = 'lighter';
        c.drawImage(eng.goldSprite, hx - 34, hy - 34, 68, 68);
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = 'rgba(255,230,160,.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(hx, hy, 14, 0, Math.PI * 2); c.stroke();
        c.globalAlpha = 1;
      }
      for (const o of f.offered) {
        const p = Math.max(0, Math.min(1, (t - FLY_T - o.d) / 1.6));
        if (p <= 0) continue;
        const hx = 30 + (o.i % 5) * ((W - 60) / 4), hy = 90 + Math.floor(o.i / 5) * 70;
        const x = f.x + (hx - f.x) * p, y = H * 0.68 - 30 + (hy - H * 0.68 + 30) * p - Math.sin(p * Math.PI) * 40;
        flower(c, x, y, 5, o.r + t, 0.4);
      }
    }
    for (const fw of f.flowers) flower(c, fw.x, fw.y, 7, fw.r + t, fw.c);
    // 小行者與衣裓
    const py = H * 0.68;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(eng.goldSprite, f.x - 50, py - 70, 100, 100); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    traveler(c, f.x, py + Math.sin(t * 3) * 3, 'up', 0, 1, eng.lampColor);
    c.fillStyle = '#f7e6c8'; c.strokeStyle = '#c98a2b'; c.lineWidth = 1.2;
    // 衣裓捧在胸前：半月形的布兜
    const by = py - 9 + Math.sin(t * 3) * 3;
    c.beginPath(); c.moveTo(f.x - 14, by - 4); c.quadraticCurveTo(f.x, by + 12, f.x + 14, by - 4); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < Math.min(8, f.got); i++) flower(c, f.x - 10 + (i % 4) * 7, by - 5 - Math.floor(i / 4) * 4, 3.2, i, (i * 0.37) % 1);
    // 數量
    c.font = 'bold 16px "Noto Serif TC", serif'; c.textAlign = 'center'; c.fillStyle = '#6b3d00';
    c.fillText(tr('衣裓中的妙華　{n}', { n: f.got }), W / 2, H - 200);
    if (!f.offering) {
      c.fillStyle = 'rgba(107,61,0,.25)'; c.fillRect(W / 2 - 80, H - 190, 160, 5);
      c.fillStyle = '#c98a2b'; c.fillRect(W / 2 - 80, H - 190, 160 * Math.min(1, t / FLY_T), 5);
    }
  }

  const L = {
    id: 'ch5', name: '第五章・極樂七寶池', map: buildMap(), start: [7, 20], startFacing: 'up',
    bg: '#e9cf8a', ambient: { c: [0, 0, 0], a: 0 }, lanternDrain: 0, camBias: 0.55,
    theme: 'pure', entities: ents, custom: false,
    tileSolid: ch => ch === '|' || ch === 'T' || ch === 'B' || ch === '~',
    drawTile(c, ch, tx, ty, x, y, t, eng) {
      c.fillStyle = '#ecd393'; c.fillRect(x, y, TILE, TILE);
      c.fillStyle = 'rgba(255,255,240,.85)';
      for (let i = 0; i < 3; i++) { const a = (Math.sin(t * 2.2 + tx * 3.1 + ty * 5.3 + i * 2) + 1) / 2; c.globalAlpha = a; c.fillRect(x + (tx * 11 + i * 13) % 32, y + (ty * 17 + i * 9) % 32, 2, 2); }
      c.globalAlpha = 1;
      if (ch === '~') {
        c.fillStyle = '#86d3e3'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(232,200,120,.35)'; c.fillRect(x + 4, y + 26, 28, 6); // 池底金沙
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(x + 12 + Math.sin(t + tx) * 3, y + 12, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        const edge = (dx, dy) => eng.grid[ty + dy] && eng.grid[ty + dy][tx + dx] !== '~';
        c.fillStyle = '#d9b35a';
        if (edge(0, -1)) c.fillRect(x, y, TILE, 3); if (edge(0, 1)) c.fillRect(x, y + TILE - 3, TILE, 3);
        if (edge(-1, 0)) c.fillRect(x, y, 3, TILE); if (edge(1, 0)) c.fillRect(x + TILE - 3, y, 3, TILE);
        if ((tx * 7 + ty * 3) % 3 === 0) {
          const cols = ['#7aa7e0', '#f2c94c', '#e86a6a', '#ffffff'];   // 青、黃、赤、白
          lotus(c, x + 18, y + 20, 7, cols[(tx + ty) % 4]);
        }
      } else if (ch === '|') {
        c.fillStyle = '#9fd8c8'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#e8b84a'; c.fillRect(x, y + 10, TILE, 4); c.fillRect(x, y + 22, TILE, 4);
        c.fillStyle = '#d8e8f0'; c.fillRect(x + 4, y + 4, 5, 28); c.fillRect(x + 22, y + 4, 5, 28);
      } else if (ch === 'T') {
        c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x + 18, y + 32, 14, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#d9a840'; c.fillRect(x + 15, y + 16, 6, 16);
        const gems = ['#f2c94c', '#e0e6ee', '#5f8fd0', '#c8f0f8'];   // 金、銀、琉璃、玻璃
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2 + t * 0.2;
          c.fillStyle = gems[(i + tx) % 4];
          c.beginPath(); c.arc(x + 18 + Math.cos(a) * 10, y + 12 + Math.sin(a) * 8, 6.5, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(x + 18, y + 12, 5, 0, Math.PI * 2); c.fill();
      } else if (ch === 'B') {
        const top = eng.grid[ty - 1] && eng.grid[ty - 1][tx] !== 'B';
        const bottom = eng.grid[ty + 1] && eng.grid[ty + 1][tx] !== 'B';
        c.fillStyle = '#f3dfa8'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#d0a040'; c.fillRect(x, y, TILE, 2);
        if (top) { c.fillStyle = '#c98a2b'; c.fillRect(x - 2, y, TILE + 4, 12); c.fillStyle = '#e8b84a'; c.fillRect(x - 2, y + 10, TILE + 4, 3); }
        if (bottom) { c.fillStyle = '#9fd8c8'; c.fillRect(x + 8, y + 12, 20, 24); if (tx === 7) { c.fillStyle = '#c98a2b'; c.fillRect(x + 12, y + 16, 12, 20); } }
        else { c.fillStyle = '#9fd8c8'; c.fillRect(x + 6, y + 14, 8, 10); c.fillRect(x + 22, y + 14, 8, 10); }
      }
    },
    drawScreen(c, eng) {
      if (L.custom) return;
      // 天雨曼陀羅華
      const W = eng.W, H = eng.H;
      for (const p of petals) {
        p.y += 0.0009 * p.s; p.x += Math.sin(eng.t + p.r) * 0.0004;
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
        c.fillStyle = p.c > 0.5 ? 'rgba(255,255,255,.85)' : 'rgba(247,184,198,.85)';
        c.beginPath(); c.ellipse(p.x * W, p.y * H, 3 * p.s, 2 * p.s, eng.t + p.r, 0, Math.PI * 2); c.fill();
      }
    },
    init(eng) { E = eng; },
    update(dt, eng) { if (L.custom && fl) flightUpdate(dt, eng); },
    render(c, eng) { if (fl) flightRender(c, eng); },
    onPointer(type, x, y, buttons) {
      if (!fl) return;
      if (type === 'pointerdown' || (type === 'pointermove' && buttons)) fl.tx = x;
      if (type === 'pointerup' || type === 'pointercancel') fl.tx = null;
    },
    onChant() { hint('「其土眾生，聞是音已，皆悉念佛、念法、念僧。」', 3000); },
    async enter(eng) {
      if (st.intro) return;
      st.intro = true;
      await dialog([
        { text: '從是西方，過十萬億佛土，有世界名曰極樂。', sutra: true },
        { text: '七重欄楯、七重羅網、七重行樹，皆是四寶周匝圍繞。', sutra: true },
        { text: '極樂國土有七寶池，八功德水充滿其中，池底純以金沙布地。', sutra: true },
        { text: '池中蓮花，大如車輪，青色青光，黃色黃光，赤色赤光，白色白光，微妙香潔。', sutra: true },
      ]);
      hint('聽說這裡有六種鳥，會唱出和雅的法音。<br>去找找牠們吧（0／6）。', 5000);
    },
    getState() { return { found: [...st.found], intro: st.intro }; },
    setState(s) { st.found = [...(s.found || [])]; st.intro = !!s.intro; },
  };
  return L;
}

function lotus(c, x, y, r, col) {
  c.fillStyle = '#4a9a6a'; c.beginPath(); c.ellipse(x, y + 3, r * 1.4, r * 0.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = col;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(x + i * r * 0.35, y - r * 0.3, r * 0.3, r * 0.75, i * 0.35, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(x, y - r * 0.2, r * 0.22, 0, Math.PI * 2); c.fill();
}
function flower(c, x, y, r, rot, hue) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = hue > 0.5 ? '#ffffff' : '#f7b8c6';
  for (let i = 0; i < 5; i++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.ellipse(0, -r * 0.6, r * 0.38, r * 0.62, 0, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 0, r * 0.28, 0, Math.PI * 2); c.fill();
  c.restore();
}

// 六種法鳥
function drawBird(c, x, y, kind, t, found) {
  const hop = Math.max(0, Math.sin(t * 2.3)) * 2.5;
  c.save(); c.translate(x, y - hop);
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(0, hop, 10, 3, 0, 0, Math.PI * 2); c.fill();
  const body = { crane: '#ffffff', peacock: '#2f7f8a', parrot: '#4caf50', shari: '#a0784a', kalavinka: '#f2c94c', jivajiva: '#e88a5a' }[kind];
  if (kind === 'peacock') {
    for (let i = -3; i <= 3; i++) { c.fillStyle = i % 2 ? '#3aa07a' : '#2a7aa0'; c.beginPath(); c.ellipse(i * 4, -16, 3.5, 13, i * 0.25, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(i * 4 + Math.sin(i * .25) * 10, -26, 2, 0, Math.PI * 2); c.fill(); }
  }
  // 腳
  c.strokeStyle = kind === 'crane' ? '#333' : '#c98a2b'; c.lineWidth = 1.4;
  const legH = kind === 'crane' ? 12 : 4;
  c.beginPath(); c.moveTo(-2, 0); c.lineTo(-2, -legH); c.moveTo(2, 0); c.lineTo(2, -legH); c.stroke();
  // 身
  c.fillStyle = body;
  c.beginPath(); c.ellipse(0, -legH - 7, 9, 7, 0, 0, Math.PI * 2); c.fill();
  const wing = Math.sin(t * 6) * 0.3;
  c.fillStyle = kind === 'crane' ? '#e8e8e8' : 'rgba(0,0,0,.15)';
  c.beginPath(); c.ellipse(3, -legH - 8, 6, 3.5, 0.4 + wing, 0, Math.PI * 2); c.fill();
  const head = (hx, hy) => {
    c.fillStyle = kind === 'kalavinka' ? '#f7d58a' : body;
    c.beginPath(); c.arc(hx, hy, 4.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222'; c.beginPath(); c.arc(hx - 1.5, hy - 0.5, 0.9, 0, Math.PI * 2); c.fill();
    c.fillStyle = kind === 'crane' ? '#e0a030' : '#e8a030';
    c.beginPath(); c.moveTo(hx - 4, hy); c.lineTo(hx - (kind === 'crane' ? 10 : 7), hy + 1); c.lineTo(hx - 4, hy + 1.8); c.fill();
    if (kind === 'crane') { c.fillStyle = '#d33'; c.beginPath(); c.arc(hx, hy - 4, 1.6, 0, Math.PI * 2); c.fill(); }
    if (kind === 'kalavinka') { c.fillStyle = '#e8b84a'; c.beginPath(); c.moveTo(hx - 3, hy - 4); c.lineTo(hx, hy - 9); c.lineTo(hx + 3, hy - 4); c.fill(); }
  };
  const nk = kind === 'crane' ? 10 : 4;
  if (kind === 'jivajiva') { head(-4, -legH - 14 - 2); head(5, -legH - 14 - 2); }
  else { if (kind === 'crane') { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-4, -legH - 10); c.lineTo(-4, -legH - 10 - nk); c.stroke(); } head(-4, -legH - 12 - nk); }
  if (found) { c.fillStyle = 'rgba(255,214,120,.9)'; c.font = '10px serif'; c.textAlign = 'center'; c.fillText('♪', 10 + Math.sin(t * 3) * 2, -legH - 22 - Math.abs(Math.sin(t * 2)) * 4); }
  c.restore();
}
