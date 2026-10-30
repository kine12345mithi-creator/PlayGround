// ---------------------------------------------------------------------------
// Procedural 3D models
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { countryFlagTexture, textSprite, signTexture } from './textures.js';

export const MAT = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (MAT.has(key)) return MAT.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.72, metalness: opts.metalness ?? 0.08, emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0, transparent: opts.transparent || false, opacity: opts.opacity ?? 1, side: opts.side ?? THREE.FrontSide, flatShading: !!opts.flat, depthWrite: opts.depthWrite ?? true });
  MAT.set(key, m);
  return m;
}

export function box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow !== false; m.receiveShadow = opts.receiveShadow !== false;
  return m;
}
export function cyl(rt, rb, h, seg, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, opts.open || false), opts.material || mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow !== false; m.receiveShadow = opts.receiveShadow !== false;
  return m;
}
export function sphere(r, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, opts.seg || 14, opts.seg2 || 10), opts.material || mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow !== false; m.receiveShadow = opts.receiveShadow !== false;
  return m;
}
export function cone(r, h, seg, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), opts.material || mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow !== false; m.receiveShadow = opts.receiveShadow !== false;
  return m;
}
export function addFlag(parent, texture, x, y, z, w = 3, h = 2, poleH = 0) {
  if (poleH) {
    const pole = cyl(0.09, 0.09, poleH, 8, '#c8c3b6', x, y + poleH / 2, z, { metalness: 0.5, roughness: 0.3 });
    parent.add(pole);
    parent.add(sphere(0.16, '#c8a24a', x, y + poleH + 0.1, z, { metalness: 0.8, roughness: 0.25 }));
    y += poleH - h * 0.5;
  }
  const geo = new THREE.PlaneGeometry(w, h, 8, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * 0.12);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }));
  m.position.set(x + w / 2, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- car
export function createCar(color = '#1a1f2b', opts = {}) {
  const g = new THREE.Group();
  const trim = opts.presidential ? '#0b1320' : '#151a20';
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.95, 1.95), mat(color, { roughness: 0.32, metalness: 0.55 }));
  body.position.y = 0.9; body.castShadow = true; body.receiveShadow = true; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.5, 2.02), mat(color, { roughness: 0.32, metalness: 0.55 }));
  hood.position.y = 1.32; hood.castShadow = true; g.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.82, 1.66), mat(trim, { roughness: 0.2, metalness: 0.6 }));
  cabin.position.set(-0.2, 1.75, 0); cabin.castShadow = true; g.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 1.7), mat('#22384a', { roughness: 0.1, metalness: 0.9, emissive: 0x0a1a2a, emissiveIntensity: 0.3 }));
  glass.position.set(-0.2, 1.82, 0); g.add(glass);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 1.6), mat(color, { roughness: 0.35, metalness: 0.5 }));
  roof.position.set(-0.25, 2.18, 0); g.add(roof);
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.34, 14);
  for (const [x, z] of [[-1.45, 1.05], [-1.45, -1.05], [1.42, 1.05], [1.42, -1.05]]) {
    const w = new THREE.Mesh(wheelGeo, mat('#111316', { roughness: 0.9 }));
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.46, z); w.castShadow = true; g.add(w); wheels.push(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 10), mat('#8a8d90', { metalness: 0.8, roughness: 0.3 }));
    hub.rotation.z = Math.PI / 2; hub.position.set(x, 0.46, z); g.add(hub);
  }
  const hl = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#ffe7a8', emissiveIntensity: 2.4 });
  for (const x of [-0.65, 0.65]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.08), hl); l.position.set(x, 0.95, 1.0); g.add(l);
  }
  const tl = new THREE.MeshStandardMaterial({ color: '#7a1010', emissive: '#ff2020', emissiveIntensity: 1.8 });
  for (const x of [-0.7, 0.7]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.08), tl); l.position.set(x, 0.98, -1.0); g.add(l); }
  if (opts.presidential) {
    g.add(box(0.1, 0.1, 1.2, '#0a0f18', 0, 2.25, 0));
    const f1 = addFlag(g, countryFlagTexture('USA', ['#b22234', '#fff', '#3c3b6e']), 0.65, 2.55, 0.55, 1.35, 0.85, 0);
    const f2 = addFlag(g, countryFlagTexture('USA', ['#b22234', '#fff', '#3c3b6e']), -0.65, 2.55, 0.55, 1.35, 0.85, 0);
    f1.rotation.y = Math.PI; f2.rotation.y = Math.PI;
    // seal on doors
    const seal = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), new THREE.MeshBasicMaterial({ map: countryFlagTexture('USA') }));
    seal.position.set(2.17, 1.35, 0); seal.rotation.y = Math.PI / 2; g.add(seal);
  }
  g.userData.wheels = wheels;
  g.userData.type = 'car';
  g.userData.speed = 0;
  return g;
}

