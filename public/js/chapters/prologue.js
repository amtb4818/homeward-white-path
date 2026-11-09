// 序章【王舍城——韋提希的祈求】（出處：《觀無量壽經》序分）
import { TILE } from '../engine.js';
import { chibi, vaidehi, buddha } from '../draw.js';
import { dialog, hint, toast, grant, openCard } from '../ui.js';
import * as A from '../audio.js';

export const MAP = [
  '###############',
  '#PPPPPPPPPPPPP#',
  '#P,,,,,,,,,,,P#',
  '#P,,.......,,P#',
  '#P,,.......,,P#',
  '#P,,,,,.,,,,,P#',
  '#PPPPPPGPPPPPP#',
  '#####,...,#####',
  '#...#,...,#...#',
  '#...#.....#...#',
  '#...f.....f...#',
  '#####.....#####',
  '#,,,,.....,,,,#',
  '#,T,,.....,,T,#',
  '#,,,,..~..,,,,#',
  '#,,,,.~~~.,,,,#',
  '#,T,,..~..,,T,#',
  '#,,,,.....,,,,#',
  '#####fffff#####',
  '#...f.....f...#',
  '#...#.....#...#',
  '#...#.....#...#',
  '#####.....#####',
  '#,,,,.....,,,,#',
  '#,T,,..,..,,T,#',
  '###############',
];

const C = (tx, ty) => [(tx + .5) * TILE, (ty + .85) * TILE];

const LANDS = [
  { id: 'l1', tx: 3, ty: 4, color: '#e0b84a', name: '七寶合成之國', text: '或有國土，七寶合成。', note: '金、銀、琉璃……七寶交輝，莊嚴無比。' },
  { id: 'l2', tx: 5, ty: 3, color: '#f3a6b8', name: '純是蓮花之國', text: '復有國土，純是蓮花。', note: '舉目所見，盡是蓮花。' },
  { id: 'l3', tx: 11, ty: 4, color: '#8fd3e8', name: '如頗梨鏡之國', text: '復有國土，如頗梨鏡，十方國土，皆於中現。', note: '清澈明淨，如同明鏡。' },
];

