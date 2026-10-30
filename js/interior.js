// ---------------------------------------------------------------------------
// The Oval Office — walkable interior
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { box, cyl, sphere, mat, addFlag } from './models.js';
import { countryFlagTexture, posterTexture, carpetTexture, textSprite } from './textures.js';

export const INTERIOR_ORIGIN = { x: 6000, z: 6000 };

export function buildOvalOffice(scene) {
  const g = new THREE.Group();
  g.position.set(INTERIOR_ORIGIN.x, 0, INTERIOR_ORIGIN.z);
  scene.add(g);
  const cream = '#e9dfc9', wall = '#e4d8bf', wood = '#4a3526', navy = '#142b4a', goldC = '#c8a24a';

  // floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(13, 64), mat('#5b4432', { roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2; floor.scale.z = 0.7; floor.position.y = 0.01; floor.receiveShadow = true; g.add(floor);
  // wood border ring
  const border = new THREE.Mesh(new THREE.RingGeometry(9.5, 13, 64), mat('#3d2c20', { roughness: 0.6 }));
  border.rotation.x = -Math.PI / 2; border.scale.z = 0.7; border.position.y = 0.02; g.add(border);
  // rug
  const rug = new THREE.Mesh(new THREE.CircleGeometry(7.4, 64), new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 0.92 }));
  rug.rotation.x = -Math.PI / 2; rug.scale.z = 0.72; rug.position.y = 0.04; rug.receiveShadow = true; g.add(rug);

  // walls
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 8.6, 64, 1, true), new THREE.MeshStandardMaterial({ color: wall, roughness: 0.9, side: THREE.BackSide }));
  walls.scale.z = 0.7; walls.position.y = 4.3; walls.receiveShadow = true; g.add(walls);
  // wainscot
  const wain = new THREE.Mesh(new THREE.CylinderGeometry(12.94, 12.94, 1.6, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#cdbd9d', roughness: 0.8, side: THREE.BackSide }));
  wain.scale.z = 0.7; wain.position.y = 0.8; g.add(wain);
  const trim = new THREE.Mesh(new THREE.CylinderGeometry(12.9, 12.9, 0.12, 64, 1, true), new THREE.MeshStandardMaterial({ color: goldC, metalness: 0.6, roughness: 0.35, side: THREE.BackSide }));
  trim.scale.z = 0.7; trim.position.y = 1.62; g.add(trim);
  const cornice = new THREE.Mesh(new THREE.CylinderGeometry(12.86, 12.86, 0.3, 64, 1, true), new THREE.MeshStandardMaterial({ color: '#d7c9ab', roughness: 0.8, side: THREE.BackSide }));
  cornice.scale.z = 0.7; cornice.position.y = 8.4; g.add(cornice);

  // ceiling
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(13, 64), mat('#e8dfca', { roughness: 0.9 }));
  ceil.rotation.x = Math.PI / 2; ceil.scale.z = 0.7; ceil.position.y = 8.6; g.add(ceil);
  const dome = sphere(3.4, '#efe6d2', 0, 8.6, 0, { seg: 20, seg2: 10 }); dome.scale.y = 0.4; g.add(dome);
  // chandelier
  const chain = cyl(0.04, 0.04, 1.2, 5, goldC, 0, 8.1, 0, { metalness: 0.7 }); g.add(chain);
  const chand = new THREE.Group(); chand.position.y = 7.3; g.add(chand);
  chand.add(new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.06, 8, 24), mat(goldC, { metalness: 0.8, roughness: 0.25 })));
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const bulb = sphere(0.1, '#fff2c8', Math.cos(a) * 1.3, 0.12, Math.sin(a) * 1.3, { emissive: 0xffd98a, emissiveIntensity: 3, material: new THREE.MeshStandardMaterial({ color: '#fff2c8', emissive: '#ffd98a', emissiveIntensity: 3 }) });
    chand.add(bulb);
  }

  // windows behind desk (north wall, z negative)
  const skyTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 384;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 384);
    gr.addColorStop(0, '#7fb6dc'); gr.addColorStop(0.55, '#cfe4ef'); gr.addColorStop(0.62, '#7a9a6b'); gr.addColorStop(1, '#4f6b45');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 384);
    x.fillStyle = 'rgba(255,255,255,0.45)';
    for (const [cx, cy, r] of [[60, 80, 28], [100, 74, 36], [150, 88, 26]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  for (const wx of [-5.2, 0, 5.2]) {
    const frame = box(3.0, 4.7, 0.18, '#c9bda4', wx, 4.8, -8.9); frame.rotation.x = 0; g.add(frame);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 4.2), new THREE.MeshStandardMaterial({ map: skyTex, emissive: '#ffffff', emissiveMap: skyTex, emissiveIntensity: 0.55, roughness: 0.25 }));
    win.position.set(wx, 4.8, -8.78); g.add(win);
    g.add(box(0.1, 4.2, 0.08, '#e8e2d4', wx, 4.8, -8.7));
    g.add(box(2.5, 0.1, 0.08, '#e8e2d4', wx, 4.8, -8.7));
    for (const sx of [-1.75, 1.75]) { const drape = box(0.55, 5.4, 0.25, '#223a5e', wx + sx, 4.6, -8.65); g.add(drape); }
  }

  // door (south)
  g.add(box(4.2, 5.4, 0.28, '#c9bda4', 0, 2.7, 8.75));
  const door = box(3.4, 4.9, 0.16, '#4a3526', 0, 2.45, 8.62); door.material = mat('#3c2a1d', { roughness: 0.45, metalness: 0.1 }); g.add(door);
  for (const dx of [-0.85, 0.85]) g.add(box(1.35, 4.4, 0.05, '#503a28', dx, 2.45, 8.52));
  g.add(sphere(0.09, goldC, 0.3, 2.3, 8.42, { metalness: 0.9, roughness: 0.2 }));
  g.add(sphere(0.09, goldC, -0.3, 2.3, 8.42, { metalness: 0.9, roughness: 0.2 }));

  // Resolute desk
  const desk = new THREE.Group(); desk.position.set(0, 0, -3.9); g.add(desk);
  desk.add(box(5.6, 0.22, 2.5, '#3a2718', 0, 2.55, 0, { material: mat('#3a2718', { roughness: 0.35, metalness: 0.05 }) }));
  desk.add(box(5.2, 2.4, 2.1, '#5a3e28', 0, 1.3, -0.1));
  desk.add(box(5.0, 1.6, 0.2, '#4a3320', 0, 1.0, 1.0));
  for (const dx of [-1.5, -0.5, 0.5, 1.5]) desk.add(box(0.75, 1.0, 0.08, '#3d2a1a', dx, 1.0, 1.11));
  // desktop items
  desk.add(box(0.75, 0.08, 0.55, '#1b1b1e', 0, 2.72, 0.3));
  desk.add(box(0.15, 0.32, 0.15, goldC, -1.4, 2.8, 0.2, { metalness: 0.9 }));
  desk.add(cyl(0.25, 0.35, 0.4, 10, '#1a2b45', 1.5, 2.88, 0.1));
  // chair
  const chair = new THREE.Group(); chair.position.set(0, 0, -5.35); g.add(chair);
  chair.add(box(1.5, 0.25, 1.3, '#1d2a3a', 0, 1.2, 0));
  chair.add(box(1.5, 1.9, 0.25, '#1d2a3a', 0, 2.25, -0.55));
  for (const ax of [-0.8, 0.8]) chair.add(box(0.15, 0.8, 1.1, '#1d2a3a', ax, 1.6, -0.05));
  chair.add(cyl(0.2, 0.4, 1.2, 8, '#3a3a3c', 0, 0.6, 0));
  for (let i = 0; i < 5; i++) { const leg = box(0.15, 0.1, 1.2, '#2a2a2c', 0, 0.2, 0); leg.rotation.y = i * Math.PI * 2 / 5; chair.add(leg); }

  // sofas
  for (const side of [-1, 1]) {
    const sofa = new THREE.Group(); sofa.position.set(side * 4.2, 0, 0.4); sofa.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(sofa);
    sofa.add(box(3.8, 0.55, 1.35, '#d9cfb8', 0, 0.7, 0));
    sofa.add(box(3.8, 1.25, 0.35, '#d9cfb8', 0, 1.3, -0.6));
    for (const sx of [-1.85, 1.85]) sofa.add(box(0.35, 1.1, 1.35, '#d9cfb8', sx, 1.1, 0));
    for (const sx of [-1.0, 0, 1.0]) sofa.add(box(0.9, 0.5, 0.3, '#c9bfa6', sx, 1.0, -0.45));
  }
  // coffee table
  g.add(box(3.0, 0.18, 1.6, '#3a2718', 0, 1.0, 0.4));
  for (const dx of [-1.2, 1.2]) for (const dz of [-0.55, 0.55]) g.add(cyl(0.1, 0.1, 1.0, 6, goldC, dx, 0.5, 0.4 + dz, { metalness: 0.7 }));
  g.add(box(0.5, 0.12, 0.35, '#8b2f2f', -0.6, 1.12, 0.35));
  g.add(box(0.45, 0.12, 0.32, '#1f3f6a', 0.1, 1.12, 0.5));

  // fireplace (west)
  const fp = new THREE.Group(); fp.position.set(-9.2, 0, -1.2); fp.rotation.y = Math.PI / 2; g.add(fp);
  fp.add(box(5.0, 3.4, 1.4, '#c9bda4', 0, 1.7, 0));
  fp.add(box(3.2, 2.2, 0.3, '#1a1612', 0, 1.2, 0.7));
  fp.add(box(5.4, 0.25, 1.8, '#b9ab8e', 0, 3.5, 0));
  const fire = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.9 }));
  fire.position.set(0, 1.15, 0.72); fp.add(fire);
  const fireGlow = new THREE.PointLight(0xff8a3c, 1.5, 12, 2); fireGlow.position.set(-8.3, 1.6, -1.2); g.add(fireGlow);

  // paintings
  const addPainting = (tex, px, pz, rot, w = 2.4, h = 3.0) => {
    const frame = box(w + 0.3, h + 0.3, 0.15, goldC, px, 5.1, pz, { metalness: 0.55, roughness: 0.35 }); frame.rotation.y = rot; g.add(frame);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    p.position.set(px + Math.sin(rot) * 0.1, 5.1, pz + Math.cos(rot) * 0.1); p.rotation.y = rot; g.add(p);
  };
  addPainting(posterTexture('washington'), 7.8, -5.5, -0.5);
  addPainting(posterTexture('lincoln'), -7.8, -5.5, 0.5);
  addPainting(posterTexture('portrait'), 8.6, 3.2, -1.0, 2.0, 2.5);

  // flags
  addFlag(g, countryFlagTexture('USA'), -3.0, 3.2, -7.9, 2.8, 1.9, 5.5);
  const presFlag = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const x = c.getContext('2d'); x.fillStyle = '#14315c'; x.fillRect(0, 0, 256, 160);
    x.fillStyle = '#c8a24a'; x.beginPath(); x.arc(128, 80, 42, 0, 7); x.fill();
    x.fillStyle = '#14315c'; x.beginPath(); x.arc(128, 80, 32, 0, 7); x.fill();
    x.fillStyle = '#f2eee4'; x.font = '600 18px Georgia'; x.textAlign = 'center'; x.fillText('E PLURIBUS', 128, 132); x.fillText('UNUM', 128, 150);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  addFlag(g, presFlag, 3.0, 3.2, -7.9, 2.8, 1.9, 5.5);

  // bookshelf (east)
  const shelf = new THREE.Group(); shelf.position.set(9.4, 0, 1.8); shelf.rotation.y = -Math.PI / 2; g.add(shelf);
  shelf.add(box(5, 4.6, 0.8, '#4a3526', 0, 2.3, 0));
  for (const y of [0.6, 1.8, 3.0, 4.2]) shelf.add(box(4.6, 0.08, 0.7, '#6a4c34', 0, y, 0.05));
  const bookCols = ['#8d3b3b', '#2f4f7a', '#3d6b4a', '#7a6a3d', '#4a3d6b'];
  for (let i = 0; i < 30; i++) {
    const w = 0.12 + Math.random() * 0.12, h = 0.5 + Math.random() * 0.3;
    shelf.add(box(w, h, 0.35, bookCols[i % 5], -2.1 + (i % 14) * 0.3, 0.75 + Math.floor(i / 14) * 1.2 + h / 2, 0.2));
  }

  // lamps
  for (const [lx, lz] of [[-6.0, 4.2], [6.0, 4.2]]) {
    g.add(cyl(0.12, 0.18, 3.4, 8, goldC, lx, 1.7, lz, { metalness: 0.7 }));
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 0.8, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#f0e3c0', emissive: '#ffd98a', emissiveIntensity: 0.8, side: THREE.DoubleSide }));
    shade.position.set(lx, 3.6, lz); g.add(shade);
    const pl = new THREE.PointLight(0xffd9a0, 0.8, 10, 2); pl.position.set(lx, 3.6, lz); g.add(pl);
  }

  // secret service at door
  // (agent model added by world to avoid import cycle)

  // interact anchors
  const interacts = [
    { id: 'oval-desk', label: 'Open the government dashboard', x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z - 2.6, r: 3.2 },
    { id: 'oval-exit', label: 'Leave the Oval Office', x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z + 8.2, r: 2.6 },
  ];
  return { group: g, interacts, center: { x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z }, bounds: { rx: 12.0, rz: 8.0 } };
}