// ---------------------------------------------------------------- helicopter
export function createHelicopter() {
  const g = new THREE.Group();
  const white = '#e9e6de', green = '#1d4d3f';
  const body = sphere(1.55, white, 0, 2.7, 0.2, { seg: 18, roughness: 0.38, metalness: 0.32 });
  body.scale.set(1.02, 1.02, 1.55); g.add(body);
  const cabin = sphere(1.18, '#172a38', 0, 2.95, 1.25, { seg: 16, roughness: 0.08, metalness: 0.9 });
  cabin.scale.set(0.92, 0.78, 0.9); g.add(cabin);
  const nose = sphere(1.15, white, 0, 2.55, 1.7, { seg: 14, roughness: 0.4 }); nose.scale.set(0.88, 0.8, 0.7); g.add(nose);
  const boom = cyl(0.34, 0.52, 4.6, 10, white, 0, 2.55, -3.2); boom.rotation.x = Math.PI / 2; g.add(boom);
  const fin = box(0.18, 1.5, 1.1, white, 0, 3.25, -5.4); g.add(fin);
  const tailRotor = new THREE.Group(); tailRotor.position.set(0.35, 3.3, -5.45); g.add(tailRotor);
  for (let i = 0; i < 2; i++) { const b = box(0.06, 1.9, 0.12, '#22262b', 0, 0, 0); b.rotation.x = i * Math.PI / 2; tailRotor.add(b); }
  const mast = cyl(0.13, 0.13, 0.9, 8, '#444', 0, 4.28, 0.1); g.add(mast);
  const rotor = new THREE.Group(); rotor.position.set(0, 4.7, 0.1); g.add(rotor);
  for (let i = 0; i < 4; i++) {
    const b = box(8.6, 0.06, 0.26, '#242a2f', 0, 0, 0);
    b.rotation.y = i * Math.PI / 2; b.position.x = Math.cos(i * Math.PI / 2) * 4.2; b.position.z = -Math.sin(i * Math.PI / 2) * 4.2;
    rotor.add(b);
  }
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.05, 6, 28), mat(green, { metalness: 0.4 }));
  stripe.rotation.y = Math.PI / 2; stripe.scale.z = 0.72; stripe.position.set(0, 2.7, 0.2); g.add(stripe);
  for (const x of [-1.25, 1.25]) {
    g.add(box(0.12, 0.12, 3.2, '#2b2f33', x, 0.38, 0.1));
    g.add(box(0.12, 0.7, 0.12, '#2b2f33', x, 0.75, 1.25));
    g.add(box(0.12, 0.7, 0.12, '#2b2f33', x, 0.75, -1.05));
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshStandardMaterial({ color: '#ff3030', emissive: '#ff2020', emissiveIntensity: 4 }));
  beacon.position.set(0, 3.95, 0.1); g.add(beacon);
  const seal = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ map: countryFlagTexture('USA') }));
  seal.position.set(1.56, 2.7, 0.4); seal.rotation.y = Math.PI / 2; g.add(seal);
  g.userData.rotor = rotor; g.userData.tailRotor = tailRotor; g.userData.type = 'heli'; g.userData.speed = 0;
  return g;
}

