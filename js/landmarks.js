// ---------------------------------------------------------------------------
// Landmarks — American cities & world capitals
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { box, cyl, sphere, cone, mat, addFlag } from './models.js';
import { countryFlagTexture, textSprite, hollywoodTexture, signTexture } from './textures.js';

const gold = '#c8a24a';
const glassMat = () => mat('#3f5b70', { roughness: 0.18, metalness: 0.72, emissive: 0x0e2038, emissiveIntensity: 0.35 });
const litMat = (color = '#ffd98a') => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.6 });

function flag(g, id, x, y, z, w = 4, h = 2.6, pole = 12) {
  const meta = { USA: ['#b22234', '#fff', '#3c3b6e'] };
  const cols = meta[id] || ['#888', '#ccc', '#888'];
  return addFlag(g, countryFlagTexture(id, cols), x, y + 2, z, w, h, pole);
}

function beam(g, x, z, h, color = gold, r = 0.12) {
  const b = box(r, h, r, color, x, h / 2, z, { metalness: 0.6, emissive: color, emissiveIntensity: 0.4 });
  g.add(b); return b;
}

// ---------------------------------------------------------------- White House
export function buildWhiteHouse(parent, x, y, z, collide) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const white = '#e8e3d7';
  g.add(box(34, 11, 15, white, 0, 5.5, 0));
  g.add(box(16, 2, 15.6, '#f2eee4', 0, 11.5, 0));
  g.add(box(14, 8.5, 12, white, -25, 4.25, -2));
  g.add(box(14, 8.5, 12, white, 25, 4.25, -2));
  g.add(box(12, 5.5, 9, white, -18, 2.75, -1));
  g.add(box(12, 5.5, 9, white, 18, 2.75, -1));
  // portico
  for (const px of [-6.4, -3.8, -1.3, 1.3, 3.8, 6.4]) g.add(cyl(0.38, 0.42, 8.5, 12, '#f5f1e8', px, 4.25, 9.2));
  g.add(box(15, 0.8, 4, '#f5f1e8', 0, 8.75, 9.2));
  g.add(box(17, 1.2, 4.6, '#f2eee4', 0, 9.6, 9.2));
  const ped = cyl(2.8, 2.8, 17, 3, '#f2eee4', 0, 10.9, 9.4); ped.rotation.z = Math.PI / 2; ped.rotation.x = 0; ped.rotation.y = Math.PI / 2; g.add(ped);
  g.add(box(10, 1, 3, white, 0, 0.5, 11.5));
  // windows
  const wm = new THREE.MeshStandardMaterial({ color: '#20384c', emissive: '#ffdf9a', emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.4 });
  for (const side of [7.55, -7.55]) for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.08), wm); w.position.set(-10 + i * 5, 3 + j * 4, side); g.add(w);
  }
  // roof balustrade
  g.add(box(34.4, 0.35, 15.4, '#dcd6c8', 0, 11.95, 0));
  for (let i = 0; i < 18; i++) g.add(box(0.22, 1.0, 0.22, '#dcd6c8', -16.5 + i * 1.94, 12.55, 7.55));
  // flag
  addFlag(g, countryFlagTexture('USA'), 5, 13.4, 0, 4.4, 2.8, 8);
  // fence
  const fenceMat = mat('#20242a', { metalness: 0.6, roughness: 0.4 });
  const fw = 70, fd = 54;
  for (const [dx, dz, len, rot] of [[0, fd / 2, fw, 0], [0, -fd / 2, fw, 0], [fw / 2, 0, fd, Math.PI / 2], [-fw / 2, 0, fd, Math.PI / 2]]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.1), fenceMat); rail.position.set(dx, 1.2, dz); rail.rotation.y = rot; g.add(rail);
    const rail2 = rail.clone(); rail2.position.y = 0.55; g.add(rail2);
    const n = Math.floor(len / 3);
    for (let i = 0; i < n; i++) {
      if (dz > 0 && Math.abs(dx) < 4.5 && Math.abs(i * 3 - len / 2) < 5) continue;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 0.12), fenceMat);
      const t = -len / 2 + i * 3 + 1.5;
      post.position.set(dx + Math.cos(rot) * t, 0.85, dz + Math.sin(rot) * t); g.add(post);
    }
    // The south fence has a working gate aligned with the portico.
    if (dz > 0) {
      const seg = fw / 2 - 4.5;
      colliderLine(collide, x - 4.5 - seg / 2, z + dz, seg, 0, 0.7);
      colliderLine(collide, x + 4.5 + seg / 2, z + dz, seg, 0, 0.7);
    } else {
      colliderLine(collide, x + dx, z + dz, len, rot, 0.7);
    }
  }
  // gate posts
  for (const gx of [-4.8, 4.8]) { g.add(cyl(0.35, 0.4, 3.2, 8, '#d9d4c5', gx, 1.6, 26.8)); g.add(sphere(0.35, gold, gx, 3.3, 26.8, { metalness: 0.8 })); }
  // building colliders
  collide(x, z, 19); collide(x - 25, z - 2, 9.5); collide(x + 25, z - 2, 9.5);
  g.userData.door = new THREE.Vector3(x + 0.1, y + 2, z + 15.5);
  g.userData.doorInside = new THREE.Vector3(x, y + 2, z + 11);
  return g;
}

