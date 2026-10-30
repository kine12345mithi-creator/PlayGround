// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';

const cache = new Map();
const C = (w, h = w) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return c;
};
const tex = (canvas, repeat) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
};

function rng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function facadeTexture(kind = 'stone') {
  const key = 'facade-' + kind;
  if (cache.has(key)) return cache.get(key);
  const w = 128, h = 256;
  const map = C(w, h), glow = C(w, h);
  const m = map.getContext('2d'), g = glow.getContext('2d');
  const base = { stone:['#cfc6b6','#a89e8c'], glass:['#7e93a3','#3d5364'], brick:['#a9745c','#6f4a3a'], concrete:['#b6b6b0','#8b8b84'] }[kind] || ['#cfc6b6','#a89e8c'];
  const grd = m.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, base[1]); grd.addColorStop(0.45, base[0]); grd.addColorStop(1, base[1]);
  m.fillStyle = grd; m.fillRect(0, 0, w, h);
  m.fillStyle = 'rgba(0,0,0,0.12)'; m.fillRect(0, 0, 5, h); m.fillRect(w - 5, 0, 5, h);
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const r = rng(kind.length * 977 + 13);
  const cols = kind === 'glass' ? 7 : 5, rows = 16;
  const padX = 10, padY = 10;
  const cw = (w - padX * 2) / cols, ch = (h - padY * 2) / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const wx = padX + x * cw + cw * 0.18, wy = padY + y * ch + ch * 0.18;
      const ww = cw * 0.64, wh = ch * 0.58;
      m.fillStyle = kind === 'glass' ? (r() > 0.3 ? '#496473' : '#617c8c') : '#1d2a35';
      m.fillRect(wx, wy, ww, wh);
      m.fillStyle = 'rgba(255,255,255,0.08)'; m.fillRect(wx, wy, ww, 2);
      if (r() < 0.46) {
        g.fillStyle = r() < 0.2 ? '#fff3c4' : '#ffd479';
        g.fillRect(wx, wy, ww, wh);
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(wx, wy, ww * 0.25, wh);
      }
    }
  }
  // ground floor
  m.fillStyle = 'rgba(0,0,0,0.28)'; m.fillRect(0, h - 22, w, 22);
  g.fillStyle = '#ffcf7a'; g.fillRect(6, h - 18, w - 12, 8);
  const out = { map: tex(map, [1.6, 3.2]), emissive: tex(glow, [1.6, 3.2]) };
  cache.set(key, out);
  return out;
}

export function padTexture(seed = 1, size = 8, dc = false) {
  const key = `pad-${seed}-${size}-${dc}`;
  if (cache.has(key)) return cache.get(key);
  const S = 1024, c = C(S), x = c.getContext('2d');
  const r = rng(seed * 41 + 7);
  x.fillStyle = '#2b2f34'; x.fillRect(0, 0, S, S);
  const cell = S / size;
  const road = dc ? 14 : 18;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const px = i * cell, py = j * cell;
      const tone = 44 + Math.floor(r() * 26);
      x.fillStyle = `rgb(${tone},${tone + 3},${tone + 6})`;
      x.fillRect(px + road, py + road, cell - road * 2, cell - road * 2);
      if (r() < 0.12) {
        x.fillStyle = '#355a3d'; x.fillRect(px + road + 4, py + road + 4, cell - road * 2 - 8, cell - road * 2 - 8);
        x.fillStyle = 'rgba(120,160,110,0.35)';
        for (let k = 0; k < 9; k++) x.fillRect(px + road + 10 + r() * (cell - road * 2 - 20), py + road + 10 + r() * (cell - road * 2 - 20), 4, 4);
      } else if (r() < 0.3) {
        x.fillStyle = 'rgba(255,255,255,0.045)';
        x.fillRect(px + road + 8, py + road + 8, cell - road * 2 - 16, cell - road * 2 - 16);
      }
    }
  }
  // roads
  x.strokeStyle = '#1e2227'; x.lineWidth = road;
  for (let i = 0; i <= size; i++) {
    x.beginPath(); x.moveTo(i * cell, 0); x.lineTo(i * cell, S); x.stroke();
    x.beginPath(); x.moveTo(0, i * cell); x.lineTo(S, i * cell); x.stroke();
  }
  // lane markings
  x.strokeStyle = 'rgba(231,210,150,0.55)'; x.lineWidth = 2; x.setLineDash([12, 18]);
  for (let i = 1; i < size; i++) {
    x.beginPath(); x.moveTo(i * cell, 0); x.lineTo(i * cell, S); x.stroke();
    x.beginPath(); x.moveTo(0, i * cell); x.lineTo(S, i * cell); x.stroke();
  }
  x.setLineDash([]);
  // sidewalks
  x.strokeStyle = 'rgba(220,215,200,0.18)'; x.lineWidth = 3;
  for (let i = 1; i < size; i++) {
    x.strokeRect(i * cell - road / 2, 0, road, S);
    x.strokeRect(0, i * cell - road / 2, S, road);
  }
  if (dc) {
    x.strokeStyle = 'rgba(40,46,48,0.9)'; x.lineWidth = 30;
    x.beginPath(); x.moveTo(0, S * 0.2); x.lineTo(S, S * 0.86); x.stroke();
    x.beginPath(); x.moveTo(0, S * 0.86); x.lineTo(S, S * 0.18); x.stroke();
    x.beginPath(); x.arc(S * 0.5, S * 0.5, S * 0.23, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#2f5b38'; x.beginPath(); x.ellipse(S * 0.5, S * 0.3, S * 0.19, S * 0.11, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.beginPath(); x.ellipse(S * 0.5, S * 0.3, S * 0.17, S * 0.09, 0, 0, Math.PI * 2); x.fill();
  }
  const out = tex(c); out.wrapS = out.wrapT = THREE.ClampToEdgeWrapping;
  cache.set(key, out);
  return out;
}

