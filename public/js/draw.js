// 角色繪製（全部以 Canvas 路徑畫成，不需圖檔）

// ---------- 人物（修長比例的剪紙風，不做大頭 Q 版） ----------
// (x, y) 為腳底中心。保留 chibi 這個名字只是為了相容舊呼叫。
export function chibi(ctx, x, y, o) {
  const { robe = '#d9d2c3', sash = '#8a6a4a', hair = '#2b2622', skin = '#ecd2b4', facing = 'down', phase = 0, sad = false, scale = 1 } = o;
  const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  const sway = Math.sin(phase) * 1.4;
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.ellipse(0, 0, 8, 2.8, 0, 0, Math.PI * 2); ctx.fill();
  // 長袍：細長的鐘形，下擺隨步伐擺動
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, shade(robe, -18)); g.addColorStop(0.5, robe); g.addColorStop(1, shade(robe, -28));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3.4, -25);
  ctx.quadraticCurveTo(-6.5, -14, -8 + sway, -1);
  ctx.quadraticCurveTo(0, 1.2, 8 + sway, -1);
  ctx.quadraticCurveTo(6.5, -14, 3.4, -25);
  ctx.closePath(); ctx.fill();
  // 交領與腰帶
  ctx.strokeStyle = shade(robe, -45); ctx.lineWidth = 1;
  if (facing !== 'up') { ctx.beginPath(); ctx.moveTo(-3, -24.5); ctx.lineTo(1.5, -18); ctx.moveTo(3, -24.5); ctx.lineTo(-0.5, -20.5); ctx.stroke(); }
  ctx.fillStyle = sash; ctx.fillRect(-4.8, -16.5, 9.6, 1.8);
  // 袖
  ctx.fillStyle = shade(robe, -10);
  ctx.beginPath(); ctx.ellipse(-5.2 + side, -18, 2.4, 5, 0.25, 0, Math.PI * 2); ctx.ellipse(5.2 + side, -18, 2.4, 5, -0.25, 0, Math.PI * 2); ctx.fill();
  if (o.extra) o.extra(ctx);
  // 頸與頭（小頭，約全身七分之一強）
  ctx.fillStyle = skin;
  ctx.fillRect(-1.2, -27.5, 2.4, 3);
  ctx.beginPath(); ctx.ellipse(side * 0.6, -31, 4.4, 5, 0, 0, Math.PI * 2); ctx.fill();
  // 髮
  ctx.fillStyle = hair;
  if (o.hairStyle !== 'none') {
    ctx.beginPath();
    if (facing === 'up') ctx.ellipse(0, -31.4, 4.6, 5.1, 0, 0, Math.PI * 2);
    else { ctx.ellipse(side * 0.6, -33, 4.6, 3.4, 0, Math.PI, Math.PI * 2); }
    ctx.fill();
    if (o.hairStyle === 'bun') { ctx.beginPath(); ctx.ellipse(0, -37.5, 2.6, 2.2, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (o.crown) { ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.moveTo(-3.6, -36); ctx.lineTo(-2, -39.5); ctx.lineTo(0, -37); ctx.lineTo(2, -39.5); ctx.lineTo(3.6, -36); ctx.closePath(); ctx.fill(); }
  // 臉：只畫細線眉眼，不做大眼睛與腮紅
  if (facing !== 'up' && !o.hat) {
    const ex = side * 1.6;
    ctx.strokeStyle = '#3a2c22'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (sad) { ctx.moveTo(ex - 2.6, -31.6); ctx.lineTo(ex - 0.9, -31); ctx.moveTo(ex + 2.6, -31.6); ctx.lineTo(ex + 0.9, -31); }
    else { ctx.moveTo(ex - 2.6, -31); ctx.quadraticCurveTo(ex - 1.7, -31.7, ex - 0.8, -31); ctx.moveTo(ex + 0.8, -31); ctx.quadraticCurveTo(ex + 1.7, -31.7, ex + 2.6, -31); }
    ctx.stroke();
  }
  if (o.hat) {
    // 斗笠
    ctx.fillStyle = '#c8a466';
    ctx.beginPath(); ctx.ellipse(0, -33.2, 10.5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9b97a';
    ctx.beginPath(); ctx.moveTo(-9, -33.6); ctx.quadraticCurveTo(0, -42, 9, -33.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(110,80,40,.5)'; ctx.lineWidth = 0.7;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, -40.5); ctx.lineTo(i * 4, -33.8); ctx.stroke(); }
  }
  if (o.after) o.after(ctx);
  ctx.restore();
}
function shade(hex, d) {
  const n = parseInt(hex.slice(1), 16);
  const c = v => Math.max(0, Math.min(255, v + d));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

// 小行者：戴斗笠、持杖，杖頭掛一盞小燈籠
export function traveler(ctx, x, y, facing, phase, lamp, lampColor) {
  const side = facing === 'left' ? -1 : 1;
  chibi(ctx, x, y, {
    robe: '#e9e3d3', sash: '#7a8a6a', hair: '#2b2622', facing, phase, hat: true,
    extra: c => {
      // 杖
      c.strokeStyle = '#7a5a36'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(7 * side, -1); c.lineTo(8.5 * side, -36); c.stroke();
    },
    after: c => {
      const lx = 11.5 * side, ly = -31 + Math.sin(phase * 2) * 0.8;
      c.strokeStyle = '#7a5a36'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(8.5 * side, -36); c.lineTo(lx, ly - 4); c.stroke();
      const [r, g, b] = lampColor;
      c.fillStyle = `rgba(${r},${g},${b},${0.55 + lamp * 0.45})`;
      c.beginPath(); c.ellipse(lx, ly, 2.8, 3.6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6b5236'; c.fillRect(lx - 2.4, ly - 4.4, 4.8, 1.2); c.fillRect(lx - 2.4, ly + 3.2, 4.8, 1.1);
    },
  });
}

// 韋提希夫人：長袍曳地、頂戴寶冠
export function vaidehi(ctx, x, y, facing = 'down', t = 0) {
  chibi(ctx, x, y, {
    robe: '#9c6f92', sash: '#e8b84a', hair: '#1f1a1a', hairStyle: 'bun', facing, phase: 0, crown: true,
    sad: false, scale: 1.12,
    extra: c => { c.fillStyle = 'rgba(232,184,74,.55)'; c.fillRect(-0.6, -16, 1.2, 15); },
  });
}

// ---------- 佛像（莊嚴比例，不 Q 版化） ----------
// kind: 'amitabha' 站姿接引（右手垂下接引、左手當胸）
//       'shakyamuni' 站姿（右手施無畏、左手與願），東岸發遣
// (x, y) 為蓮座底部中心；h 為整體高度（像素）
export function buddha(ctx, x, y, h, kind, t = 0, glow = 1) {
  const s = h / 100;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);

  // 身光與頭光
  const pulse = 1 + Math.sin(t * 1.2) * 0.03;
  let g = ctx.createRadialGradient(0, -58, 4, 0, -58, 58 * pulse);
  g.addColorStop(0, `rgba(255,236,170,${0.55 * glow})`);
  g.addColorStop(0.6, `rgba(242,195,91,${0.28 * glow})`);
  g.addColorStop(1, 'rgba(242,195,91,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -55, 40 * pulse, 58 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,220,140,${0.6 * glow})`; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(0, -55, 30, 50, 0, 0, Math.PI * 2); ctx.stroke();
  g = ctx.createRadialGradient(0, -86, 2, 0, -86, 15);
  g.addColorStop(0, 'rgba(255,250,220,.95)'); g.addColorStop(0.7, 'rgba(255,214,120,.6)'); g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -86, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,160,.9)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -86, 12.5, 0, Math.PI * 2); ctx.stroke();

  // 蓮座
  ctx.fillStyle = '#e9a7b6';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 6, -3, 4.2, 6.5, i * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f7d2da';
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 6.5, -6, 3.6, 5.5, i * 0.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#c98a2b'; ctx.fillRect(-20, -2, 40, 3);

  const skin = '#f0c66e', skinD = '#d8a64c', robe = '#b5532f', robeL = '#d0703f', robeIn = '#e8b85a';

  // 足
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(-4, -9, 3, 1.6, 0, 0, Math.PI * 2); ctx.ellipse(4, -9, 3, 1.6, 0, 0, Math.PI * 2); ctx.fill();

  // 袈裟主體（通肩長袍）
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-10, -74);            // 左肩（觀者左）
  ctx.quadraticCurveTo(-15, -66, -16, -52);
  ctx.lineTo(-17, -10);
  ctx.quadraticCurveTo(0, -6, 17, -10);
  ctx.lineTo(16, -52);
  ctx.quadraticCurveTo(15, -66, 10, -74);
  ctx.quadraticCurveTo(0, -77, -10, -74);
  ctx.fill();
  // 內裙
  ctx.fillStyle = robeIn;
  ctx.beginPath(); ctx.moveTo(-12, -22); ctx.quadraticCurveTo(0, -18, 12, -22); ctx.lineTo(13, -10); ctx.quadraticCurveTo(0, -7, -13, -10); ctx.closePath(); ctx.fill();
  // 衣紋（自左肩斜下的 U 形褶）
  ctx.strokeStyle = robeL; ctx.lineWidth = 1.1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 + i * 0.4, -66 + i * 9);
    ctx.quadraticCurveTo(0, -58 + i * 10, 13, -68 + i * 9);
    ctx.stroke();
  }
  // 金邊
  ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(-10, -74); ctx.quadraticCurveTo(0, -68, 10, -74); ctx.stroke();

  // 手臂與手
  const hand = (hx, hy, rot, open = true) => {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(0, 0, 3, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    if (open) { ctx.fillRect(-2.6, -7, 1.4, 4); ctx.fillRect(-0.9, -8, 1.4, 5); ctx.fillRect(0.8, -7.5, 1.4, 4.5); ctx.fillRect(2.3, -6, 1.2, 3); }
    ctx.restore();
  };
  ctx.fillStyle = robe;
  if (kind === 'amitabha') {
    // 觀者左側＝佛的右手：垂下接引
    ctx.beginPath(); ctx.moveTo(-14, -66); ctx.quadraticCurveTo(-23, -52, -24, -36); ctx.lineTo(-18, -35); ctx.quadraticCurveTo(-17, -50, -11, -60); ctx.fill();
    hand(-21.5, -31, Math.PI, true);
    // 觀者右側＝佛的左手：當胸
    ctx.fillStyle = robe;
    ctx.beginPath(); ctx.moveTo(13, -66); ctx.quadraticCurveTo(19, -56, 12, -52); ctx.lineTo(4, -54); ctx.quadraticCurveTo(10, -58, 9, -62); ctx.fill();
    hand(4, -57, -0.3, true);
  } else {
    // 釋迦：右手（觀者左）施無畏舉於胸前，左手（觀者右）與願下垂
    ctx.beginPath(); ctx.moveTo(-14, -66); ctx.quadraticCurveTo(-21, -56, -18, -50); ctx.lineTo(-12, -52); ctx.quadraticCurveTo(-14, -58, -11, -61); ctx.fill();
    hand(-15, -57, 0, true);
    ctx.fillStyle = robe;
    ctx.beginPath(); ctx.moveTo(14, -66); ctx.quadraticCurveTo(22, -52, 22, -38); ctx.lineTo(16, -37); ctx.quadraticCurveTo(16, -50, 11, -60); ctx.fill();
    hand(19.5, -33, Math.PI + 0.15, true);
  }

  // 頸、頭
  ctx.fillStyle = skinD; ctx.fillRect(-3, -78, 6, 5);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(0, -86, 7.2, 8.6, 0, 0, Math.PI * 2); ctx.fill();
  // 耳（長垂）
  ctx.beginPath(); ctx.ellipse(-7.4, -84, 1.6, 4.2, 0.1, 0, Math.PI * 2); ctx.ellipse(7.4, -84, 1.6, 4.2, -0.1, 0, Math.PI * 2); ctx.fill();
  // 螺髮與肉髻
  ctx.fillStyle = '#2c3a6b';
  ctx.beginPath(); ctx.arc(0, -89, 7.4, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(0, -91.5, -7.2, -90); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -96.5, 4.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3d4f8a';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-6 + i * 1.5, -92 + Math.abs(i - 4) * 0.35, 0.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.arc(0, -99.5, 1.1, 0, Math.PI * 2); ctx.fill();
  // 白毫、垂目、唇
  ctx.fillStyle = '#fff8e0'; ctx.beginPath(); ctx.arc(0, -88, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6b4a20'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-4.4, -85.4); ctx.quadraticCurveTo(-2.7, -84.4, -1.2, -85.3);
  ctx.moveTo(1.2, -85.3); ctx.quadraticCurveTo(2.7, -84.4, 4.4, -85.4); ctx.stroke();
  ctx.strokeStyle = '#b06a3a';
  ctx.beginPath(); ctx.moveTo(-1.6, -80.6); ctx.quadraticCurveTo(0, -79.8, 1.6, -80.6); ctx.stroke();
  ctx.restore();
}

// 煩惱黑霧一團
export function fogPuff(ctx, cx, cy, size, t, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < 5; i++) {
    const a = t * 0.6 + i * 1.3;
    const px = cx + Math.cos(a) * size * 0.22, py = cy + Math.sin(a * 1.3) * size * 0.18;
    const r = size * (0.42 + 0.08 * Math.sin(a * 2));
    const g = ctx.createRadialGradient(px, py, 1, px, py, r);
    g.addColorStop(0, 'rgba(28,22,40,.95)'); g.addColorStop(0.7, 'rgba(40,32,58,.75)'); g.addColorStop(1, 'rgba(40,32,58,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