function colliderLine(cb, x, z, len, rot, r) {
  const n = Math.max(1, Math.round(len / 8));
  for (let i = 0; i <= n; i++) {
    const t = -len / 2 + (len * i) / n;
    cb(x + Math.cos(rot) * t, z + Math.sin(rot) * t, r);
  }
}

// ---------------------------------------------------------------- US landmarks
export function buildUSLandmark(id, x, y, z, collide, parent) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  switch (id) {
    case 'whitehouse': return buildWhiteHouse(parent, x, y, z, collide);
    case 'empire': {
      g.add(box(18, 12, 18, '#b8ae9c', 0, 6, 0));
      g.add(box(14, 28, 14, '#c4bcaa', 0, 26, 0));
      g.add(box(10, 24, 10, '#cfc7b5', 0, 52, 0));
      g.add(box(7, 14, 7, '#d6cfbf', 0, 71, 0));
      g.add(box(4.5, 8, 4.5, '#c8a24a', 0, 82, 0, { metalness: 0.5 }));
      g.add(cyl(0.3, 0.7, 22, 8, '#b9b2a3', 0, 96, 0));
      for (let i = 0; i < 7; i++) g.add(box(18.2, 0.28, 0.2, litMat('#ffe0a0'), 0, 8 + i * 2.4, 9.1));
      collide(x, z, 12); break;
    }
    case 'willis': {
      g.add(box(30, 30, 30, '#8c8f8e', 0, 15, 0));
      g.add(box(24, 58, 24, '#9a9c99', 0, 59, 0));
      g.add(box(9, 20, 9, '#a8aaa6', -8, 97, 0));
      g.add(box(9, 20, 9, '#a8aaa6', 8, 97, 0));
      g.add(cyl(0.3, 0.5, 26, 6, '#c8c4b8', -8, 115, 0));
      g.add(cyl(0.3, 0.5, 26, 6, '#c8c4b8', 8, 115, 0));
      for (let i = 0; i < 12; i++) g.add(box(24.2, 1.1, 0.2, glassMat(), 0, 35 + i * 4, 12.1));
      collide(x, z, 17); break;
    }
    case 'needle': {
      g.add(cyl(1.8, 3.4, 55, 14, '#c8ccce', 0, 27.5, 0, { metalness: 0.45, roughness: 0.3 }));
      g.add(cyl(9, 11, 2.4, 22, '#d7dadb', 0, 56, 0, { metalness: 0.5 }));
      g.add(cyl(7.5, 9, 4.2, 22, glassMat(), 0, 60, 0));
      g.add(cyl(1.2, 7.5, 3, 22, '#d7dadb', 0, 63.5, 0, { metalness: 0.5 }));
      g.add(cyl(0.3, 1, 28, 8, '#c8ccce', 0, 79, 0));
      collide(x, z, 6); break;
    }
    case 'goldengate': {
      const deckY = 11;
      g.add(box(128, 0.8, 6.5, '#a8382c', 0, deckY, 0));
      for (const tx of [-42, 42]) {
        g.add(box(3.4, 48, 4.2, '#b54634', tx, 24, 0));
        g.add(box(5, 2.4, 6, '#b54634', tx, 46, 0));
        g.add(box(5, 2.4, 6, '#b54634', tx, 32, 0));
      }
      for (const side of [-2.6, 2.6]) {
        const pts = [];
        for (let i = 0; i <= 20; i++) {
          const xx = -60 + i * 6;
          const yy = deckY + 15 * Math.pow(Math.abs(xx) / 60, 1.5) + 2;
          pts.push(new THREE.Vector3(xx, yy, side));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.17, 4, false), mat('#b54634', { metalness: 0.4 }));
        g.add(tube);
      }
      for (let i = 0; i < 24; i++) {
        const xx = -60 + i * 5;
        const yy = deckY + 15 * Math.pow(Math.abs(xx) / 60, 1.5) + 2;
        if (Math.abs(xx) < 41) { g.add(box(0.12, yy - deckY, 0.12, '#b54634', xx, (yy + deckY) / 2, 2.6)); g.add(box(0.12, yy - deckY, 0.12, '#b54634', xx, (yy + deckY) / 2, -2.6)); }
      }
      collide(x - 42, z, 4); collide(x + 42, z, 4); break;
    }
    case 'hollywood': {
      const hill = cone(34, 20, 7, '#6b5a3d', 0, 10, -10, { flat: true });
      g.add(hill);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(52, 13), new THREE.MeshBasicMaterial({ map: hollywoodTexture(), transparent: true, side: THREE.DoubleSide }));
      sign.position.set(0, 22, -7); g.add(sign);
      collide(x, z - 10, 26); break;
    }
    case 'vegas': {
      g.add(cone(22, 40, 4, '#2b2b32', 0, 20, 0, { metalness: 0.6, roughness: 0.4 })); // pyramid
      g.add(box(1.6, 44, 1.6, litMat('#ff50c8'), 0, 22, 0));
      for (let i = 0; i < 5; i++) {
        const col = ['#ff4fa3', '#4fd8ff', '#ffd25a', '#9d6bff', '#63ffb0'][i];
        g.add(box(6, 16 + i * 5, 6, '#22252b', -50 + i * 12, (16 + i * 5) / 2, -22));
        g.add(box(6.2, 0.5, 6.2, litMat(col), -50 + i * 12, 2, -22));
        g.add(box(0.4, 12, 0.4, litMat(col), -50 + i * 12, 10, -18.8));
      }
      g.add(box(24, 1, 1, litMat('#ffd25a'), 0, 12, 30));
      collide(x, z, 16); collide(x - 50 + 24, z - 22, 12); break;
    }
    case 'miami': {
      for (let i = 0; i < 7; i++) {
        const cols = ['#e9b7a7', '#a8d8d0', '#f2d59a', '#c8b6e0', '#f4efe4'];
        const bx = -40 + i * 13;
        g.add(box(10, 10 + (i % 3) * 6, 9, cols[i % cols.length], bx, 6 + (i % 3) * 3, -18));
        g.add(box(10.2, 0.4, 9.2, '#f7f2e6', bx, 11 + (i % 3) * 6, -18));
      }
      for (let i = 0; i < 10; i++) palm(g, -45 + i * 10, 0, 8 + (i % 3) * 6);
      g.add(box(70, 0.3, 24, '#d9c394', 0, 0.18, 20)); // beach
      collide(x - 10, z - 18, 18); break;
    }
    case 'rocket': {
      g.add(cyl(2.2, 2.2, 42, 16, '#d8d4c8', -30, 21, 0));
      g.add(cone(2.2, 8, 16, '#b23a2e', -30, 46, 0));
      g.add(box(0.6, 8, 8, '#b23a2e', -30, 12, 0));
      g.add(box(0.6, 8, 8, '#b23a2e', -30, 12, 0));
      for (let i = 0; i < 4; i++) g.add(box(1, 6, 3.5, '#333', -30, 3, 0).rotateY(i * Math.PI / 2));
      g.add(box(26, 10, 18, '#aeb4b2', 22, 5, 0));
      g.add(box(26, 0.5, 1, litMat('#8fe0ff'), 22, 8, 9.2));
      collide(x - 30, z, 5); collide(x + 22, z, 14); break;
    }
    case 'reunion': {
      g.add(cyl(2.4, 3, 58, 14, '#c9c5b8', 0, 29, 0));
      g.add(sphere(7.2, '#c8a24a', 0, 63, 0, { metalness: 0.6, roughness: 0.3 }));
      g.add(cyl(0.25, 0.6, 22, 6, '#d8d2c2', 0, 76, 0));
      for (let i = 0; i < 8; i++) g.add(box(10, 0.4, 0.4, litMat('#ffe0a0'), Math.cos(i / 8 * 6.28) * 10, 34 + i * 2, Math.sin(i / 8 * 6.28) * 10));
      collide(x, z, 7); break;
    }
    case 'atlanta': {
      g.add(cyl(8, 12, 46, 6, '#6e8fa0', 8, 23, 0, { metalness: 0.55, roughness: 0.25 }));
      g.add(cyl(0.4, 0.4, 16, 6, '#c8c4b8', 8, 54, 0));
      const wheel = new THREE.Group(); wheel.position.set(-32, 20, 0); wheel.rotation.x = 0;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(14, 0.7, 6, 32), mat('#d8d4c8', { metalness: 0.5 })); wheel.add(rim);
      for (let i = 0; i < 12; i++) { const s = box(0.3, 28, 0.3, '#c8c4b8', 0, 0, 0); s.rotation.z = i * Math.PI / 12; wheel.add(s); }
      for (let i = 0; i < 12; i++) { const c = box(3, 2.4, 1.2, i % 2 ? '#d9d4c5' : '#2c3a4a', Math.cos(i / 12 * 6.28) * 14, Math.sin(i / 12 * 6.28) * 14, 0); wheel.add(c); }
      g.add(wheel);
      collide(x + 8, z, 12); collide(x - 32, z, 14); break;
    }
    case 'boston': {
      for (let i = 0; i < 6; i++) { const bx = -35 + i * 14; g.add(box(11, 9 + (i % 2) * 4, 9, i % 2 ? '#a56a4f' : '#b8ab96', bx, 5, -12)); g.add(cone(6.2, 4, 4, '#5a4a42', bx, 11 + (i % 2) * 2, -12)); }
      g.add(box(13, 34, 13, '#b9ae9a', 25, 17, -12));
      g.add(cyl(0.2, 0.2, 8, 6, '#c8a24a', 25, 38, -12));
      g.add(sphere(1.3, '#c8a24a', 25, 42, -12));
      collide(x + 25, z - 12, 8); break;
    }
    case 'nola': {
      g.add(box(24, 10, 14, '#e2d7c3', 0, 5, 0));
      for (const sx of [-7, 0, 7]) { g.add(box(2.4, 18, 2.4, '#e8dfcb', sx, 17, 3)); g.add(cone(2.2, 7, 6, '#5f6c6c', sx, 29.5, 3)); }
      g.add(cyl(0.1, 0.1, 5, 5, '#c8a24a', 0, 35, 3));
      for (let i = 0; i < 5; i++) g.add(box(3, 6, 4, '#b8a98c', -26 + i * 13, 3, -14));
      collide(x, z, 14); break;
    }
    case 'desert': {
      g.add(box(34, 6, 24, '#a7a29a', 0, 3, 0));
      const dome = sphere(13, '#c9c5b8', 0, 6, 0, { seg: 18, seg2: 8 }); dome.scale.y = 0.42; g.add(dome);
      for (let i = 0; i < 6; i++) cactus(g, -40 + i * 15, 0, -18 + (i % 2) * 8);
      collide(x, z, 18); break;
    }
    case 'denver': {
      g.add(box(30, 12, 22, '#b8ae9c', 0, 6, 0));
      const dome = sphere(9, gold, 0, 12, 0, { metalness: 0.7, roughness: 0.3, seg: 18, seg2: 8 }); dome.scale.y = 0.7; g.add(dome);
      g.add(cyl(0.4, 0.4, 8, 6, '#c8a24a', 0, 18, 0));
      for (let i = 0; i < 7; i++) g.add(box(5, 12 + (i % 3) * 5, 5, '#5d7484', 28 + (i % 3) * 7, 6, -24 + i * 8, { metalness: 0.4 }));
      collide(x, z, 18); collide(x + 34, z - 6, 16); break;
    }
    case 'hawaii': {
      const crater = cone(44, 24, 8, '#6c5a42', 0, 12, -18, { flat: true }); g.add(crater);
      for (let i = 0; i < 8; i++) { g.add(box(10, 9 + (i % 3) * 5, 9, '#ddd6c8', -40 + i * 11, 5, 10)); }
      for (let i = 0; i < 12; i++) palm(g, -46 + i * 8, 0, 30 + (i % 3) * 4);
      g.add(box(60, 0.3, 20, '#d9c394', 0, 0.15, 36));
      collide(x, z - 18, 30); break;
    }
    default: {
      g.add(box(16, 30, 16, '#7f8c95', 0, 15, 0));
      collide(x, z, 10);
    }
  }
  return g;
}