export function asphaltTexture() {
  if (cache.has('asphalt')) return cache.get('asphalt');
  const c = C(128, 512), x = c.getContext('2d');
  x.fillStyle = '#24272b'; x.fillRect(0, 0, 128, 512);
  x.fillStyle = '#2e3237';
  for (let i = 0; i < 500; i++) x.fillRect(Math.random() * 128, Math.random() * 512, 2, 2);
  x.fillStyle = '#d8d2bd'; x.fillRect(10, 0, 3, 512); x.fillRect(115, 0, 3, 512);
  x.fillStyle = '#d8b75e';
  for (let y = 0; y < 512; y += 42) x.fillRect(62, y, 4, 24);
  const t = tex(c, [1, 1]); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set('asphalt', t);
  return t;
}

export function cloudTexture() {
  if (cache.has('cloud')) return cache.get('cloud');
  const S = 256, c = C(S), x = c.getContext('2d');
  const grads = [];
  for (let i = 0; i < 14; i++) {
    const cx = 40 + Math.random() * 176, cy = 100 + Math.random() * 60, rr = 30 + Math.random() * 55;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.5, 'rgba(255,255,255,0.38)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    grads.push(g);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill();
  }
  const t = tex(c); cache.set('cloud', t); return t;
}

export function glowTexture() {
  if (cache.has('glow')) return cache.get('glow');
  const S = 128, c = C(S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,240,200,0.55)'); g.addColorStop(1, 'rgba(255,200,100,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = tex(c); cache.set('glow', t); return t;
}

export function sealTexture(size = 512) {
  if (cache.has('seal')) return cache.get('seal');
  const S = size, c = C(S), x = c.getContext('2d');
  const cx = S / 2, cy = S / 2;
  x.clearRect(0, 0, S, S);
  x.fillStyle = '#0e2038'; x.beginPath(); x.arc(cx, cy, S * 0.47, 0, 7); x.fill();
  x.strokeStyle = '#c8a24a'; x.lineWidth = S * 0.012;
  x.beginPath(); x.arc(cx, cy, S * 0.45, 0, 7); x.stroke();
  x.beginPath(); x.arc(cx, cy, S * 0.39, 0, 7); x.stroke();
  // rays
  x.save(); x.translate(cx, cy);
  for (let i = 0; i < 36; i++) { x.rotate(Math.PI * 2 / 36); x.fillStyle = i % 2 ? 'rgba(200,162,74,0.45)' : 'rgba(200,162,74,0.15)'; x.beginPath(); x.moveTo(0, -S * 0.38); x.lineTo(S * 0.02, -S * 0.43); x.lineTo(-S * 0.02, -S * 0.43); x.fill(); }
  x.restore();
  // eagle silhouette
  x.fillStyle = '#e7d9ad';
  x.beginPath();
  x.moveTo(cx, cy - S * 0.2);
  x.bezierCurveTo(cx + S * 0.12, cy - S * 0.26, cx + S * 0.24, cy - S * 0.18, cx + S * 0.27, cy - S * 0.05);
  x.bezierCurveTo(cx + S * 0.16, cy - S * 0.07, cx + S * 0.08, cy + S * 0.01, cx + S * 0.04, cy + S * 0.13);
  x.lineTo(cx, cy + S * 0.05); x.lineTo(cx - S * 0.04, cy + S * 0.13);
  x.bezierCurveTo(cx - S * 0.08, cy + S * 0.01, cx - S * 0.16, cy - S * 0.07, cx - S * 0.27, cy - S * 0.05);
  x.bezierCurveTo(cx - S * 0.24, cy - S * 0.18, cx - S * 0.12, cy - S * 0.26, cx, cy - S * 0.2);
  x.fill();
  x.fillStyle = '#c8a24a';
  x.beginPath(); x.arc(cx, cy + S * 0.2, S * 0.035, 0, 7); x.fill();
  x.font = `${S * 0.075}px "Barlow Condensed", sans-serif`;
  x.fillStyle = '#e7d9ad'; x.textAlign = 'center';
  x.fillText('SEAL OF THE PRESIDENT', cx, cy + S * 0.36);
  x.fillText('OF THE UNITED STATES', cx, cy + S * 0.42);
  const t = tex(c); cache.set('seal', t); return t;
}

const FLAG_STYLES = {
  USA: { v: false, special: 'usa' },
  GBR: { special: 'uk' },
  FRA: { v: true, bands: 3 }, ITA: { v: true, bands: 3 },
  DEU: { h: true, bands: 3 }, RUS: { h: true, bands: 3 }, NLD: { h: true, bands: 3 },
  CAN: { special: 'canada' }, JPN: { special: 'japan' }, CHN: { special: 'china' },
  KOR: { special: 'korea' }, PRK: { special: 'nkorea' }, BRA: { special: 'brazil' },
  UKR: { h: true, bands: 2 }, POL: { h: true, bands: 2 }, IDN: { h: true, bands: 2 },
  ARE: { special: 'uae' }, SAU: { special: 'saudi' }, ISR: { special: 'israel' },
  TUR: { special: 'turkey' }, IND: { special: 'india' }, MEX: { special: 'mexico' },
  AUS: { special: 'australia' }, NZL: { special: 'australia' },
};

export function countryFlagTexture(id, colors) {
  const key = 'flag-' + id;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 160, c = C(W, H), x = c.getContext('2d');
  const st = FLAG_STYLES[id] || { h: true, bands: 3 };
  const cols = colors || ['#888', '#ccc', '#888'];
  x.fillStyle = cols[0]; x.fillRect(0, 0, W, H);
  if (st.special === 'usa') {
    for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#b22234'; x.fillRect(0, i * H / 13, W, H / 13 + 1); }
    x.fillStyle = '#3c3b6e'; x.fillRect(0, 0, W * 0.4, H * 0.54);
    x.fillStyle = '#fff';
    for (let r = 0; r < 5; r++) for (let cc = 0; cc < 6; cc++) { x.beginPath(); x.arc(10 + cc * 15 + (r % 2) * 7, 12 + r * 15, 1.6, 0, 7); x.fill(); }
  } else if (st.special === 'uk') {
    x.fillStyle = '#012169'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#fff'; x.lineWidth = 26; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke();
    x.strokeStyle = '#c8102e'; x.lineWidth = 12; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, H); x.moveTo(W, 0); x.lineTo(0, H); x.stroke();
    x.strokeStyle = '#fff'; x.lineWidth = 38; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
    x.strokeStyle = '#c8102e'; x.lineWidth = 22; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
  } else if (st.special === 'canada') {
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#d52b1e'; x.fillRect(0, 0, W * 0.25, H); x.fillRect(W * 0.75, 0, W * 0.25, H);
    x.beginPath(); x.moveTo(W / 2, H * 0.2); x.lineTo(W * 0.58, H * 0.42); x.lineTo(W * 0.68, H * 0.42); x.lineTo(W * 0.6, H * 0.58); x.lineTo(W * 0.64, H * 0.78); x.lineTo(W / 2, H * 0.68); x.lineTo(W * 0.36, H * 0.78); x.lineTo(W * 0.4, H * 0.58); x.lineTo(W * 0.32, H * 0.42); x.lineTo(W * 0.42, H * 0.42); x.closePath(); x.fill();
  } else if (st.special === 'japan') {
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#bc002d'; x.beginPath(); x.arc(W / 2, H / 2, H * 0.3, 0, 7); x.fill();
  } else if (st.special === 'china') {
    x.fillStyle = '#de2910'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffde00'; x.beginPath(); x.arc(W * 0.18, H * 0.28, H * 0.12, 0, 7); x.fill();
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(W * 0.3, H * 0.12 + i * H * 0.14, 4, 0, 7); x.fill(); }
  } else if (st.special === 'korea') {
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#cd2e3a'; x.beginPath(); x.arc(W / 2, H / 2, H * 0.28, Math.PI, 0); x.fill(); x.fillStyle = '#0047a0'; x.beginPath(); x.arc(W / 2, H / 2, H * 0.28, 0, Math.PI); x.fill();
  } else if (st.special === 'nkorea') {
    x.fillStyle = '#024fa2'; x.fillRect(0, 0, W, H); x.fillStyle = '#ed1c27'; x.fillRect(0, H * 0.18, W, H * 0.64); x.fillStyle = '#fff'; x.beginPath(); x.arc(W * 0.28, H / 2, H * 0.15, 0, 7); x.fill();
  } else if (st.special === 'brazil') {
    x.fillStyle = '#009c3b'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffdf00'; x.beginPath(); x.moveTo(W / 2, H * 0.12); x.lineTo(W * 0.85, H / 2); x.lineTo(W / 2, H * 0.88); x.lineTo(W * 0.15, H / 2); x.fill(); x.fillStyle = '#002776'; x.beginPath(); x.arc(W / 2, H / 2, H * 0.22, 0, 7); x.fill();
  } else if (st.special === 'uae') {
    x.fillStyle = '#00732f'; x.fillRect(0, 0, W, H / 3); x.fillStyle = '#fff'; x.fillRect(0, H / 3, W, H / 3); x.fillStyle = '#000'; x.fillRect(0, H * 2 / 3, W, H / 3); x.fillStyle = '#ff0000'; x.fillRect(0, 0, W * 0.25, H);
  } else if (st.special === 'saudi') {
    x.fillStyle = '#006c35'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.fillRect(W * 0.2, H * 0.3, W * 0.6, 8); x.fillRect(W * 0.2, H * 0.45, W * 0.6, 5);
  } else if (st.special === 'israel') {
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.fillStyle = '#0038b8'; x.fillRect(0, 0, W, 12); x.fillRect(0, H - 12, W, 12);
    x.save(); x.translate(W / 2, H / 2); x.strokeStyle = '#0038b8'; x.lineWidth = 5;
    for (const off of [-14, 14]) { x.beginPath(); x.moveTo(-28, off + 16); x.lineTo(0, off - 16); x.lineTo(28, off + 16); x.closePath(); x.stroke(); }
    x.restore();
  } else if (st.special === 'turkey') {
    x.fillStyle = '#e30a17'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.beginPath(); x.arc(W * 0.42, H / 2, H * 0.26, 0, 7); x.fill(); x.fillStyle = '#e30a17'; x.beginPath(); x.arc(W * 0.47, H / 2, H * 0.21, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(W * 0.6, H / 2, 8, 0, 7); x.fill();
  } else if (st.special === 'india') {
    x.fillStyle = '#ff9933'; x.fillRect(0, 0, W, H / 3); x.fillStyle = '#fff'; x.fillRect(0, H / 3, W, H / 3); x.fillStyle = '#138808'; x.fillRect(0, H * 2 / 3, W, H / 3); x.strokeStyle = '#000080'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, H / 2, 18, 0, 7); x.stroke();
  } else if (st.special === 'mexico') {
    x.fillStyle = '#006847'; x.fillRect(0, 0, W / 3, H); x.fillStyle = '#fff'; x.fillRect(W / 3, 0, W / 3, H); x.fillStyle = '#ce1126'; x.fillRect(W * 2 / 3, 0, W / 3, H);
  } else if (st.special === 'australia') {
    x.fillStyle = '#012169'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.fillRect(W * 0.42, 0, W * 0.08, H * 0.4); x.fillRect(0, H * 0.15, W * 0.3, H * 0.1);
  } else if (st.v) {
    for (let i = 0; i < (st.bands || 3); i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(i * W / (st.bands || 3), 0, W / (st.bands || 3) + 1, H); }
  } else {
    const bands = st.bands || 3;
    for (let i = 0; i < bands; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(0, i * H / bands, W, H / bands + 1); }
  }
  const t = tex(c); cache.set(key, t); return t;
}

