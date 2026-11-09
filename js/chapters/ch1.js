// 第一章【法藏之願——四十八願碑林】（出處：《佛說無量壽經》）
// 「思惟之林」中散落著石碑，黑暗裡看不清碑文；稱名的佛光照到，碑文才顯現。
import { TILE } from '../engine.js';
import { dialog, hint, toast, openCard, grant } from '../ui.js';
import * as A from '../audio.js';

const MAP = [
  'TTTTTTTTTTTTT',
  'TTTT.....TTTT',
  'TTT.......TTT',
  'TTT.......TTT',
  'TTT.......TTT',
  'TTTT.....TTTT',
  'TTTTTXXXTTTTT',
  'TTTTT...TTTTT',
  'T,,,,...,,,,T',
  'T,,,T...T,,,T',
  'T,,,T...T,,,T',
  'TTTTTfffTTTTT',
  'TTTTT...TTTTT',
  'T,,,,...,,,,T',
  'T,,,T...T,,,T',
  'T,,,T...T,,,T',
  'TTTTTfffTTTTT',
  'TTTTT...TTTTT',
  'T,,,,...,,,,T',
  'T,,,T...T,,,T',
  'T,,,T...T,,,T',
  'TTTTT...TTTTT',
  'TTTT.....TTTT',
  'TTTT.....TTTT',
  'TTTTTTTTTTTTT',
];

// 依序由下往上：十一、十二、十三、十七願碑
const VOWS = [
  { id: 'v11', tx: 2, ty: 19, no: '第十一願', title: '必至滅度',
    text: '設我得佛，國中人天，不住定聚，必至滅度者，不取正覺。',
    plain: '生到我國的人，必定成佛。' },
  { id: 'v12', tx: 10, ty: 19, no: '第十二願', title: '光明無量',
    text: '設我得佛，光明有能限量，下至不照百千億那由他諸佛國者，不取正覺。',
    plain: '我的光明無量，照遍十方。（這一路照亮你的，就是這光。）' },
  { id: 'v13', tx: 2, ty: 14, no: '第十三願', title: '壽命無量',
    text: '設我得佛，壽命有能限量，下至百千億那由他劫者，不取正覺。',
    plain: '我的壽命無量，永遠都在救度眾生。' },
  { id: 'v17', tx: 10, ty: 14, no: '第十七願', title: '諸佛稱揚',
    text: '設我得佛，十方世界無量諸佛，不悉咨嗟稱我名者，不取正覺。',
    plain: '十方諸佛都讚歎我的名號，讓眾生都能聽到這句名號。' },
];
const LORE = [
  { id: 'lore1', tx: 2, ty: 9, title: '五劫思惟',
    body: '<p>法藏比丘在世自在王如來前發起大願，</p><p class="quote">具足五劫，思惟攝取莊嚴佛國清淨之行。<small>《佛說無量壽經》</small></p><p>這片林子，就叫「思惟之林」。</p>' },
  { id: 'lore2', tx: 10, ty: 9, title: '四十八願',
    body: '<p>法藏比丘為了救度十方眾生，發下四十八大願。</p><p>這些願的最後都說：「不取正覺」——若做不到，我就不成佛。</p><p>如今法藏比丘已經成佛，就是阿彌陀佛。</p>' },
];