// ---------------------------------------------------------------- plane
export function createPlane() {
  const g = new THREE.Group();
  const white = '#ece9e1', blue = '#1a3a6b', gold = '#c8a24a';
  const fus = cyl(1.55, 1.55, 25, 18, white, 0, 4.2, 0); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nose = sphere(1.55, white, 0, 4.2, 12.7, { seg: 16 }); nose.scale.set(1, 1, 1.8); g.add(nose);
  const tail = cyl(1.55, 0.6, 5.5, 14, white, 0, 4.2, -15); tail.rotation.x = Math.PI / 2; g.add(tail);
  const belly = box(2.6, 0.55, 20, blue, 0, 2.9, 0); g.add(belly);
  const stripe = box(2.65, 0.24, 22, gold, 0, 3.25, 0); g.add(stripe);
  const wing = box(37, 0.45, 5.4, white, 0, 4.15, -3.2); wing.rotation.z = 0.02; g.add(wing);
  const wingTips = box(4, 0.5, 3.4, blue, 0, 4.1, -3.2); g.add(wingTips);
  const fin = box(0.6, 6, 4.6, white, 0, 7.2, -13.8); fin.rotation.x = -0.18; g.add(fin);
  const finBlue = box(0.62, 2.2, 4.4, blue, 0, 9.1, -14.1); finBlue.rotation.x = -0.18; g.add(finBlue);
  for (const x of [-7.5, 7.5]) {
    const eng = cyl(1.0, 1.0, 3.4, 12, '#d8d6cf', x, 3.9, -1.2); eng.rotation.x = Math.PI / 2; g.add(eng);
    const intake = new THREE.Mesh(new THREE.CircleGeometry(1, 12), mat('#1a1e22', { metalness: 0.8 })); intake.position.set(x, 3.9, 0.55); g.add(intake);
  }
  // windows
  const wmat = new THREE.MeshStandardMaterial({ color: '#0e1e2e', emissive: '#2a4a6a', emissiveIntensity: 0.7 });
  for (let i = 0; i < 12; i++) { const w = box(0.06, 0.34, 0.44, '#000', 1.53, 4.55, 9.5 - i * 1.15); w.material = wmat; g.add(w); const w2 = w.clone(); w2.position.x = -1.53; g.add(w2); }
  const title = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), new THREE.MeshBasicMaterial({ map: textSprite('UNITED STATES OF AMERICA', { w: 1024, h: 128, color: '#1a3a6b', font: '700 58px "Barlow Condensed"' }), transparent: true }));
  title.position.set(1.57, 4.7, 1.8); title.rotation.y = Math.PI / 2; g.add(title);
  const title2 = title.clone(); title2.position.x = -1.57; title2.rotation.y = -Math.PI / 2; g.add(title2);
  for (const x of [-5.5, 5.5]) {
    const gear = box(0.25, 2.6, 0.25, '#333', x, 1.6, 1.8); g.add(gear);
    const wheel = cyl(0.55, 0.55, 0.35, 12, '#111', x, 0.5, 1.8); wheel.rotation.z = Math.PI / 2; g.add(wheel);
  }
  g.userData.type = 'plane';
  return g;
}

// ---------------------------------------------------------------- people
export function createPresident() {
  const g = new THREE.Group();
  const suit = '#1b2a44', skin = '#c99e7c', hair = '#2b201a';
  const legGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.95, 8);
  const legL = new THREE.Mesh(legGeo, mat('#20242e', { roughness: 0.9 })); legL.position.set(-0.17, 0.52, 0); legL.castShadow = true;
  const legR = legL.clone(); legR.position.x = 0.17;
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.16, 0.5);
  const shoeL = new THREE.Mesh(shoeGeo, mat('#0b0d10', { roughness: 0.5 })); shoeL.position.set(-0.17, 0.1, 0.08);
  const shoeR = shoeL.clone(); shoeR.position.x = 0.17;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.0, 0.46), mat(suit, { roughness: 0.78 })); torso.position.y = 1.44; torso.castShadow = true;
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.62, 0.03), mat('#e8e4d6')); shirt.position.set(0, 1.55, 0.235);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.03), mat('#a52a2a')); tie.position.set(0, 1.5, 0.255);
  const armGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.9, 8);
  const armL = new THREE.Mesh(armGeo, mat(suit)); armL.position.set(-0.55, 1.38, 0); armL.rotation.z = 0.12; armL.castShadow = true;
  const armR = armL.clone(); armR.position.x = 0.55; armR.rotation.z = -0.12;
  const handGeo = new THREE.SphereGeometry(0.1, 8, 6);
  const handL = new THREE.Mesh(handGeo, mat(skin)); handL.position.set(-0.64, 0.94, 0);
  const handR = handL.clone(); handR.position.x = 0.64;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.16, 8), mat(skin)); neck.position.y = 1.96;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), mat(skin, { roughness: 0.62 })); head.position.y = 2.2; head.castShadow = true;
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair, { roughness: 0.9 })); hairM.position.y = 2.25;
  const eyeGeo = new THREE.SphereGeometry(0.024, 6, 4);
  const eyeL = new THREE.Mesh(eyeGeo, mat('#151515')); eyeL.position.set(-0.1, 2.24, 0.27);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.1;
  g.add(legL, legR, shoeL, shoeR, torso, shirt, tie, armL, armR, handL, handR, neck, head, hairM, eyeL, eyeR);
  g.userData = { legL, legR, armL, armR, type: 'player', walk: 0 };
  return g;
}

