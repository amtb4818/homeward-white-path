// 終章【還相迴向——回到娑婆】
// 身帶佛光回到序章的王舍城，把白道上聽到的告訴四位愁悶的人，和他們一起稱名；
// 他們各自走上白道，城市由灰轉彩。領受超日月光。
import { TILE } from '../engine.js';
import { chibi, vaidehi } from '../draw.js';
import { dialog, hint, toast, grant, openCard } from '../ui.js';
import { t as tr, q } from '../i18n.js';
import { MAP as CITY, drawCityTile } from './prologue.js';
import * as A from '../audio.js';

const MAP = CITY.map(r => r.replace(/f/g, '.'));
const C = (tx, ty) => [(tx + .5) * TILE, (ty + .85) * TILE];

const PEOPLE = [
  { id: 'sheng', tx: 2, ty: 20, name: '年輕母親', o: { robe: '#9aa6b8', sash: '#6b7a90', hairStyle: 'bun' }, prop: 'baby',
    tell: [
      { text: '（你告訴她：阿彌陀佛發願救度十方眾生，一個也不遺漏。）' },
      { who: 1, text: '連這個剛出生的孩子也是嗎？' },
      { text: '（你點點頭。十方眾生，誰都在其中。）' },
    ],
    joy: '南無阿彌陀佛……孩子，我們有一個不再受苦的故鄉了。' },
  { id: 'lao', tx: 12, ty: 20, name: '老爺爺', o: { robe: '#8c8a86', sash: '#5a5650', hair: '#d8d8d8' }, prop: 'cane',
    tell: [
      { text: '（你告訴他：極樂世界的壽命無量，不再有衰老。）' },
      { who: 1, text: '我這把年紀了，還來得及嗎？' },
      { text: '（不問時節久近。一聲一聲地念，阿彌陀佛都聽得見。）' },
    ],
    joy: '南無阿彌陀佛……原來，一點也不晚。' },
  { id: 'bing', tx: 2, ty: 9, name: '病中的人', o: { robe: '#a8b0b8', sash: '#7a8088', hair: '#3a3430' }, prop: 'bed',
    tell: [
      { text: '（你告訴他：身體會病、會老，可是阿彌陀佛的光明，一直照著念佛的人。）' },
      { who: 1, text: '這樣的我，也有可以依靠的嗎？' },
      { text: '（有的。就是這句名號。）' },
    ],
    joy: '南無阿彌陀佛……我不再害怕了。' },
  { id: 'si', tx: 12, ty: 9, name: '失去父親的人', o: { robe: '#5f6470', sash: '#3e424c', hair: '#2b2622' }, prop: 'incense',
    tell: [
      { text: '（你告訴他：極樂世界，是「諸上善人俱會一處」的地方。）' },
      { who: 1, text: '人生無常，總有分離的一天……' },
      { text: '（願生極樂的人，終將在那裡相會。）' },
    ],
    joy: '南無阿彌陀佛……我也要往生極樂，在那裡與大家相會。' },
];