export function createPrologue() {
  const st = { heard: [], gate: false, stage: 0, seen: [], tutor: 0, bumps: 0 };
  // stage: 0 探索 / 1 光臺已現 / 2 極樂門已現 / 3 等待一同稱名 / 4 完成
  const ents = [];

  const npc = (id, tx, ty, opts, lines) => {
    const [x, y] = C(tx, ty);
    const e = {
      id, x, y, h: 40, block: [[tx, ty]], name: opts.name,
      draw: (c, t) => {
        chibi(c, x, y, { ...opts, facing: 'down', sad: !st.heard.includes(id) });
        if (opts.baby) { c.fillStyle = '#f6efe2'; c.beginPath(); c.ellipse(x + 2, y - 13, 6, 4.5, 0.3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f3d6b8'; c.beginPath(); c.arc(x + 6, y - 15, 3, 0, Math.PI * 2); c.fill(); }
        if (opts.cane) { c.strokeStyle = '#6b5236'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 12, y); c.lineTo(x + 10, y - 22); c.stroke(); }
        if (opts.bed) { c.fillStyle = 'rgba(160,150,140,.8)'; c.fillRect(x - 16, y - 2, 32, 6); }
        if (opts.incense) { c.fillStyle = '#7a6a5a'; c.fillRect(x - 18, y - 8, 6, 8); c.strokeStyle = 'rgba(220,220,220,.5)'; c.beginPath(); c.moveTo(x - 15, y - 8); c.quadraticCurveTo(x - 12 + Math.sin(t * 2) * 3, y - 18, x - 15, y - 28); c.stroke(); }
      },
      interact: async () => {
        const first = !st.heard.includes(id);
        await dialog(lines.map(t => ({ name: opts.name, text: t })));
        if (first) {
          st.heard.push(id);
          await dialog([{ text: `（你把他的心事放在心上。${st.heard.length}／4）` }]);
          if (st.heard.length === 4) openGate();
        }
      },
    };
    ents.push(e); return e;
  };

  npc('sheng', 2, 20, { name: '年輕母親', robe: '#9aa6b8', sash: '#6b7a90', hair: '#2b2622', hairStyle: 'bun', baby: true }, [
    '孩子出生了，大家都說恭喜，我卻高興不起來。',
    '他將來也要生病、也要老、也要和所愛的人分離……',
    '有沒有一個地方，能讓他不再受這些苦呢？',
  ]);
  npc('lao', 12, 20, { name: '老爺爺', robe: '#8c8a86', sash: '#5a5650', hair: '#d8d8d8', cane: true }, [
    '年輕時，我跑得比誰都快。',
    '如今走幾步路就喘，眼睛也看不清了。',
    '人老了才知道，時間是留不住的。',
  ]);
  npc('bing', 2, 9, { name: '病中的人', robe: '#a8b0b8', sash: '#7a8088', hair: '#3a3430', bed: true }, [
    '病了好些日子，藥一碗一碗地喝，還是不見好。',
    '這個身體這麼不可靠……',
    '我還能依靠什麼呢？',
  ]);
  npc('si', 12, 9, { name: '失去父親的人', robe: '#5f6470', sash: '#3e424c', hair: '#2b2622', incense: true }, [
    '我的父親，上個月走了。',
    '人死了以後，到底去了哪裡？',
    '我好怕，再也見不到他了。',
  ]);

  // 韋提希夫人
  const [vx, vy] = C(8, 3);
  const vai = {
    id: 'vaidehi', x: vx, y: vy, h: 46, block: [[8, 3]], name: '韋提希夫人',
    draw: (c, t) => vaidehi(c, vx, vy, 'down', t),
    interact: async () => {
      if (st.stage === 0) {
        await dialog([
          { name: '韋提希夫人', text: '這世間有太多憂苦。生、老、病、死，誰也躲不過。' },
          { name: '韋提希夫人', text: '唯願世尊，為我廣說無憂惱處，我當往生，不樂閻浮提濁惡世也。', sutra: true },
          { text: '爾時世尊放眉間光，其光金色，遍照十方無量世界，還住佛頂，化為金臺，如須彌山。', sutra: true, do: () => { st.stage = 1; refresh(); A.sfx('open'); } },
          { text: '十方諸佛淨妙國土，皆於中現。', sutra: true },
        ]);
        hint('走進光臺中的小門，看看諸佛的國土。', 5000);
      } else if (st.stage === 1) {
        await dialog([{ name: '韋提希夫人', text: `我們一起看看諸佛的國土吧。（${st.seen.length}／3）` }]);
      } else {
        await dialog([{ name: '韋提希夫人', text: '走吧，往西方去，往阿彌陀佛那裡去。' }]);
      }
    },
  };
  ents.push(vai);

  // 釋迦佛（光臺上方，不可互動、不可碰撞）
  const [bx] = C(7, 1);
  const shakya = { id: 'shakya', x: bx, y: 2.05 * TILE, hidden: true, block: [[6, 2], [7, 2]], draw: (c, t) => buddha(c, bx, 2.1 * TILE, 78, 'shakyamuni', t, 1) };
  ents.push(shakya);

  // 光臺中的小門
  const portals = LANDS.map(l => {
    const [x, y] = C(l.tx, l.ty);
    return {
      id: l.id, x, y, h: 30, hidden: true, land: l,
      draw: (c, t) => drawPortal(c, x, y, l.color, t, st.seen.includes(l.id)),
    };
  });
  ents.push(...portals);
  const [jx, jy] = C(7, 3);
  const jile = { id: 'jile', x: jx, y: jy - 6, h: 34, hidden: true, draw: (c, t) => drawPortal(c, jx, jy - 6, '#ffd36b', t, false, true) };
  ents.push(jile);

  function openGate() {
    st.gate = true; A.sfx('open');
    toast('宮門開了');
    hint('王宮的門開了。韋提希夫人在宮中等著。', 4500);
  }

  async function enterLand(l) {
    A.sfx('portal');
    st.seen.push(l.id);
    await openCard(`
      <div class="tag">光 臺 所 現</div>
      <div style="height:110px;border-radius:12px;margin:6px 0 10px;background:radial-gradient(circle at 50% 60%, #fffbe8, ${l.color} 45%, #6a5a7a 120%)"></div>
      <h3>${l.name}</h3>
      <p class="quote">${l.text}<small>《佛說觀無量壽佛經》</small></p>
      <p style="text-align:center">${l.note}</p>
      <div class="row"><button class="btn ghost" data-close="ok">回到光臺</button></div>`);
    if (st.seen.length === 3) {
      await dialog([
        { name: '韋提希夫人', text: '世尊！是諸佛土，雖復清淨，皆有光明，', sutra: true },
        { name: '韋提希夫人', text: '我今樂生極樂世界阿彌陀佛所。', sutra: true, do: () => { st.stage = 2; refresh(); A.sfx('grant'); } },
      ]);
      hint('西方極樂世界之門開了。走進金色的門。', 5000);
    }
  }

  // 進入極樂之門後：不考問，而是和韋提希夫人一同面向西方稱名
  async function finish(eng) {
    st.stage = 3;
    await dialog([
      { text: '金色的門裡，透出西方的光明。' },
      { name: '韋提希夫人', text: '我們一起面向西方，稱念阿彌陀佛的名號吧。' },
    ]);
    hint('和韋提希夫人一起，稱念「南無阿彌陀佛」。', 6000);
  }
  async function receive(eng) {
    st.stage = 4;
    await dialog([{ text: '南無阿彌陀佛——西方的光明，照在兩人身上。' }]);
    await grant(['wuliang'], 'prologue');
    eng.complete('prologue', ['wuliang'], ['prologue2', 'prologue']);
  }

  let E = null;
  function refresh() {
    shakya.hidden = st.stage < 1;
    portals.forEach(p => { p.hidden = st.stage < 1; });
    jile.hidden = st.stage < 2;
    E && E.refreshBlocks();
  }

  return {
    id: 'prologue', name: '序章・王舍城', map: MAP, start: [7, 23], startFacing: 'up',
    bg: '#5d6678', ambient: { c: [22, 26, 44], a: 0.42 }, lanternDrain: 0, camBias: 0.55,
    theme: 'saha',
    entities: ents,
    tileSolid(ch, tx, ty) {
      if (ch === 'G') return !st.gate;
      return ch === '#' || ch === 'P' || ch === 'T' || ch === '~';
    },
    drawTile: drawCityTile(() => st.gate),
    lights(eng) {
      const L = [];
      if (st.stage >= 1) L.push({ x: 7.5 * TILE, y: 3 * TILE, r: TILE * 4.5, a: 0.9 });
      if (st.gate) L.push({ x: 7.5 * TILE, y: 6.5 * TILE, r: TILE * 2, a: 0.6 });
      return L;
    },
    drawAdd(c, eng) {
      if (st.stage >= 1) {
        const r = TILE * 3.5 + Math.sin(eng.t) * 4;
        c.globalAlpha = 0.45; c.drawImage(eng.goldSprite, 7.5 * TILE - r, 2.6 * TILE - r, r * 2, r * 2); c.globalAlpha = 1;
      }
    },
    drawGround(c, eng) {
      if (st.stage >= 1) {
        // 光臺
        c.save(); c.globalAlpha = 0.5 + 0.1 * Math.sin(eng.t * 2);
        c.fillStyle = '#ffe7a6';
        c.beginPath(); c.ellipse(7.5 * TILE, 3.9 * TILE, TILE * 4.6, TILE * 1.2, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    },
    init(eng) { E = eng; refresh(); },
    update(dt, eng) {
      const p = eng.player;
      // 進入小門
      if (st.stage >= 1 && !eng.interacting) {
        for (const pt of portals) {
          if (!st.seen.includes(pt.id) && Math.hypot(pt.x - p.x, pt.y - p.y) < 16) { eng.interacting = true; p.path = null; enterLand(pt.land).finally(() => { eng.interacting = false; }); return; }
        }
        if (st.stage === 2 && Math.hypot(jile.x - p.x, jile.y - p.y) < 18) { eng.interacting = true; p.path = null; A.sfx('portal'); finish(eng).finally(() => { eng.interacting = false; }); return; }
      }
      // 宮門未開時靠近
      if (!st.gate && p.y < 7.9 * TILE && Math.abs(p.x - 7.5 * TILE) < TILE && !this._gateHint) {
        this._gateHint = true; hint(`宮門深鎖。先去聽聽城中人們的心事吧（${st.heard.length}／4）。`, 4000);
        setTimeout(() => { this._gateHint = false; }, 6000);
      }
    },
    onBumpFog(eng) {
      st.bumps++;
      if (!st.tutor) hint(st.bumps < 2 ? '小燈籠的光，照不透這片黑霧……' : '試試按右下角的「南無阿彌陀佛」。<br><small>（電腦：空白鍵）</small>', 3600);
    },
    onChant(eng) {
      if (st.stage === 3 && !eng.interacting) { eng.interacting = true; setTimeout(() => receive(eng).finally(() => { eng.interacting = false; }), 600); return; }
      if (!st.tutor) { st.tutor = 1; hint('佛光從西方照來，黑霧散去了。', 3000); }
    },
    async enter(eng) {
      if (st.heard.length || st.stage) return;
      await dialog([
        { text: '王舍城。天色灰濛濛的，街上的人都低著頭。' },
        { text: '城裡有四個人，各有一件放不下的心事。去聽聽他們吧。' },
      ]);
      hint('按住畫面拖曳移動，或輕點想去的地方。<br>前方被「煩惱黑霧」擋住了。', 5000);
    },
    getState() { return { ...st }; },
    setState(s) { Object.assign(st, s); if (st.stage > 3) st.stage = 3; st.heard = [...(s.heard || [])]; st.seen = [...(s.seen || [])]; },
  };
}

function drawPortal(c, x, y, color, t, seen, big) {
  const r = big ? 15 : 12;
  c.save();
  c.globalAlpha = seen ? 0.45 : 1;
  const g = c.createRadialGradient(x, y - r, 2, x, y - r, r * 1.6);
  g.addColorStop(0, '#fffbe8'); g.addColorStop(0.5, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y - r, r * 1.2 + Math.sin(t * 3) * 1.5, r * 1.6, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#fff3cf'; c.lineWidth = 1.5;
  c.beginPath(); c.ellipse(x, y - r, r * 0.8, r * 1.2, 0, 0, Math.PI * 2); c.stroke();
  c.restore();
}

// 王舍城地磚（低彩度灰藍，越往上［西］越暖）
// vivid：0＝原本的灰，1＝終章城市恢復色彩
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
export function drawCityTile(gateOpen, vivid = () => 0) {
  return (c, ch, tx, ty, x, y, t, eng) => {
    const k = vivid();
    const warm = Math.max(0, (12 - ty) / 12);
    const street = mix([110 + warm * 30, 118 + warm * 14, 134 - warm * 10], [214, 190, 148], k);
    const grass = mix([92 + warm * 20, 110 + warm * 10, 100], [118, 182, 96], k);
    if (ch === '.' || ch === 'G') {
      c.fillStyle = street; c.fillRect(x, y, TILE, TILE);
      c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, TILE / 2, TILE / 2); c.strokeRect(x + TILE / 2 + 0.5, y + TILE / 2 + 0.5, TILE / 2 - 1, TILE / 2 - 1);
      if (ch === 'G') {
        const open = gateOpen();
        c.fillStyle = '#8a3a2a';
        if (open) { c.fillRect(x - 2, y, 6, TILE); c.fillRect(x + TILE - 4, y, 6, TILE); }
        else {
          c.fillRect(x, y, TILE, TILE);
          c.fillStyle = '#e8b84a';
          for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(x + 8 + j * 20, y + 8 + i * 10, 1.6, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = '#5a2418'; c.fillRect(x + TILE / 2 - 1, y, 2, TILE);
        }
      }
    } else if (ch === ',' || ch === 'T') {
      c.fillStyle = grass; c.fillRect(x, y, TILE, TILE);
      c.fillStyle = 'rgba(255,255,255,.05)';
      c.fillRect(x + ((tx * 7) % 20) + 4, y + ((ty * 11) % 20) + 6, 2, 4);
      if (ch === 'T') {
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 18, y + 31, 13, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#5a4636'; c.fillRect(x + 15, y + 18, 6, 13);
        c.fillStyle = mix([60 + warm * 20, 88 + warm * 10, 78], [62, 146, 78], k);
        c.beginPath(); c.arc(x + 18, y + 13, 14, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(x + 13, y + 8, 6, 0, Math.PI * 2); c.fill();
      }
    } else if (ch === '~') {
      c.fillStyle = mix([76, 102, 128], [84, 168, 222], k); c.fillRect(x, y, TILE, TILE);
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.2;
      const o = Math.sin(t + tx) * 3;
      c.beginPath(); c.arc(x + 12 + o, y + 14, 5, Math.PI * 1.1, Math.PI * 1.9); c.arc(x + 24 - o, y + 26, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    } else if (ch === '#') {
      const below = eng.grid[ty + 1] && eng.grid[ty + 1][tx];
      c.fillStyle = mix([63, 72, 96], [168, 82, 58], k); c.fillRect(x, y, TILE, TILE);
      c.fillStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 4; i++) c.fillRect(x, y + i * 9, TILE, 1);
      if (below && below !== '#' && below !== 'P') {
        c.fillStyle = mix([139, 144, 158], [242, 232, 212], k); c.fillRect(x, y + TILE - 14, TILE, 14);
        c.fillStyle = '#2f3546'; c.fillRect(x, y + TILE - 16, TILE, 3);
        if ((tx + ty) % 3 === 0) { c.fillStyle = '#5a4a3e'; c.fillRect(x + 12, y + TILE - 12, 12, 12); }
        else { c.fillStyle = '#c9c2a8'; c.fillRect(x + 10, y + TILE - 11, 7, 6); c.fillRect(x + 20, y + TILE - 11, 7, 6); }
      }
    } else if (ch === 'P') {
      c.fillStyle = mix([122, 95, 90], [184, 58, 46], k); c.fillRect(x, y, TILE, TILE);
      c.fillStyle = mix([154, 122, 98], [232, 184, 74], k); c.fillRect(x, y, TILE, 6);
      c.fillStyle = 'rgba(232,184,74,.5)'; c.fillRect(x, y + 6, TILE, 2);
      const below = eng.grid[ty + 1] && eng.grid[ty + 1][tx];
      if (below && below !== 'P' && below !== '#' && below !== 'G') { c.fillStyle = '#5a403a'; c.fillRect(x, y + TILE - 8, TILE, 8); }
    }
  };
}
