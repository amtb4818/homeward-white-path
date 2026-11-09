// 遊戲引擎：地圖、移動、碰撞、尋路、稱名光波、小燈籠、黑霧、光影
import * as A from './audio.js';
import { ui, dialogOpen, dialogNext } from './ui.js';
import { traveler, fogPuff } from './draw.js';

export const TILE = 36;
const VIEW_W = 360;
const SPEED = 88;

function radialSprite(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), h = size / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}

export class Engine {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.dark = document.createElement('canvas'); this.dctx = this.dark.getContext('2d');
    // 光暈預先畫好重複使用
    this.cutSprite = radialSprite(128, [[0, 'rgba(0,0,0,1)'], [0.45, 'rgba(0,0,0,.9)'], [1, 'rgba(0,0,0,0)']]);
    this.goldSprite = radialSprite(128, [[0, 'rgba(255,224,150,.75)'], [0.35, 'rgba(255,200,110,.35)'], [1, 'rgba(255,190,90,0)']]);
    this.coldSprite = radialSprite(64, [[0, 'rgba(220,235,255,.35)'], [1, 'rgba(220,235,255,0)']]);
    this.fireSprite = radialSprite(64, [[0, 'rgba(255,120,40,.55)'], [1, 'rgba(255,80,20,0)']]);
    this.keys = new Set(); this.joy = { x: 0, y: 0, on: false };
    this.level = null; this.t = 0; this.paused = false;
    this.waves = []; this.parts = []; this.texts = [];
    this.player = { x: 0, y: 0, facing: 'up', phase: 0, lantern: 1, glow: 0, path: null };
    this.cam = { x: 0, y: 0 };
    this.fog = new Map(); this.blocks = new Set();
    this.lampColor = [220, 235, 255];
    this.bead = 'cycle';
    this.hooks = { hud: () => {}, chant: () => {}, interactReady: () => {} };
    this.bumpT = 0; this.focus = null; this.pending = null; this.interacting = false;
    this.resize();
    addEventListener('resize', () => this.resize());
    this.bindInput();
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width) return;
    this.W = VIEW_W; this.scale = r.width / VIEW_W; this.H = r.height / this.scale;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = Math.round(r.width * this.dpr); this.cv.height = Math.round(r.height * this.dpr);
    this.ds = 0.5;
    this.dark.width = Math.ceil(this.W * this.ds); this.dark.height = Math.ceil(this.H * this.ds);
    if (this.level) this.snapCam();
  }

  // ---------- 關卡 ----------
  load(level, state) {
    this.level = level;
    this.grid = level.map.map(r => r.split(''));
    this.rows = this.grid.length; this.cols = this.grid[0].length;
    this.fog.clear(); this.waves = []; this.parts = []; this.texts = [];
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      if (this.grid[y][x] === 'f') { this.grid[y][x] = level.fogBase || '.'; this.fog.set(`${x},${y}`, { a: 1, clearing: false }); }
    }
    const p = this.player;
    p.x = (level.start[0] + 0.5) * TILE; p.y = (level.start[1] + 0.8) * TILE;
    p.facing = level.startFacing || 'up'; p.lantern = 1; p.glow = 0; p.path = null;
    this.pending = null; this.interacting = false; this.t = 0;
    if (state) {
      if (state.x) { p.x = state.x; p.y = state.y; }
      (state.fog || []).forEach(k => this.fog.delete(k));
      level.setState && level.setState(state.st || {}, this);
    }
    level.init && level.init(this);
    this.refreshBlocks();
    this.snapCam();
  }
  unload() { this.level = null; }

  snapshot() {
    if (!this.level || this.level.custom) return null;
    const cleared = [];
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const k = `${x},${y}`;
      if (this.level.map[y][x] === 'f' && !this.fog.has(k)) cleared.push(k);
    }
    return { x: this.player.x, y: this.player.y, fog: cleared, st: this.level.getState ? this.level.getState() : {} };
  }

  refreshBlocks() {
    this.blocks.clear(); this.blockEnt = new Map();
    for (const e of this.level.entities || []) if (!e.hidden) (e.block || []).forEach(([x, y]) => { this.blocks.add(`${x},${y}`); this.blockEnt.set(`${x},${y}`, e); });
  }

  isSolid(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return true;
    const k = `${tx},${ty}`;
    const f = this.fog.get(k); if (f && f.a > 0.35) return true;
    if (this.blocks.has(k)) return true;
    if (this.level.tileSolid(this.grid[ty][tx], tx, ty, this)) return true;
    return false;
  }
  fogAt(tx, ty) { const f = this.fog.get(`${tx},${ty}`); return f && f.a > 0.35; }
  boxHits(x, y) {
    const pts = [[x - 8, y - 9], [x + 8, y - 9], [x - 8, y - 1], [x + 8, y - 1]];
    for (const [px, py] of pts) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (this.isSolid(tx, ty)) return [tx, ty];
    }
    return null;
  }

  // ---------- A* 尋路（8 方向，不切角） ----------
  findPath(sx, sy, gx, gy) {
    if (this.isSolid(gx, gy)) return null;
    const key = (x, y) => y * this.cols + x;
    const open = [{ x: sx, y: sy, g: 0, f: 0 }];
    const came = new Map(), gs = new Map([[key(sx, sy), 0]]);
    const h = (x, y) => Math.hypot(gx - x, gy - y);
    let n = 0;
    while (open.length && n++ < 5000) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === gx && cur.y === gy) {
        const path = [[gx, gy]]; let k = key(gx, gy);
        while (came.has(k)) { const [px, py] = came.get(k); path.unshift([px, py]); k = key(px, py); }
        path.shift(); return path;
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cur.x + dx, ny = cur.y + dy;
        if (this.isSolid(nx, ny)) continue;
        if (dx && dy && (this.isSolid(cur.x + dx, cur.y) || this.isSolid(cur.x, cur.y + dy))) continue;
        const ng = cur.g + (dx && dy ? 1.414 : 1), k = key(nx, ny);
        if (ng < (gs.get(k) ?? Infinity)) {
          gs.set(k, ng); came.set(k, [cur.x, cur.y]);
          open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny) });
        }
      }
    }
    return null;
  }

  walkTo(wx, wy, entity) {
    const p = this.player;
    const sx = Math.floor(p.x / TILE), sy = Math.floor((p.y - 5) / TILE);
    let gx = Math.floor(wx / TILE), gy = Math.floor(wy / TILE);
    if (this.isSolid(gx, gy)) {
      // 找最近的可走格
      let best = null, bd = 1e9;
      for (let r = 1; r <= 2 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = gx + dx, ny = gy + dy;
        if (this.isSolid(nx, ny)) continue;
        const d = Math.hypot((nx + .5) * TILE - p.x, (ny + .5) * TILE - p.y) * 0.3 + Math.hypot(dx, dy) * TILE;
        if (d < bd) { bd = d; best = [nx, ny]; }
      }
      if (!best) { this.bumpFogNear(gx, gy); return; }
      [gx, gy] = best;
    }
    const path = this.findPath(sx, sy, gx, gy);
    if (path) { p.path = path; this.pending = entity || null; this.tapMark = { x: (gx + .5) * TILE, y: (gy + .5) * TILE, t: 0 }; }
    else this.bumpFogNear(gx, gy);
  }
  bumpFogNear(gx, gy) {
    // 點到被黑霧隔開的地方：視為碰到黑霧
    if (this.level.onBumpFog && this.bumpT <= 0) { this.bumpT = 1.2; A.sfx('bump'); this.level.onBumpFog(this); }
  }

  // ---------- 稱名 ----------
  chant() {
    if (!this.level || this.level.custom || ui.busy) return;
    const p = this.player;
    A.chant(this.bead);
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) {}
    const R = TILE * (this.level.chantRadius || 3.3);
    this.waves.push({ x: p.x, y: p.y - 12, t: 0, R, top: this.cam.y - 10 });
    p.lantern = 1;
    p.glow = p.glowMax = this.level.glowTime ? this.level.glowTime(this) : 3;
    this.texts.push({ x: p.x, y: p.y - 46, t: 0, s: '南無阿彌陀佛' });
    this.hooks.chant();
    this.level.onChant && this.level.onChant(this);
  }

  clearFogAt(k) {
    const f = this.fog.get(k); if (!f || f.clearing) return;
    f.clearing = true;
    const [x, y] = k.split(',').map(Number);
    for (let i = 0; i < 7; i++) this.parts.push({ x: (x + Math.random()) * TILE, y: (y + Math.random()) * TILE, vx: (Math.random() - .5) * 14, vy: -40 - Math.random() * 50, t: 0, life: 1.6 + Math.random() });
    A.sfx('clear');
    this.level.onFogCleared && this.level.onFogCleared(this, x, y);
  }

  interact() {
    if (ui.busy || this.interacting) return;
    if (this.focus) this.runInteract(this.focus);
  }
  async runInteract(e) {
    this.interacting = true; this.player.path = null; this.pending = null;
    // 面向對方
    const p = this.player, dx = e.x - p.x, dy = e.y - p.y;
    p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    try { await e.interact(this); } finally { this.interacting = false; this.talkCD = 1.2; }
  }

  // ---------- 輸入 ----------
  bindInput() {
    addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat && (k === ' ' || k === 'n' || k === 'e' || k === 'enter')) return;
      if (dialogOpen() && (k === ' ' || k === 'e' || k === 'enter' || k === 'n')) { dialogNext(); return; }
      if (ui.busy) return;
      if (k === ' ' || k === 'n') { this.hooks.chantKey && this.hooks.chantKey(); this.chant(); return; }
      if (k === 'e' || k === 'enter') { this.interact(); return; }
      this.keys.add(k);
    });
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());

    const toWorld = e => {
      const r = this.cv.getBoundingClientRect();
      return [(e.clientX - r.left) / this.scale + this.cam.x, (e.clientY - r.top) / this.scale + this.cam.y];
    };
    // 自訂畫面（如飛行小遊戲）：把螢幕座標交給關卡
    const toScreen = e => { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) / this.scale, (e.clientY - r.top) / this.scale]; };
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      this.cv.addEventListener(type, e => {
        if (this.level && this.level.custom && this.level.onPointer && !ui.busy) this.level.onPointer(type, ...toScreen(e), e.buttons);
      });
    }
    // 按住畫面任一處拖曳＝移動；輕點＝走到那裡
    const ring = document.getElementById('joy-float'), stage = document.getElementById('stage');
    let drag = null;
    const endDrag = () => { if (drag && drag.on) { this.joy.on = false; this.joy.x = this.joy.y = 0; ring && ring.classList.add('hidden'); } drag = null; };
    this.cv.addEventListener('pointerdown', e => {
      if (dialogOpen() || ui.busy) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false };
      try { this.cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    this.cv.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, d = Math.hypot(dx, dy), max = 44;
      if (!drag.on && d > 12) {
        drag.on = true; this.player.path = null; this.pending = null;
        if (ring) { const r = stage.getBoundingClientRect(); ring.style.left = (drag.x - r.left) + 'px'; ring.style.top = (drag.y - r.top) + 'px'; ring.classList.remove('hidden'); }
      }
      if (drag.on) {
        const k = Math.min(1, d / max);
        this.joy.on = true; this.joy.x = dx / d * k; this.joy.y = dy / d * k;
        if (ring) ring.firstElementChild.style.transform = `translate(${dx / d * k * 30}px,${dy / d * k * 30}px)`;
      }
    });
    this.cv.addEventListener('pointercancel', endDrag);
    this.cv.addEventListener('pointerup', e => {
      if (drag && drag.on) { endDrag(); return; }
      drag = null;
      if (dialogOpen()) { dialogNext(); return; }
      if (ui.busy || this.interacting || !this.level || this.level.custom) return;
      const [wx, wy] = toWorld(e);
      // 點到可互動的人物
      const hit = (this.level.entities || []).find(en => !en.hidden && en.interact && wx > en.x - 16 && wx < en.x + 16 && wy > en.y - (en.h || 42) && wy < en.y + 6);
      if (hit) {
        if (Math.hypot(hit.x - this.player.x, hit.y - this.player.y) < TILE * 1.6) { this.runInteract(hit); return; }
        this.walkTo(hit.x, hit.y + TILE * 0.6, hit); return;
      }
      this.walkTo(wx, wy);
    });
  }

  // ---------- 主迴圈 ----------
  frame = (now) => {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.level && !this.paused) {
      if (!ui.busy) this.update(dt);
      else this.t += dt * 0.25; // 對話時背景緩慢動
      this.render();
    } else if (!this.level) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.fillStyle = '#1d2433'; this.ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    }
    requestAnimationFrame(this.frame);
  };

  update(dt) {
    const L = this.level; this.t += dt;
    if (L.custom) { L.update(dt, this); return; }
    const p = this.player;
    this.bumpT -= dt; this.talkCD = (this.talkCD || 0) - dt;

    // 輸入向量
    let vx = 0, vy = 0;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) vx -= 1;
    if (k.has('d') || k.has('arrowright')) vx += 1;
    if (k.has('w') || k.has('arrowup')) vy -= 1;
    if (k.has('s') || k.has('arrowdown')) vy += 1;
    if (this.joy.on) { vx += this.joy.x; vy += this.joy.y; }
    if (vx || vy) { p.path = null; this.pending = null; }
    else if (p.path && p.path.length) {
      const [tx, ty] = p.path[0];
      const gx = (tx + .5) * TILE, gy = (ty + .75) * TILE;
      const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy);
      if (d < 4) { p.path.shift(); if (!p.path.length) p.path = null; }
      else { vx = dx / d; vy = dy / d; }
    }
    const locked = L.lockPlayer && L.lockPlayer(this);   // 例如：乘願船時由關卡控制位置
    if (locked) { vx = vy = 0; p.path = null; }
    const len = Math.hypot(vx, vy);
    let moving = false;
    if (len > 0.12) {
      if (len > 1) { vx /= len; vy /= len; }
      const sp = SPEED * (L.speedFactor ? L.speedFactor(this) : 1) * dt;
      const nx = p.x + vx * sp, ny = p.y + vy * sp;
      let hit = this.boxHits(nx, p.y);
      if (!hit) p.x = nx;
      let hit2 = this.boxHits(p.x, ny);
      if (!hit2) p.y = ny;
      const h = hit || hit2;
      if (h) {
        if (this.fogAt(h[0], h[1]) && this.bumpT <= 0 && L.onBumpFog) { this.bumpT = 1.2; A.sfx('bump'); L.onBumpFog(this); }
        // 走到人物面前、往他身上走，就開始說話（取代「互動」按鈕）
        const who = this.blockEnt && this.blockEnt.get(`${h[0]},${h[1]}`);
        if (who && who.interact && !this.interacting && (this.talkCD || 0) <= 0) { this.runInteract(who); }
        if (p.path && hit && hit2) p.path = null;
      }
      moving = !(hit && hit2);
      if (Math.abs(vx) > Math.abs(vy)) p.facing = vx < 0 ? 'left' : 'right';
      else p.facing = vy < 0 ? 'up' : 'down';
    }
    p.phase = moving ? p.phase + dt * 11 : 0;

    // 小燈籠
    if (L.lanternDrain) p.lantern = Math.max(0.22, p.lantern - L.lanternDrain * dt * (L.drainMul ? L.drainMul(this) : 1));
    p.glow = Math.max(0, p.glow - dt);

    // 光波
    for (const w of this.waves) {
      w.t += dt;
      const r = this.waveR(w);
      if (r > 0) for (const [key, f] of this.fog) {
        if (f.clearing) continue;
        const [fx, fy] = key.split(',').map(Number);
        if (Math.hypot((fx + .5) * TILE - w.x, (fy + .5) * TILE - w.y) < r + TILE * 0.4) this.clearFogAt(key);
      }
    }
    this.waves = this.waves.filter(w => w.t < 1.1);
    for (const [key, f] of this.fog) if (f.clearing) { f.a -= dt * 1.8; if (f.a <= 0) this.fog.delete(key); }
    for (const q of this.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 20 * dt; }
    this.parts = this.parts.filter(q => q.t < q.life);
    for (const s of this.texts) s.t += dt;
    this.texts = this.texts.filter(s => s.t < 1.6);
    if (this.tapMark) { this.tapMark.t += dt; if (this.tapMark.t > 0.6) this.tapMark = null; }

    // 可互動目標
    let best = null, bd = TILE * 1.5;
    for (const e of L.entities || []) {
      if (e.hidden || !e.interact) continue;
      const d = Math.hypot(e.x - p.x, (e.y - p.y) * 1.1);
      if (d < bd) { bd = d; best = e; }
    }
    if (best !== this.focus) { this.focus = best; this.hooks.interactReady(!!best); }
    if (this.pending && !p.path) {
      const e = this.pending; this.pending = null;
      if (Math.hypot(e.x - p.x, e.y - p.y) < TILE * 1.8) this.runInteract(e);
    }

    L.update && L.update(dt, this);
    this.hooks.hud();
    this.followCam(dt);
  }

  waveR(w) { const k = (w.t - 0.22) / 0.6; return k <= 0 ? 0 : Math.min(1, k) * w.R; }

  camTarget() {
    const p = this.player, mw = this.cols * TILE, mh = this.rows * TILE;
    let x = p.x - this.W / 2, y = p.y - this.H * (this.level.camBias || 0.55);
    // 上方留出 HUD、下方留出按鈕的空間，地圖邊緣的人物才不會被遮住
    const padT = 120, padB = 150;
    x = mw <= this.W ? (mw - this.W) / 2 : Math.max(0, Math.min(mw - this.W, x));
    y = mh + padT + padB <= this.H ? (mh - this.H) / 2 : Math.max(-padT, Math.min(mh - this.H + padB, y));
    return [x, y];
  }
  snapCam() { if (!this.level || this.level.custom) return; const [x, y] = this.camTarget(); this.cam.x = x; this.cam.y = y; }
  followCam(dt) { const [x, y] = this.camTarget(), k = Math.min(1, dt * 6); this.cam.x += (x - this.cam.x) * k; this.cam.y += (y - this.cam.y) * k; }

  // ---------- 繪製 ----------
  render() {
    const c = this.ctx, L = this.level, W = this.W, H = this.H;
    c.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, 0, 0);
    c.imageSmoothingEnabled = true;
    if (L.custom) { L.render(c, this); return; }
    c.fillStyle = L.bg || '#222'; c.fillRect(0, 0, W, H);
    const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
    c.save(); c.translate(-cx, -cy);
    const x0 = Math.max(0, Math.floor(cx / TILE) - 1), x1 = Math.min(this.cols - 1, Math.floor((cx + W) / TILE) + 1);
    const y0 = Math.max(0, Math.floor(cy / TILE) - 1), y1 = Math.min(this.rows - 1, Math.floor((cy + H) / TILE) + 1);
    this.view = { x0, x1, y0, y1 };
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.drawTile(c, this.grid[y][x], x, y, x * TILE, y * TILE, this.t, this);
    L.drawGround && L.drawGround(c, this);
    if (this.tapMark) {
      const m = this.tapMark; c.strokeStyle = `rgba(255,230,160,${1 - m.t / 0.6})`; c.lineWidth = 2;
      c.beginPath(); c.ellipse(m.x, m.y + 6, 6 + m.t * 16, 3 + m.t * 7, 0, 0, Math.PI * 2); c.stroke();
    }
    // 人物依 y 排序
    const p = this.player;
    const list = (L.entities || []).filter(e => !e.hidden && e.y > cy - 120 && e.y < cy + H + 60);
    list.push({ y: p.y, draw: () => traveler(c, p.x, p.y, p.facing, p.phase, p.lantern, this.lampColor) });
    list.sort((a, b) => a.y - b.y);
    for (const e of list) e.draw(c, this.t, this);
    // 互動提示
    if (this.focus && !this.interacting) {
      const e = this.focus, bob = Math.sin(this.t * 4) * 2;
      c.fillStyle = '#fff6d6'; c.strokeStyle = '#c98a2b'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(e.x, e.y - (e.h || 42) - 8 + bob, 8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#8a4a00'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('…', e.x, e.y - (e.h || 42) - 9 + bob);
    }
    // 黑霧
    for (const [k, f] of this.fog) {
      const [fx, fy] = k.split(',').map(Number);
      if (fx < x0 || fx > x1 || fy < y0 || fy > y1) continue;
      fogPuff(c, (fx + .5) * TILE, (fy + .5) * TILE, TILE * 1.15, this.t + fx * 0.7 + fy, Math.max(0, f.a));
    }
    L.drawOver && L.drawOver(c, this);
    c.restore();

    this.renderDark();

    // 加光（佛光為暖金）
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(-cx, -cy);
    L.drawAdd && L.drawAdd(c, this);
    if (p.glow > 0) {
      const k = Math.min(1, p.glow / (p.glowMax || 3)), r = TILE * (2.6 + 1.2 * k);
      c.globalAlpha = 0.25 + 0.55 * k; c.drawImage(this.goldSprite, p.x - r, p.y - 14 - r, r * 2, r * 2);
    }
    c.globalAlpha = 0.5 + 0.5 * p.lantern;
    const lr = TILE * 0.9;
    c.drawImage(this.coldSprite, p.x + (p.facing === 'left' ? -12 : 12) - lr, p.y - 12 - lr, lr * 2, lr * 2);
    c.globalAlpha = 1;
    for (const w of this.waves) {
      const bk = Math.min(1, w.t / 0.22), fade = w.t < 0.5 ? 1 : Math.max(0, 1 - (w.t - 0.5) / 0.6);
      const top = w.top, bottom = top + (w.y - top) * bk;
      const g = c.createLinearGradient(w.x - 22, 0, w.x + 22, 0);
      g.addColorStop(0, 'rgba(255,200,100,0)'); g.addColorStop(0.5, `rgba(255,226,150,${0.75 * fade})`); g.addColorStop(1, 'rgba(255,200,100,0)');
      c.fillStyle = g; c.fillRect(w.x - 22, top, 44, bottom - top);
      const r = this.waveR(w);
      if (r > 0) {
        c.strokeStyle = `rgba(255,214,130,${0.8 * (1 - r / w.R) + 0.1})`; c.lineWidth = 5;
        c.beginPath(); c.arc(w.x, w.y, r, 0, Math.PI * 2); c.stroke();
      }
    }
    for (const q of this.parts) {
      const a = 1 - q.t / q.life, r = 7 * a + 2;
      c.globalAlpha = a; c.drawImage(this.goldSprite, q.x - r, q.y - r, r * 2, r * 2);
    }
    c.restore();

    // 稱名浮字
    c.save(); c.translate(-cx, -cy);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 15px "Noto Serif TC", "PMingLiU", serif';
    for (const s of this.texts) {
      const a = s.t < 0.2 ? s.t / 0.2 : Math.max(0, 1 - (s.t - 0.8) / 0.8);
      c.globalAlpha = a; c.lineWidth = 3; c.strokeStyle = 'rgba(80,40,0,.8)'; c.fillStyle = '#ffe9a8';
      c.strokeText(s.s, s.x, s.y - s.t * 22); c.fillText(s.s, s.x, s.y - s.t * 22);
    }
    c.restore();
    L.drawScreen && L.drawScreen(c, this);
  }

  renderDark() {
    const L = this.level, amb = L.ambient; if (!amb || amb.a <= 0) return;
    const d = this.dctx, s = this.ds, p = this.player, cx = this.cam.x, cy = this.cam.y;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
    d.clearRect(0, 0, this.dark.width, this.dark.height);
    d.fillStyle = `rgba(${amb.c[0]},${amb.c[1]},${amb.c[2]},${amb.a})`; d.fillRect(0, 0, this.dark.width, this.dark.height);
    d.globalCompositeOperation = 'destination-out';
    const cut = (x, y, r, a = 1) => { d.globalAlpha = Math.max(0, Math.min(1, a)); d.drawImage(this.cutSprite, (x - cx - r) * s, (y - cy - r) * s, r * 2 * s, r * 2 * s); };
    cut(p.x, p.y - 12, TILE * (1.3 + 1.9 * p.lantern), 1);
    if (p.glow > 0) { const k = Math.min(1, p.glow / (p.glowMax || 3)); cut(p.x, p.y - 12, TILE * (3 + 2.2 * k), 0.5 + 0.5 * k); }
    for (const w of this.waves) {
      const r = this.waveR(w); if (r > 0) cut(w.x, w.y, r + TILE, 1 - w.t / 1.1);
      const bk = Math.min(1, w.t / 0.22), fade = Math.max(0, 1 - w.t / 1.1);
      d.globalAlpha = fade; d.fillStyle = '#000';
      d.fillRect((w.x - 16 - cx) * s, (w.top - cy) * s, 32 * s, (w.y - w.top) * bk * s);
    }
    if (L.lights) for (const l of L.lights(this)) cut(l.x, l.y, l.r, l.a ?? 1);
    d.globalAlpha = 1; d.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.dark, 0, 0, this.W, this.H);
  }
}
