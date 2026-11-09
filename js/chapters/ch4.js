// 第四章【彌陀接引——蓮花化生】：無操作過場，讓玩家靜靜感受。
// 由白道直接接到蓮花化生，不描寫臨終場景（配合「平生業成」，上線前請法師確認）。
import { buddha, chibi } from '../draw.js';
import { callText, grant } from '../ui.js';
import * as A from '../audio.js';

const SUBS = [
  [0.5, '白道的盡頭，阿彌陀佛垂手相迎。'],
  [6, '小行者坐入蓮花之中。'],
  [12, '蓮花合起，光明溫暖地包圍著。'],
  [18, '花開見佛。'],
  [24, '極樂國土眾生生者，皆是阿鞞跋致。', '《佛說阿彌陀經》'],
];
const END = 31;

export function createCh4() {
  let t = 0, si = 0, done = false;
  const petals = Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random() * -1, s: 0.5 + Math.random(), r: Math.random() * 6 }));
  return {
    id: 'ch4', name: '第四章・蓮花化生', custom: true, theme: 'pure', map: ['.'], start: [0, 0], entities: [],
    tileSolid: () => false, drawTile: () => {},
    async enter() {},
    update(dt, eng) {
      t += dt;
      while (si < SUBS.length && t >= SUBS[si][0]) { const [, s, src] = SUBS[si++]; callText(s, src, true); if (si === 4) A.sfx('open'); }
      for (const p of petals) { p.y += dt * 0.05 * p.s; p.x += Math.sin(t + p.r) * dt * 0.01; if (p.y > 1.1) { p.y = -0.1; p.x = Math.random(); } }
      if (!done && t > END) {
        done = true;
        grant(['qingjing', 'huanxi'], 'ch4').then(() => eng.complete('ch4', ['qingjing', 'huanxi'], ['ch4']));
      }
    },
    render(c, eng) {
      const W = eng.W, H = eng.H;
      const fadeIn = Math.min(1, t / 3);
      // 天空
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fff3cf'); g.addColorStop(0.45, '#f7d48a'); g.addColorStop(1, '#f3b6c0');
      c.fillStyle = '#1d2433'; c.fillRect(0, 0, W, H);
      c.globalAlpha = fadeIn; c.fillStyle = g; c.fillRect(0, 0, W, H);
      // 光芒
      c.save(); c.translate(W / 2, H * 0.32); c.globalAlpha = 0.18 * fadeIn;
      c.fillStyle = '#fff';
      for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8 + Math.sin(t * 0.05) * 0.001); c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -H); c.lineTo(18, -H); c.closePath(); c.fill(); }
      c.restore();
      // 阿彌陀佛
      c.globalAlpha = Math.min(1, t / 4);
      buddha(c, W / 2, H * 0.58, H * 0.42, 'amitabha', t, 1.4);
      c.globalAlpha = 1;
      // 七寶池水
      c.fillStyle = 'rgba(95,179,201,.55)'; c.fillRect(0, H * 0.78, W, H * 0.22);
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, H * (0.81 + i * 0.045)); for (let x = 0; x <= W; x += 10) c.lineTo(x, H * (0.81 + i * 0.045) + Math.sin(x * 0.05 + t + i) * 2); c.stroke(); }
      // 小行者走向蓮花 → 坐入 → 合 → 開
      const lx = W / 2, ly = H * 0.86;
      const walk = Math.min(1, Math.max(0, (t - 1) / 5));
      const close = t < 8 ? 0 : t < 12 ? (t - 8) / 4 : t < 16 ? 1 : t < 22 ? 1 - (t - 16) / 6 : 0;
      if (t < 6.5) chibi(c, lx, H * 1.02 - walk * (H * 1.02 - ly + 6), { robe: '#e9e3d3', sash: '#7a8a6a', facing: 'up', phase: t * 10, hat: true });
      drawLotus(c, lx, ly, 46, close, t);
      if (t >= 6.5 && close < 0.75) chibi(c, lx, ly - 4, { robe: '#fff6e0', sash: '#e8b84a', facing: 'up', phase: 0, scale: 0.9 });
      if (close > 0) { c.globalAlpha = close; drawBud(c, lx, ly, 46, t); c.globalAlpha = 1; }
      if (t > 16 && t < 23) {
        c.globalCompositeOperation = 'lighter';
        const k = 1 - Math.abs(t - 18) / 5;
        c.globalAlpha = Math.max(0, k) * 0.7; c.drawImage(eng.goldSprite, lx - 120, ly - 140, 240, 240);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // 天華
      if (t > 18) {
        c.globalAlpha = Math.min(1, (t - 18) / 3);
        for (const p of petals) { c.fillStyle = p.r > 3 ? '#fff' : '#f7b8c6'; c.beginPath(); c.ellipse(p.x * W, p.y * H, 3 * p.s, 2 * p.s, t + p.r, 0, Math.PI * 2); c.fill(); }
        c.globalAlpha = 1;
      }
      // 開場淡入
      if (t < 1.2) { c.fillStyle = `rgba(0,0,0,${1 - t / 1.2})`; c.fillRect(0, 0, W, H); }
    },
  };
}

function drawLotus(c, x, y, r, close, t) {
  c.fillStyle = '#4a9a6a'; c.beginPath(); c.ellipse(x, y + 6, r * 1.5, r * 0.32, 0, 0, Math.PI * 2); c.fill();
  const open = 1 - close;
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 5 : 7;
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1) - 0.5) * (layer ? 2.0 : 2.8) * (0.35 + 0.65 * open);
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = layer ? '#f7d2da' : '#e9a7b6';
      c.beginPath(); c.ellipse(0, -r * (layer ? 0.5 : 0.55), r * 0.2, r * (layer ? 0.5 : 0.6), 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
}
function drawBud(c, x, y, r, t) {
  const g = c.createRadialGradient(x, y - r * 0.6, 3, x, y - r * 0.5, r);
  g.addColorStop(0, '#fff6e0'); g.addColorStop(0.6, '#f3a6b8'); g.addColorStop(1, '#d9849a');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x, y - r * 1.25); c.bezierCurveTo(x + r * 0.7, y - r * 0.8, x + r * 0.6, y, x, y + 2); c.bezierCurveTo(x - r * 0.6, y, x - r * 0.7, y - r * 0.8, x, y - r * 1.25); c.fill();
}