export function createFinale() {
  const st = { told: [], guided: [], intro: false, done: false };
  let E = null, color = 0, glory = 0;
  const walkers = {};   // 正走上白道的人：{ y0, y, a }

  const ents = PEOPLE.map(pp => {
    const [x, y0] = C(pp.tx, pp.ty);
    const e = {
      id: pp.id, x, y: y0, h: 40, block: [[pp.tx, pp.ty]], name: pp.name,
      draw: (c, t) => {
        const w = walkers[pp.id];
        const y = w ? w.y : y0;
        c.save();
        if (w) c.globalAlpha = w.a;
        chibi(c, x, y, { ...pp.o, facing: w ? 'up' : 'down', phase: w ? t * 9 : 0, sad: !st.guided.includes(pp.id) });
        if (!w) props(c, x, y, pp.prop, t);
        if (pp.prop === 'baby' && w) { c.fillStyle = '#f6efe2'; c.beginPath(); c.ellipse(x + 2, y - 13, 6, 4.5, 0.3, 0, Math.PI * 2); c.fill(); }
        c.restore();
      },
      interact: async () => {
        if (st.guided.includes(pp.id)) return;
        await dialog(pp.tell.map(l => ({ name: l.who ? pp.name : '', text: l.text })));
        if (!st.told.includes(pp.id)) st.told.push(pp.id);
        hint('和他一起稱念「南無阿彌陀佛」吧。', 3500);
      },
    };
    return e;
  });
  const [vx, vy] = C(8, 3);
  const vai = {
    id: 'vaidehi', x: vx, y: vy, h: 46, block: [[8, 3]], name: '韋提希夫人',
    draw: (c, t) => vaidehi(c, vx, vy, 'down', t),
    interact: () => dialog(st.done
      ? [{ name: '韋提希夫人', text: '王舍城，從來沒有這麼明亮過。' }]
      : [{ name: '韋提希夫人', text: '你回來了，還帶著阿彌陀佛的光明。' }, { name: '韋提希夫人', text: '城裡的人們，還在等著聽這個好消息。' }]),
  };
  ents.push(vai);

  async function guide(pp) {
    st.guided.push(pp.id);
    const e = ents.find(x => x.id === pp.id);
    e.interact = null;
    await dialog([{ name: pp.name, text: pp.joy }]);
    // 走上白道
    e.block = []; E.refreshBlocks();
    walkers[pp.id] = { y: e.y, y0: e.y, a: 1 };
    A.sfx('grant');
    toast(tr('王舍城亮了一些（{n}／4）', { n: st.guided.length }));
    if (st.guided.length === 4) setTimeout(() => finish(), 4200);
  }

  async function finish() {
    if (st.done) return;
    st.done = true; E.interacting = true;
    try {
      await dialog([
        { text: '四個人，各自走上了一條白道，朝向西方。' },
        { text: '灰濛濛的王舍城，一點一點地亮了起來。' },
        { text: '往生極樂的人，又回到娑婆，引導眾生一同往生——這就是「還相迴向」。' },
      ]);
      await grant(['chaoriyue'], 'finale');
      glory = 0.01;
      await new Promise(r => setTimeout(r, 2500));
      await openCard(`<div class="tag">${tr('歸 去 來')}</div>
        <div class="light-orb"></div>
        <h3>${tr('南無阿彌陀佛')}</h3>
        ${q('歸去來，魔鄉不可停，曠劫來流轉，六道盡皆經。', '善導大師《觀經四帖疏・定善義》')}
        ${q('願以此功德，平等施一切，<br>同發菩提心，往生安樂國。', '善導大師《觀經四帖疏・玄義分》')}
        <p style="text-align:center;font-size:calc(var(--fs) - 2px);color:#8a6a3a">${tr('感謝你走完這段白道之旅。')}</p>
        <div class="row"><button class="btn" data-close="ok">${tr('南無阿彌陀佛')}</button></div>`);
      E.complete('finale', ['chaoriyue'], ['finale']);
    } finally { E.interacting = false; }
  }

  const L = {
    id: 'finale', name: '終章・回到娑婆', map: MAP, start: [7, 23], startFacing: 'up',
    bg: '#5d6678', ambient: { c: [22, 26, 44], a: 0.42 }, lanternDrain: 0, camBias: 0.55,
    theme: 'saha', entities: ents,
    tileSolid: ch => ch === '#' || ch === 'P' || ch === 'T' || ch === '~',
    drawTile: drawCityTile(() => true, () => color),
    drawGround(c, eng) {
      // 城市的灰：用 saturation 混色逐步褪去
      const v = eng.view, x = v.x0 * TILE, y = v.y0 * TILE, w = (v.x1 - v.x0 + 1) * TILE, h = (v.y1 - v.y0 + 1) * TILE;
      if (color < 1) { c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = (1 - color) * 0.8; c.fillStyle = 'hsl(0,0%,50%)'; c.fillRect(x, y, w, h); c.restore(); }
      if (color > 0) {
        c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = color * 0.25; c.fillStyle = '#ffb347'; c.fillRect(x, y, w, h); c.restore();
        // 街上長出的花
        for (let ty = v.y0; ty <= v.y1; ty++) for (let tx = v.x0; tx <= v.x1; tx++) {
          const ch = eng.grid[ty] && eng.grid[ty][tx];
          if ((ch === ',' || ch === '.') && (tx * 7 + ty * 13) % 9 === 0 && (tx * 3 + ty) % 4 < color * 4) flowerPot(c, (tx + .5) * TILE, (ty + .6) * TILE, (tx + ty) % 3);
        }
      }
      // 白道
      for (const id in walkers) {
        const pp = PEOPLE.find(p => p.id === id), w = walkers[id];
        const x = (pp.tx + .5) * TILE;
        const g = c.createLinearGradient(0, w.y0, 0, 0);
        g.addColorStop(0, 'rgba(255,250,235,.9)'); g.addColorStop(1, 'rgba(255,230,160,.2)');
        c.fillStyle = g; c.fillRect(x - 5, -4 * TILE, 10, w.y0 + 4 * TILE);
      }
    },
    lights(eng) {
      const L2 = [];
      for (const id in walkers) { const pp = PEOPLE.find(p => p.id === id); L2.push({ x: (pp.tx + .5) * TILE, y: walkers[id].y - 14, r: TILE * 1.8, a: walkers[id].a }); }
      return L2;
    },
    drawAdd(c, eng) {
      for (const id in walkers) {
        const pp = PEOPLE.find(p => p.id === id), x = (pp.tx + .5) * TILE, w = walkers[id];
        for (let y = w.y0; y > -TILE * 2; y -= TILE * 1.2) { c.globalAlpha = 0.25; c.drawImage(eng.goldSprite, x - 16, y - 16, 32, 32); }
      }
      if (glory > 0) {
        const W = eng.W, H = eng.H, r = Math.max(W, H) * (0.4 + glory);
        c.globalAlpha = Math.min(0.85, glory); c.drawImage(eng.goldSprite, eng.cam.x + W / 2 - r, eng.cam.y + H * 0.2 - r, r * 2, r * 2);
      }
      c.globalAlpha = 1;
    },
    init(eng) {
      E = eng;
      for (const id of st.guided) { const e = ents.find(x => x.id === id); e.hidden = true; }
      color = st.guided.length / 4;
    },
    update(dt, eng) {
      const p = eng.player;
      p.glow = Math.max(p.glow, 1.4); p.glowMax = 3;   // 身帶佛光
      const target = st.guided.length / 4;
      color += (target - color) * Math.min(1, dt * 0.8);
      L.ambient.a = 0.42 * (1 - color) * (1 - Math.min(1, glory));
      L.bg = color > 0.5 ? '#7a7868' : '#5d6678';
      if (glory > 0) glory = Math.min(1.2, glory + dt * 0.4);
      for (const id in walkers) {
        const w = walkers[id];
        if (w.y > TILE * 1.2) w.y -= 46 * dt;
        else { w.a = Math.max(0, w.a - dt * 0.8); if (!w.a) { ents.find(x => x.id === id).hidden = true; } }
      }
    },
    onChant(eng) {
      if (eng.interacting) return;   // 連按時不要重複觸發
      const p = eng.player;
      const near = PEOPLE.find(pp => st.told.includes(pp.id) && !st.guided.includes(pp.id) && Math.hypot((pp.tx + .5) * TILE - p.x, (pp.ty + .8) * TILE - p.y) < TILE * 2.6);
      if (near) { eng.interacting = true; setTimeout(() => guide(near).finally(() => { eng.interacting = false; }), 500); }
      else if (!st.told.length) hint('去找城裡那四個人，把白道上聽到的告訴他們。', 3500);
    },
    async enter() {
      if (st.intro) return;
      st.intro = true;
      await dialog([
        { text: '回到王舍城。' },
        { text: '你的身上，還帶著阿彌陀佛的光明。' },
        { text: '城裡那四個人，還在為心事發愁。' },
      ]);
      hint('去找他們，把白道上聽到的告訴他們，<br>再和他們一起稱念「南無阿彌陀佛」。', 5500);
    },
    getState() { return { told: [...st.told], guided: [...st.guided], intro: st.intro }; },
    setState(s) { st.told = [...(s.told || [])]; st.guided = [...(s.guided || [])]; st.intro = !!s.intro; },
  };
  return L;
}