export function createAgent(variant = 0) {
  const g = new THREE.Group();
  const suit = variant ? '#171b22' : '#121720', skin = variant ? '#8a6148' : '#c99e7c';
  const legGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.95, 8);
  const legL = new THREE.Mesh(legGeo, mat('#15181e')); legL.position.set(-0.16, 0.52, 0);
  const legR = legL.clone(); legR.position.x = 0.16;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.0, 0.44), mat(suit)); torso.position.y = 1.44; torso.castShadow = true;
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 0.03), mat('#d9d4c5')); shirt.position.set(0, 1.55, 0.225);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.03), mat('#1b1b1b')); tie.position.set(0, 1.5, 0.245);
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.9, 8), mat(suit)); armL.position.set(-0.54, 1.38, 0); armL.rotation.z = 0.1;
  const armR = armL.clone(); armR.position.x = 0.54; armR.rotation.z = -0.1;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), mat(skin)); head.position.y = 2.17;
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.06), mat('#07090b', { metalness: 0.6 })); glasses.position.set(0, 2.2, 0.24);
  const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), mat('#d8d2c2')); ear.position.set(0.28, 2.15, 0.02);
  g.add(legL, legR, torso, shirt, tie, armL, armR, head, glasses, ear);
  g.userData = { legL, legR, armL, armR, type: 'agent' };
  return g;
}

export function createLeader(color = '#20242a') {
  const g = createAgent(1);
  const coat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.04, 0.5), mat(color, { roughness: 0.8 })); coat.position.y = 1.45;
  g.add(coat);
  return g;
}

// ---------------------------------------------------------------- crowd
export function createCrowd() {
  const group = new THREE.Group();
  const count = 220;
  const bodyGeo = new THREE.BoxGeometry(0.55, 1.0, 0.34);
  const headGeo = new THREE.SphereGeometry(0.16, 6, 5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  const headMat = new THREE.MeshStandardMaterial({ color: '#b98b68', roughness: 0.8 });
  const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  const heads = new THREE.InstancedMesh(headGeo, headMat, count);
  bodies.castShadow = true; heads.castShadow = true;
  const colors = ['#6d2b2b', '#2b3d6d', '#3d6d45', '#6d5a2b', '#4a2b6d', '#2b6d6a', '#7a7a7a', '#1f1f1f'];
  for (let i = 0; i < count; i++) bodies.setColorAt(i, new THREE.Color(colors[i % colors.length]));
  const signs = [];
  for (let s = 0; s < 4; s++) {
    const texts = ['NO WAR', 'POWER TO THE PEOPLE', 'HEALTHCARE NOW', 'HONK IF YOU VOTE'];
    const plane = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 0.9), new THREE.MeshBasicMaterial({ map: signTexture(texts[s]), transparent: true, side: THREE.DoubleSide }), Math.floor(count / 4));
    signs.push(plane);
  }
  group.add(bodies, heads, ...signs);
  const data = [];
  const r = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < count; i++) data.push({ x: r(-25, 25), z: r(-8, 16), phase: r(0, 6.28), scale: r(0.9, 1.12), speed: r(0.5, 1.3) });
  const dummy = new THREE.Object3D();
  let frame = 0;
  function update(t, intensity = 1) {
    frame++;
    const active = Math.floor(count * Math.max(0, Math.min(1, intensity)));
    bodies.count = active; heads.count = active;
    for (let i = 0; i < active; i++) {
      const d = data[i];
      const bob = Math.sin(t * d.speed * 3 + d.phase) * 0.1;
      const sway = Math.sin(t * 0.6 + d.phase) * 0.25;
      dummy.position.set(d.x + sway, 0.62 + bob, d.z);
      dummy.rotation.set(0, Math.sin(t * 0.4 + d.phase) * 0.5, 0);
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 1.32 + bob; dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(d.scale);
      dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
      if (i % 4 === 0) {
        const si = Math.floor(i / 4);
        const mesh = signs[si % 4];
        if (si < mesh.count) {
          dummy.position.set(d.x + sway, 1.85 + bob, d.z + 0.3);
          dummy.rotation.set(0, Math.sin(t + d.phase) * 0.2, 0.04);
          dummy.scale.setScalar(1);
          dummy.updateMatrix(); mesh.setMatrixAt(si, dummy.matrix);
        }
      }
    }
    for (const s of signs) s.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }
  update(0, 1);
  return { group, update };
}

export function createHonorGuard() {
  const g = createAgent(0);
  g.userData.legL.material = mat('#101820');
  g.userData.legR.material = mat('#101820');
  const cap = cyl(0.24, 0.24, 0.16, 10, '#0c1220', 0, 2.4, 0, { metalness: 0.3 });
  g.add(cap);
  return g;
}