function palm(g, x, y, z) {
  const trunk = cyl(0.22, 0.38, 7, 6, '#6b5236', x, y + 3.5, z); trunk.rotation.z = 0.08; g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const leaf = cone(0.5, 3.6, 4, '#2e6b3f', 0, 0, 0, { flat: true });
    leaf.position.set(x, y + 7, z); leaf.rotation.z = Math.PI / 2.4; leaf.rotation.y = i * Math.PI / 3;
    leaf.position.x += Math.cos(i * Math.PI / 3) * 1.1; leaf.position.z += Math.sin(i * Math.PI / 3) * 1.1;
    g.add(leaf);
  }
}
function cactus(g, x, y, z) {
  g.add(cyl(0.6, 0.8, 7, 7, '#3f6b46', x, y + 3.5, z));
  const arm = cyl(0.4, 0.5, 3, 6, '#3f6b46', x + 1.5, y + 4.5, z); arm.rotation.z = Math.PI / 2; g.add(arm);
  const arm2 = cyl(0.4, 0.5, 3, 6, '#3f6b46', x - 1.5, y + 3.4, z); arm2.rotation.z = Math.PI / 2; g.add(arm2);
}

// ---------------------------------------------------------------- world capitals
export function buildCapitalLandmark(style, palette, x, y, z, collide, parent) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const [stone, accent, accent2] = palette;
  switch (style) {
    case 'london': {
      g.add(box(46, 12, 16, stone, -4, 6, -8));
      for (let i = 0; i < 12; i++) g.add(cone(1.4, 5, 4, stone, -24 + i * 3.6, 14.5, -8));
      g.add(box(9, 42, 9, stone, 28, 21, -8));
      for (const side of [-4.55, 4.55]) for (const zz of [-12.55, -3.45]) {
        const clock = new THREE.Mesh(new THREE.CircleGeometry(2.3, 20), new THREE.MeshBasicMaterial({ map: clockTexture() }));
        clock.position.set(28 + (zz > -8 ? 4.55 : -4.55), 32, -8 + (side > 0 ? 4.55 : -4.55)); clock.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(clock);
      }
      g.add(cone(6.4, 14, 4, '#4c5a63', 28, 49, -8));
      g.add(cyl(0.2, 0.2, 7, 5, gold, 28, 59, -8));
      // red bus
      g.add(box(9, 4.2, 3.6, '#b51f2b', -26, 3, 22));
      g.add(box(8.4, 1.2, 3.4, '#1b2733', -26, 4.2, 22));
      for (const wx of [-29, -23]) for (const wz of [20.5, 23.5]) { const w = cyl(0.8, 0.8, 0.4, 10, '#111', wx, 0.8, wz); w.rotation.z = Math.PI / 2; g.add(w); }
      collide(x - 4, z - 8, 24); collide(x + 28, z - 8, 6); break;
    }
    case 'paris': {
      const legs = [];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + i * Math.PI / 2;
        const leg = box(2.2, 46, 2.2, '#7a5f4a', Math.cos(a) * 9, 23, Math.sin(a) * 9);
        leg.rotation.z = Math.cos(a) * -0.2; leg.rotation.x = Math.sin(a) * 0.2; g.add(leg); legs.push(leg);
      }
      g.add(box(18, 1.2, 18, '#8a6b50', 0, 17, 0));
      g.add(box(10, 1.2, 10, '#8a6b50', 0, 36, 0));
      g.add(cyl(2.4, 4.5, 34, 4, '#8a6b50', 0, 55, 0));
      g.add(box(5, 1.2, 5, '#8a6b50', 0, 73, 0));
      g.add(cyl(0.3, 0.8, 20, 6, '#5f4a3a', 0, 83, 0));
      for (let i = 0; i < 6; i++) g.add(box(16 - i * 2, 0.3, 16 - i * 2, '#6e5440', 0, 22 + i * 8, 0));
      collide(x, z, 12); break;
    }
    case 'moscow': {
      g.add(box(34, 10, 16, '#8f4034', 0, 5, -10));
      for (let i = 0; i < 7; i++) g.add(box(3, 2, 2, '#8f4034', -15 + i * 5, 11, -18));
      const domes = [[-14, 14, '#d8a63e'], [-7, 18, '#4f8f7f'], [0, 22, '#c9a24a'], [7, 18, '#8f5d9a'], [14, 14, '#c96a4a']];
      for (const [dx, h, col] of domes) {
        g.add(cyl(2.4, 3.2, h, 12, '#d8cfbf', dx, h / 2 + 8, -10));
        const d = sphere(3.2, col, dx, h + 9, -10, { roughness: 0.4, metalness: 0.25, seg: 14, seg2: 10 }); d.scale.y = 1.25; g.add(d);
        g.add(cyl(0.1, 0.1, 3, 5, gold, dx, h + 13, -10));
        g.add(box(1.0, 0.15, 0.15, gold, dx, h + 14, -10));
      }
      collide(x, z - 10, 20); break;
    }
    case 'beijing': {
      g.add(box(52, 9, 20, '#9e2f27', 0, 4.5, 0));
      for (const ax of [-14, 0, 14]) { g.add(box(6, 6, 0.4, '#2a1614', ax, 3, 10.1)); g.add(box(0.4, 6, 7, '#2a1614', ax, 3, 6)); }
      g.add(box(58, 1.4, 26, '#c8a24a', 0, 9.7, 0));
      g.add(box(54, 2.4, 23, '#b5442e', 0, 11.2, 0));
      g.add(box(58, 1.2, 26, '#d8b55a', 0, 12.9, 0));
      for (const sx of [-24, 24]) { g.add(box(10, 8, 10, '#9e2f27', sx, 4, -12)); g.add(cone(8, 4, 4, '#c8a24a', sx, 10, -12)); }
      for (let i = 0; i < 8; i++) g.add(box(0.5, 4, 0.5, '#7a1f1a', -20 + i * 5.7, 15, 8));
      collide(x, z, 30); break;
    }
    case 'tokyo': {
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + i * Math.PI / 2;
        const leg = box(2, 50, 2, '#d24a35', Math.cos(a) * 8, 25, Math.sin(a) * 8);
        leg.rotation.z = Math.cos(a) * -0.18; leg.rotation.x = Math.sin(a) * 0.18; g.add(leg);
      }
      g.add(box(16, 1.4, 16, '#e8e4d8', 0, 22, 0));
      g.add(box(11, 1.2, 11, '#e8e4d8', 0, 40, 0));
      g.add(cyl(2.2, 3.6, 36, 4, '#d24a35', 0, 58, 0));
      g.add(cyl(0.25, 0.6, 30, 6, '#e8e4d8', 0, 91, 0));
      for (let i = 0; i < 5; i++) g.add(box(12 - i, 0.3, 12 - i, '#e8e4d8', 0, 30 + i * 8, 0));
      for (let i = 0; i < 6; i++) { g.add(box(5, 18 + i * 4, 5, '#2c3440', 34 + (i % 2) * 8, 9 + i * 2, -30 + i * 9)); g.add(box(0.4, 10, 0.4, litMat(['#ff4f7a', '#4fd8ff', '#ffd25a'][i % 3]), 34 + (i % 2) * 8, 20, -22 + i * 9)); }
      collide(x, z, 12); break;
    }
    case 'riyadh': {
      g.add(box(14, 70, 12, '#8fa3ad', -10, 35, 0, { metalness: 0.55, roughness: 0.25 }));
      g.add(box(14, 70, 12, '#8fa3ad', 10, 35, 0, { metalness: 0.55, roughness: 0.25 }));
      g.add(box(36, 8, 14, '#b9b2a4', 0, 72, 0));
      g.add(box(46, 2, 18, '#a8a294', 0, 76, 0));
      for (let i = 0; i < 10; i++) g.add(box(12, 0.8, 0.2, litMat('#ffe4a8'), -10, 10 + i * 6, 6.1));
      collide(x, z, 22); break;
    }
    case 'kyiv': {
      g.add(box(24, 12, 18, '#e8e2d4', 0, 6, -8));
      g.add(cyl(6, 8, 12, 16, '#e8e2d4', 0, 18, -8));
      const dome = sphere(5.4, '#d9b44a', 0, 26, -8, { metalness: 0.7, roughness: 0.25, seg: 16, seg2: 10 }); dome.scale.y = 1.25; g.add(dome);
      g.add(cyl(0.12, 0.12, 4, 5, gold, 0, 31, -8)); g.add(box(1.4, 0.15, 0.15, gold, 0, 32, -8));
      for (const sx of [-16, 16]) { g.add(box(6, 9, 6, '#ded7c7', sx, 4.5, -8)); g.add(cone(4, 7, 6, '#c8a24a', sx, 12, -8)); }
      g.add(cyl(1.4, 2.2, 38, 10, '#e8e2d4', -30, 19, 18));
      g.add(sphere(1.4, '#d9b44a', -30, 39, 18, { metalness: 0.7 }));
      collide(x, z - 8, 18); collide(x - 30, z + 18, 4); break;
    }
    case 'ottawa': {
      g.add(box(44, 14, 18, '#b9b2a2', 0, 7, -6));
      for (let i = 0; i < 9; i++) g.add(cone(1.2, 6, 4, '#8d8576', -20 + i * 5, 17, -6));
      g.add(box(10, 48, 10, '#b9b2a2', 0, 24, -6));
      g.add(cone(7, 16, 4, '#5d6b6b', 0, 56, -6));
      g.add(cyl(0.15, 0.15, 8, 5, gold, 0, 67, -6));
      addFlag(g, countryFlagTexture('CAN'), 8, 20, -6, 5, 3, 15);
      collide(x, z - 6, 24); break;
    }
    case 'mexico': {
      g.add(cyl(2.4, 3.4, 34, 12, '#c9c1ae', 0, 17, 0));
      g.add(box(6, 2, 6, '#b9b09c', 0, 35, 0));
      g.add(sphere(2.6, '#d9b44a', 0, 39, 0, { metalness: 0.7, roughness: 0.25 })); g.add(box(1, 5, 0.4, gold, 0, 44, 0));
      g.add(box(0.5, 5, 4, gold, 0, 39, 0));
      for (const sx of [-12, 12]) { g.add(box(8, 10, 8, '#b47a52', sx, 5, 14)); g.add(box(8.4, 1, 8.4, '#d8c9a8', sx, 10, 14)); }
      for (let i = 0; i < 5; i++) g.add(box(5, 6, 5, ['#c96b4a', '#c9a24a', '#4f8f7f'][i % 3], -24 + i * 12, 3, -20));
      collide(x, z, 10); break;
    }
    case 'delhi': {
      g.add(box(6, 30, 5, '#c9bda4', -11, 15, 0));
      g.add(box(6, 30, 5, '#c9bda4', 11, 15, 0));
      g.add(box(34, 5, 7, '#c9bda4', 0, 32, 0));
      g.add(box(30, 2, 8, '#b8ac94', 0, 35, 0));
      for (let i = 0; i < 8; i++) g.add(box(0.6, 0.6, 0.6, gold, -16 + i * 4.6, 37, 0));
      g.add(box(70, 0.25, 30, '#4c6b45', 0, 0.1, 20));
      collide(x, z, 18); break;
    }
    case 'berlin': {
      for (let i = 0; i < 6; i++) g.add(box(3.2, 20, 3.2, '#b8b2a6', -15 + i * 6, 10, 0));
      g.add(box(38, 5, 6, '#b8b2a6', 0, 22, 0));
      g.add(box(34, 1.2, 7, '#7e8b8f', 0, 25, 0));
      g.add(box(8, 4, 5, '#a39b8c', 0, 27.5, 0));
      for (const sx of [-34, 34]) { g.add(box(4, 12, 4, '#8d8578', sx, 6, 0)); }
      collide(x, z, 20); break;
    }
    case 'rome': {
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 26, 40, 1, true), mat('#b89a76', { roughness: 0.9, side: THREE.DoubleSide }));
      outer.position.y = 13; g.add(outer);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(17, 18, 26, 32, 1, true), mat('#8d6b4c', { roughness: 0.95, side: THREE.DoubleSide }));
      inner.position.y = 13; g.add(inner);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(24.2, 25.2, 2, 40, 1, true), mat('#c2a37f', { roughness: 0.9, side: THREE.DoubleSide }));
        ring.position.y = 4 + i * 8; g.add(ring);
      }
      for (let i = 0; i < 30; i++) {
        const a = i * Math.PI * 2 / 30;
        const arch = box(2.4, 6, 1, '#3a2c22', Math.cos(a) * 24.1, 14, Math.sin(a) * 24.1); arch.rotation.y = -a + Math.PI / 2; g.add(arch);
      }
      collide(x, z, 26); break;
    }
    case 'seoul': {
      g.add(cyl(1.4, 2.6, 60, 12, '#c9c5b8', 0, 30, 0));
      g.add(cyl(8, 10, 2.4, 24, '#d8d4c8', 0, 60, 0));
      g.add(cyl(5, 7, 5, 24, glassMat(), 0, 64, 0));
      g.add(cyl(0.2, 0.8, 24, 6, '#c8c4b8', 0, 77, 0));
      collide(x, z, 10); break;
    }
    case 'brasilia': {
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI * 2 / 16;
        const rib = box(0.7, 18, 2.2, '#d9d6cf', Math.cos(a) * 12, 9, Math.sin(a) * 12);
        rib.rotation.z = Math.cos(a) * 0.55; rib.rotation.x = -Math.sin(a) * 0.55; g.add(rib);
      }
      const crown = sphere(9, '#d9d6cf', 0, 20, 0, { seg: 18, seg2: 8 }); crown.scale.y = 0.55; g.add(crown);
      collide(x, z, 14); break;
    }
    case 'canberra': {
      g.add(cyl(18, 22, 8, 24, '#c9b79c', 0, 4, 0));
      g.add(cyl(15, 15, 2, 24, '#8f9a9c', 0, 8, 0));
      g.add(cyl(4, 4, 8, 8, '#a8b0b2', 0, 14, 0));
      g.add(box(44, 0.4, 44, '#5d6b5f', 0, 0.2, 0));
      collide(x, z, 22); break;
    }
    default: {
      g.add(box(22, 24, 16, stone, 0, 12, 0));
      g.add(box(18, 10, 12, accent, 0, 30, 0));
      collide(x, z, 14);
    }
  }
  return g;
}

function clockTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#f2eee2'; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.fill();
  x.strokeStyle = '#222'; x.lineWidth = 5; x.stroke();
  x.fillStyle = '#222'; x.font = '600 20px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('XII', 64, 24); x.fillText('III', 104, 64); x.fillText('VI', 64, 104); x.fillText('IX', 24, 64);
  x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 30); x.moveTo(64, 64); x.lineTo(92, 64); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