export function textSprite(lines, opts = {}) {
  const { w = 512, h = 128, color = '#f4efe4', bg = 'rgba(8,16,28,0)', font = '600 44px "Barlow Condensed"', sub = '', subColor = '#c8a24a', border = false } = opts;
  const c = C(w, h), x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  if (bg !== 'transparent') { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  if (border) { x.strokeStyle = 'rgba(200,162,74,0.6)'; x.lineWidth = 2; x.strokeRect(3, 3, w - 6, h - 6); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = font; x.fillStyle = color;
  x.fillText(lines, w / 2, sub ? h * 0.4 : h / 2);
  if (sub) { x.font = '400 24px "Barlow Condensed"'; x.fillStyle = subColor; x.fillText(sub, w / 2, h * 0.72); }
  return tex(c);
}

export function signTexture(text, bg = '#111', fg = '#f4efe4', border = '#c8a24a') {
  const key = `sign-${text}-${bg}-${fg}`;
  if (cache.has(key)) return cache.get(key);
  const W = 256, H = 128, c = C(W, H), x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = border; x.lineWidth = 4; x.strokeRect(4, 4, W - 8, H - 8);
  x.fillStyle = fg; x.font = '600 28px "Barlow Condensed"'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) { if ((line + ' ' + w).trim().length > 12) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => x.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * 30));
  const t = tex(c); cache.set(key, t); return t;
}