function props(c, x, y, prop, t) {
  if (prop === 'baby') { c.fillStyle = '#f6efe2'; c.beginPath(); c.ellipse(x + 2, y - 13, 6, 4.5, 0.3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f3d6b8'; c.beginPath(); c.arc(x + 6, y - 15, 3, 0, Math.PI * 2); c.fill(); }
  if (prop === 'cane') { c.strokeStyle = '#6b5236'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 12, y); c.lineTo(x + 10, y - 22); c.stroke(); }
  if (prop === 'bed') { c.fillStyle = 'rgba(160,150,140,.8)'; c.fillRect(x - 16, y - 2, 32, 6); }
  if (prop === 'incense') { c.fillStyle = '#7a6a5a'; c.fillRect(x - 18, y - 8, 6, 8); c.strokeStyle = 'rgba(220,220,220,.5)'; c.beginPath(); c.moveTo(x - 15, y - 8); c.quadraticCurveTo(x - 12 + Math.sin(t * 2) * 3, y - 18, x - 15, y - 28); c.stroke(); }
}
function flowerPot(c, x, y, k) {
  c.fillStyle = '#a0603a'; c.fillRect(x - 5, y, 10, 7);
  const col = ['#f3a6b8', '#f2c94c', '#ffffff'][k];
  c.fillStyle = '#4a9a6a'; c.fillRect(x - 1, y - 6, 2, 6);
  c.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * 3.5, y - 8 + Math.sin(a) * 3.5, 2.6, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(x, y - 8, 1.8, 0, Math.PI * 2); c.fill();
}