export function createCh1() {
  const st = { lit: [], read: [], open: false, big: false, done: false, tutor: 0, bumps: 0 };
  const ents = [];
  let E = null;

  for (const v of VOWS) {
    const x = (v.tx + .5) * TILE, y = (v.ty + .85) * TILE;
    ents.push({
      id: v.id, x, y, h: 60, block: [[v.tx, v.ty]], vow: v,
      draw: (c, t) => stele(c, x, y, 1, st.lit.includes(v.id), st.read.includes(v.id), t, v.no),
      interact: async () => {
        if (!st.lit.includes(v.id)) {
          await dialog([{ text: '石碑上刻著字，可是在黑暗中看不清楚……' }]);
          if (!st.tutor) hint('稱念「南無阿彌陀佛」，讓佛光照亮石碑。', 4000);
          return;
        }
        await readVow(v);
      },
    });
  }
  for (const l of LORE) {
    const x = (l.tx + .5) * TILE, y = (l.ty + .85) * TILE;
    ents.push({
      id: l.id, x, y, h: 30, block: [[l.tx, l.ty]],
      draw: c => plaque(c, x, y),
      interact: () => openCard(`<div class="tag">林 中 刻 文</div><h3>${l.title}</h3>${l.body}<div class="row"><button class="btn ghost" data-close="ok">好</button></div>`),
    });
  }
  const bx = 6.5 * TILE, by = 2.9 * TILE;
  const big = {
    id: 'v18', x: bx, y: by, h: 104, block: [[5, 2], [6, 2], [7, 2]],
    draw: (c, t) => stele(c, bx, by, 1.9, st.big, st.done, t, '第十八願'),
    interact: async () => {
      if (!st.big) { await dialog([{ text: '林心最大的一座石碑，靜靜地立在黑暗中。' }]); hint('在這裡稱念「南無阿彌陀佛」。', 3500); return; }
      await finish();
    },
  };
  ents.push(big);

  async function readVow(v) {
    const first = !st.read.includes(v.id);
    A.sfx('open');
    await openCard(`<div class="tag">${v.no}・${v.title}</div><h3>${v.no}</h3>
      <p class="quote">${v.text}<small>《佛說無量壽經》</small></p>
      <p>${v.plain}</p>
      <div class="row"><button class="btn" data-close="ok">南無阿彌陀佛</button></div>`);
    if (first) {
      st.read.push(v.id);
      toast(`願碑 ${st.read.length}／4`);
      if (st.read.length === 4) openThicket();
    }
  }

  function openThicket() {
    st.open = true; A.sfx('grant');
    for (let x = 5; x <= 7; x++) E.parts.push(...Array.from({ length: 6 }, () => ({ x: (x + Math.random()) * TILE, y: (6 + Math.random()) * TILE, vx: (Math.random() - .5) * 20, vy: -50 - Math.random() * 40, t: 0, life: 1.8 })));
    hint('林心的荊棘化為光點散去了。<br>往最深處走，那裡有最大的一座碑。', 5000);
  }

  async function finish() {
    if (st.done) return;
    st.done = true;
    await dialog([{ text: '這是四十八願之中，最根本的一願——' }]);
    A.sfx('grant');
    await openCard(`<div class="tag">第 十 八 願・念 佛 往 生 願</div><h3>第十八願</h3>
      <p class="quote">設我得佛，十方眾生，至心信樂，欲生我國，乃至十念，若不生者，不取正覺。唯除五逆，誹謗正法。<small>《佛說無量壽經》</small></p>
      <p>善導大師在《往生禮讚》中這樣引述：</p>
      <p class="quote">若我成佛，十方眾生，稱我名號，下至十聲，若不生者，不取正覺。<small>善導大師《往生禮讚偈》</small></p>
      <p>不論是誰，只要稱念這句名號，阿彌陀佛就必定救度。</p>
      <div class="row"><button class="btn" data-close="ok">南無阿彌陀佛</button></div>`);
    await grant(['zhihui'], 'ch1');
    E.complete('ch1', ['zhihui'], ['ch1']);
  }

  return {
    id: 'ch1', name: '第一章・四十八願碑林', map: MAP, start: [6, 23], startFacing: 'up',
    bg: '#16201c', ambient: { c: [6, 14, 12], a: 0.74 }, lanternDrain: 0.04, camBias: 0.58,
    theme: 'saha', entities: ents,
    tileSolid(ch) { return ch === 'T' || (ch === 'X' && !st.open); },
    drawTile(c, ch, tx, ty, x, y, t) {
      if (ch === '.' || ch === 'X') {
        c.fillStyle = '#5a5040'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + (tx * 13) % 26 + 3, y + (ty * 7) % 26 + 4, 4, 3);
        if (ch === 'X' && !st.open) {
          c.strokeStyle = '#2a2018'; c.lineWidth = 2.2;
          for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + i * 8, y + TILE); c.quadraticCurveTo(x + i * 8 + 14, y + 10, x + i * 6 + 2, y); c.stroke(); }
          c.fillStyle = '#4a3a2a'; for (let i = 0; i < 6; i++) c.fillRect(x + (i * 11) % 32, y + (i * 17) % 30, 3, 3);
        }
      } else if (ch === ',') {
        c.fillStyle = '#3e5a46'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = 'rgba(160,220,170,.12)'; c.fillRect(x + (tx * 11) % 28 + 2, y + (ty * 5) % 28 + 3, 2, 5);
      } else if (ch === 'T') {
        c.fillStyle = '#1e3028'; c.fillRect(x, y, TILE, TILE);
        c.fillStyle = '#2c4a3a';
        c.beginPath(); c.arc(x + 18 + Math.sin(tx * 3 + ty) * 4, y + 16, 17, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.arc(x + 12, y + 10, 7, 0, Math.PI * 2); c.fill();
      }
    },
    lights() {
      const L = [];
      for (const v of VOWS) if (st.lit.includes(v.id)) L.push({ x: (v.tx + .5) * TILE, y: (v.ty + .3) * TILE, r: TILE * 2.4, a: 0.85 });
      if (st.big) L.push({ x: bx, y: by - 40, r: TILE * 4.5, a: 1 });
      if (st.open) L.push({ x: 6.5 * TILE, y: 6.5 * TILE, r: TILE * 1.6, a: 0.5 });
      return L;
    },
    drawAdd(c, eng) {
      for (const v of VOWS) if (st.lit.includes(v.id)) { const r = TILE * 1.4 + Math.sin(eng.t * 2 + v.tx) * 3; c.globalAlpha = 0.5; c.drawImage(eng.goldSprite, (v.tx + .5) * TILE - r, (v.ty + .2) * TILE - r, r * 2, r * 2); }
      if (st.big) { const r = TILE * 3 + Math.sin(eng.t) * 5; c.globalAlpha = 0.6; c.drawImage(eng.goldSprite, bx - r, by - 50 - r, r * 2, r * 2); }
      c.globalAlpha = 1;
    },
    init(eng) { E = eng; },
    update() {},
    onChant(eng) {
      const p = eng.player, R = TILE * 3.6;
      let any = false;
      for (const v of VOWS) {
        if (st.lit.includes(v.id)) continue;
        if (Math.hypot((v.tx + .5) * TILE - p.x, (v.ty + .5) * TILE - p.y) < R) { st.lit.push(v.id); any = true; }
      }
      if (any) setTimeout(() => { A.sfx('open'); hint('碑文在佛光中顯現了。走近石碑看看。', 3200); }, 350);
      if (!st.big && st.open && Math.hypot(bx - p.x, by - p.y) < TILE * 4.5) {
        st.big = true; setTimeout(() => { A.sfx('grant'); hint('第十八願碑放出光明。走近碑前。', 3500); }, 350);
      }
      if (!st.tutor) st.tutor = 1;
    },
    onBumpFog() {
      st.bumps++;
      hint(st.bumps < 2 ? '煩惱黑霧擋住了林間小路。' : '稱念「南無阿彌陀佛」，佛光會驅散黑霧。', 3200);
    },
    async enter() {
      if (st.lit.length || st.read.length || st.tutor) return;
      await dialog([
        { text: '久遠劫以前，有一位國王，聽聞佛法，捨棄王位出家，名叫法藏。' },
        { text: '他為了救度一切眾生，五劫思惟，發下了四十八個大願。' },
        { text: '這片幽深的「思惟之林」裡，立著一座座願碑。' },
      ]);
      hint('林子很暗，碑文看不清。<br>走近石碑，稱念「南無阿彌陀佛」。', 5000);
    },
    getState() { return { ...st, lit: [...st.lit], read: [...st.read] }; },
    setState(s) { Object.assign(st, s); st.lit = [...(s.lit || [])]; st.read = [...(s.read || [])]; st.done = false; },
  };
}