export function hollywoodTexture() {
  if (cache.has('hollywood')) return cache.get('hollywood');
  const W = 1024, H = 256, c = C(W, H), x = c.getContext('2d');
  x.clearRect(0, 0, W, H);
  x.fillStyle = '#f2efe2'; x.font = '700 150px "Barlow Condensed"'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.save(); x.translate(W / 2, H / 2); x.rotate(-0.02); x.fillText('HOLLYWOOD', 0, 0); x.restore();
  const t = tex(c); cache.set('hollywood', t); return t;
}

export function posterTexture(kind = 'portrait') {
  const key = 'poster-' + kind;
  if (cache.has(key)) return cache.get(key);
  const c = C(256, 320), x = c.getContext('2d');
  x.fillStyle = '#1a2332'; x.fillRect(0, 0, 256, 320);
  x.fillStyle = '#c8a24a'; x.fillRect(16, 16, 224, 288); x.fillStyle = '#0d1726'; x.fillRect(24, 24, 208, 272);
  const g = x.createRadialGradient(128, 110, 5, 128, 110, 90);
  g.addColorStop(0, '#d9c8a6'); g.addColorStop(1, '#6d5b44');
  x.fillStyle = g; x.beginPath(); x.ellipse(128, 130, 56, 70, 0, 0, 7); x.fill();
  x.fillStyle = '#3c2f22'; x.beginPath(); x.ellipse(128, 105, 56, 48, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#0d1726'; x.fillRect(60, 210, 136, 90);
  x.fillStyle = '#c8a24a'; x.font = '600 20px "Cormorant Garamond"'; x.textAlign = 'center'; x.fillText(kind === 'washington' ? 'WASHINGTON' : kind === 'lincoln' ? 'LINCOLN' : 'THE PRESIDENT', 128, 290);
  const t = tex(c); cache.set(key, t); return t;
}

export function carpetTexture() {
  if (cache.has('carpet')) return cache.get('carpet');
  const S = 512, c = C(S), x = c.getContext('2d');
  x.fillStyle = '#142b4a'; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(200,162,74,0.5)'; x.lineWidth = 3;
  for (let i = 0; i < 9; i++) x.strokeRect(20 + i * 6, 20 + i * 6, S - 40 - i * 12, S - 40 - i * 12);
  x.save(); x.translate(S / 2, S / 2);
  x.strokeStyle = '#c8a24a'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 150, 0, 7); x.stroke();
  x.beginPath(); x.arc(0, 0, 140, 0, 7); x.stroke();
  for (let i = 0; i < 40; i++) { x.rotate(Math.PI * 2 / 40); x.fillStyle = 'rgba(200,162,74,0.7)'; x.beginPath(); x.arc(0, -120, 3, 0, 7); x.fill(); }
  x.restore();
  const t = tex(c); cache.set('carpet', t); return t;
}