function stele(c, x, y, s, lit, read, t, label) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = lit ? '#8a7a5a' : '#4a4e50'; c.fillRect(-14, -7, 28, 7);
  const g = c.createLinearGradient(-11, -40, 11, -7);
  g.addColorStop(0, lit ? '#d9c79a' : '#6a6e70'); g.addColorStop(1, lit ? '#b8a070' : '#505456');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-11, -7); c.lineTo(-11, -34); c.quadraticCurveTo(0, -44, 11, -34); c.lineTo(11, -7); c.closePath(); c.fill();
  if (lit) {
    c.fillStyle = `rgba(150,90,10,${0.75 + 0.2 * Math.sin(t * 3)})`;
    for (let col = 0; col < 3; col++) for (let r = 0; r < 5; r++) c.fillRect(-7 + col * 6, -32 + r * 5, 3, 3);
    if (label) {
      c.font = 'bold 9px "Noto Serif TC", serif'; c.textAlign = 'center';
      c.fillStyle = read ? '#fff6d6' : '#ffe9a8'; c.strokeStyle = 'rgba(60,30,0,.8)'; c.lineWidth = 2.5;
      c.strokeText(label, 0, -48); c.fillText(label, 0, -48);
    }
  } else {
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
    for (let r = 0; r < 4; r++) { c.beginPath(); c.moveTo(-6, -30 + r * 6); c.lineTo(6, -30 + r * 6); c.stroke(); }
  }
  c.restore();
}
function plaque(c, x, y) {
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y, 12, 3.5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#6a5038'; c.fillRect(x - 2, y - 16, 4, 16);
  c.fillStyle = '#9a7a52'; c.fillRect(x - 13, y - 30, 26, 16);
  c.strokeStyle = '#5a4028'; c.lineWidth = 1.5; c.strokeRect(x - 13, y - 30, 26, 16);
  c.fillStyle = 'rgba(60,40,20,.6)'; for (let i = 0; i < 3; i++) c.fillRect(x - 9 + i * 7, y - 26, 4, 8);
}
