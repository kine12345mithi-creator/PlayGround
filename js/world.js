// ---------------------------------------------------------------------------
// The world: continent, cities, oceans, sky, interiors, foreign capitals
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { CITIES, COUNTRIES, project, WORLD_CAPITALS } from './data.js';
import { Terrain, noise2, fbm } from './geo.js';
import { createCar, createHelicopter, createPlane, createPresident, createAgent, createLeader, createCrowd, createHonorGuard, box, cyl, sphere, cone, mat, addFlag } from './models.js';
import { buildUSLandmark, buildWhiteHouse, buildCapitalLandmark } from './landmarks.js';
import { buildOvalOffice } from './interior.js';
import { facadeTexture, padTexture, asphaltTexture, cloudTexture, glowTexture, textSprite, countryFlagTexture, signTexture } from './textures.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const SKY_KEYS = [
  { h: 0, top: '#040814', bot: '#0b1a2a', sun: '#8fa7d6', hemi: 0.18, dir: 0.18, fog: '#0a1524', cloud: '#1c2940' },
  { h: 5.2, top: '#1e2c4c', bot: '#b56a57', sun: '#ffb07a', hemi: 0.34, dir: 0.5, fog: '#5d4a52', cloud: '#b98d7a' },
  { h: 6.4, top: '#3b6fa0', bot: '#e6a07b', sun: '#ffd0a0', hemi: 0.58, dir: 1.25, fog: '#b98d7a', cloud: '#f0c4a4' },
  { h: 9, top: '#4d8ec4', bot: '#cfe3ee', sun: '#fff4d6', hemi: 0.74, dir: 2.2, fog: '#b9d5e4', cloud: '#ffffff' },
  { h: 13, top: '#3d82c4', bot: '#d7e8f2', sun: '#ffffff', hemi: 0.85, dir: 2.7, fog: '#c3dcea', cloud: '#ffffff' },
  { h: 17.4, top: '#4a6d9d', bot: '#f2c08a', sun: '#ffd7a0', hemi: 0.6, dir: 1.75, fog: '#d2ad8c', cloud: '#ffe1c2' },
  { h: 19, top: '#23325b', bot: '#ef8b57', sun: '#ff9b5a', hemi: 0.35, dir: 0.9, fog: '#8a5f56', cloud: '#e6a482' },
  { h: 20.6, top: '#0c1428', bot: '#1d2c46', sun: '#9eb8e0', hemi: 0.2, dir: 0.32, fog: '#162338', cloud: '#26344a' },
  { h: 24, top: '#040814', bot: '#0b1a2a', sun: '#8fa7d6', hemi: 0.18, dir: 0.18, fog: '#0a1524', cloud: '#1c2940' },
];

const ROUTES = [
  ['dc', 'nyc'], ['nyc', 'bos'], ['nyc', 'chi'], ['dc', 'atl'], ['atl', 'mia'], ['atl', 'nola'],
  ['hou', 'dal'], ['dal', 'den'], ['den', 'phx'], ['phx', 'las'], ['las', 'la'], ['la', 'sfo'],
  ['sfo', 'sea'], ['den', 'chi'], ['dc', 'chi'], ['nola', 'hou'], ['dal', 'atl'], ['bos', 'chi'],
];

export class World {
  constructor(scene, terrain, sim, renderer) {
    this.scene = scene;
    this.terrain = terrain;
    this.sim = sim;
    this.renderer = renderer;
    this.root = new THREE.Group(); scene.add(this.root);
    this.mode = 'usa';
    this.stageCountry = null;
    this.stage = new THREE.Group(); scene.add(this.stage);
    this.interactables = [];
    this.vehicles = [];
    this.colliders = new Map();
    this.facadeMats = [];
    this.traffic = [];
    this.cityLabels = [];
    this.cityData = {};
    this.cityCores = CITIES.map(c => {
      const p = project(c.lon, c.lat);
      return { id: c.id, x: p.x, z: p.z, r: c.id === 'dc' ? 105 : c.tier === 1 ? 78 : c.tier === 2 ? 62 : 50 };
    });
    this.cityPads = CITIES.map(c => {
      const p = project(c.lon, c.lat);
      const w = c.id === 'dc' ? 300 : c.tier === 1 ? 210 : c.tier === 2 ? 160 : 125;
      const d = c.id === 'dc' ? 240 : c.tier === 1 ? 180 : c.tier === 2 ? 140 : 110;
      return {
        id: c.id, x: p.x, z: p.z, hw: w / 2, hd: d / 2,
        y: c.id === 'hnl' ? 1.65 : (terrain.cityY[c.id] ?? terrain.sample(p.x, p.z)),
      };
    });
    this.stageInteracts = [];
    this.detail = [];
    this.time = 0;
    this.traveling = false;
    this._buildSky();
    this._buildLights();
    this._buildTerrain();
    this._buildWater();
    this._buildRoads();
    this._buildTrees();
    this._buildCities();
    this._buildWashington();
    this._buildAndrews();
    this._buildStageStatic();
    this.interior = buildOvalOffice(scene);
    this._buildInteriorDetails();
    this._buildStars();
    this._buildClouds();
    this._buildTraffic();
    this._buildProtests();
    this._buildDetail();
    this._buildCityLights();
    this.startPos = { x: 269, z: 47, heading: 0 };
    this.stageStart = { x: 3200, z: 1552, heading: Math.PI };
    this.interiorStart = { x: 6000, z: 6002, heading: Math.PI };
  }

  // ------------------------------------------------------------ utilities
  addCollider(x, z, r) {
    const cell = 40;
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) {
      const key = ix + ',' + iz;
      if (!this.colliders.has(key)) this.colliders.set(key, []);
      this.colliders.get(key).push({ x, z, r });
    }
  }

  resolveCollision(x, z, radius = 0.55) {
    const cell = 40;
    const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
    let px = x, pz = z;
    for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) {
      const arr = this.colliders.get(ix + ',' + iz);
      if (!arr) continue;
      for (const c of arr) {
        const dx = px - c.x, dz = pz - c.z;
        const d = Math.hypot(dx, dz);
        const min = c.r + radius;
        if (d < min && d > 0.0001) { px = c.x + dx / d * min; pz = c.z + dz / d * min; }
      }
    }
    return { x: px, z: pz };
  }

  heightAt(x, z) {
    if (this.mode === 'interior') {
      const dx = (x - 6000) / 13, dz = (z - 6000) / 9;
      return dx * dx + dz * dz < 1 ? 0 : 0;
    }
    if (this.mode === 'stage') {
      const d = Math.hypot(x - 3200, z - 1500);
      if (d < 125) return 1.72;
      if (d < 138) return 1.72 - (d - 125) * 0.09;
      return -6.5;
    }
    // Honolulu island (outside the continental mesh)
    const h = project(-157.86, 21.31);
    const hd = Math.hypot(x - h.x, z - h.z);
    if (hd < 62) return 1.65;
    if (hd < 78) return Math.max(-0.2, 1.65 - (hd - 62) * 0.16);
    // City pads are flat plates, so walking height must follow the pavement
    // instead of the raw terrain (which drops into the Potomac at D.C.'s edge).
    let inside = null, insideDist = Infinity, edge = null, edgeDist = Infinity;
    for (const pad of this.cityPads) {
      if (pad.id === 'hnl') continue;
      const ox = Math.max(Math.abs(x - pad.x) - pad.hw, 0);
      const oz = Math.max(Math.abs(z - pad.z) - pad.hd, 0);
      const out = Math.hypot(ox, oz);
      if (out <= 0) {
        const cd = Math.hypot(x - pad.x, z - pad.z);
        if (cd < insideDist) { insideDist = cd; inside = pad; }
      } else if (out < edgeDist) { edgeDist = out; edge = pad; }
    }
    if (inside) return inside.y;
    if (edge && edgeDist < 12) return lerp(edge.y, this.terrain.sample(x, z), smooth(0, 12, edgeDist));
    return this.terrain.sample(x, z);
  }

  isWater(x, z) { return this.heightAt(x, z) < 0.35; }

  addInteractable(o) { this.interactables.push(o); }

  nearestInteractable(x, z, mode, radius = 3.4) {
    const list = mode === 'stage' ? this.stageInteracts : mode === 'interior' ? this.interior.interacts : this.interactables;
    let best = null, bd = Infinity;
    for (const it of list) {
      const d = Math.hypot(x - it.x, z - it.z);
      const rr = it.r ?? radius;
      if (d < rr && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  // ------------------------------------------------------------ sky / lights
  _buildSky() {
    this.skyUniforms = {
      top: { value: new THREE.Color('#4d8ec4') },
      bottom: { value: new THREE.Color('#cfe3ee') },
      sunColor: { value: new THREE.Color('#fff4d6') },
      sunDir: { value: new THREE.Vector3(0.4, 0.7, 0.3) },
      offset: { value: 30 }, exponent: { value: 0.7 },
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(7200, 40, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorld;
        void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform vec3 top; uniform vec3 bottom; uniform vec3 sunColor; uniform vec3 sunDir;
        uniform float offset; uniform float exponent; varying vec3 vWorld;
        void main(){
          vec3 dir = normalize(vWorld - cameraPosition);
          float h = clamp(dir.y * 1.05 + 0.02, 0.0, 1.0);
          vec3 col = mix(bottom, top, pow(h, exponent));
          float sun = pow(max(dot(dir, normalize(sunDir)), 0.0), 420.0);
          float halo = pow(max(dot(dir, normalize(sunDir)), 0.0), 12.0);
          col += sunColor * sun * 2.2 + sunColor * halo * 0.18;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }));
    sky.frustumCulled = false;
    this.sky = sky; this.scene.add(sky);

    this.stars = (() => {
      const N = 1400, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = Math.random() * Math.PI * 2, v = Math.random() * 0.9 + 0.05;
        const r = 6800, y = Math.sin(v * Math.PI / 2), q = Math.cos(v * Math.PI / 2);
        pos[i * 3] = Math.cos(u) * q * r; pos[i * 3 + 1] = y * r; pos[i * 3 + 2] = Math.sin(u) * q * r;
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ color: '#fff7dd', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const p = new THREE.Points(geo, m); p.frustumCulled = false; this.scene.add(p); return p;
    })();

    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#fff0c0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
    this.sunSprite.scale.set(260, 260, 1); this.scene.add(this.sunSprite);

    this.clouds = [];
    const cloudTex = cloudTexture();
    for (let i = 0; i < 30; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.42, depthWrite: false, color: '#ffffff' }));
      const x = -520 + Math.random() * 1040, z = -300 + Math.random() * 620;
      s.position.set(x, 120 + Math.random() * 110, z);
      const sc = 90 + Math.random() * 200; s.scale.set(sc, sc * 0.48, 1);
      s.userData.phase = Math.random() * 100; s.userData.speed = 0.6 + Math.random() * 1.4;
      this.clouds.push(s); this.scene.add(s);
    }
  }

  _buildLights() {
    this.hemi = new THREE.HemisphereLight('#cfe4f2', '#4a4234', 0.7); this.scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight('#ffffff', 0.22); this.scene.add(this.ambient);
    this.dir = new THREE.DirectionalLight('#fff1d6', 2.2);
    this.dir.castShadow = true;
    const size = this.renderer.capabilities.isWebGL2 ? 2048 : 1024;
    this.dir.shadow.mapSize.set(size, size);
    this.dir.shadow.camera.left = -170; this.dir.shadow.camera.right = 170;
    this.dir.shadow.camera.top = 170; this.dir.shadow.camera.bottom = -170;
    this.dir.shadow.camera.near = 1; this.dir.shadow.camera.far = 700;
    this.dir.shadow.bias = -0.0006;
    this.dir.shadow.normalBias = 0.6;
    this.scene.add(this.dir); this.scene.add(this.dir.target);
    this.interiorLight = new THREE.PointLight('#ffd9a0', 0, 40, 1.8);
    this.interiorLight.position.set(6000, 5, 6000); this.scene.add(this.interiorLight);
    this.stageLight = new THREE.PointLight('#ffe0b0', 0, 70, 1.7);
    this.stageLight.position.set(3200, 16, 1500); this.scene.add(this.stageLight);
  }

  // ------------------------------------------------------------ terrain / water
  _buildTerrain() {
    const { gw, gh, heights, bounds, w, h } = this.terrain;
    const pos = [], col = [], idx = [];
    const c = new THREE.Color();
    const colorFor = (height, x, z) => {
      if (height < 0.1) return c.set('#26333a').clone();
      if (height < 1.1) return c.set('#c8b489').clone();
      if (height < 5) return c.set(fbm(x * 0.03, z * 0.03, 2) > 0.55 ? '#6f8f4f' : '#7fa05a').clone();
      if (height < 13) return c.set(fbm(x * 0.05 + 4, z * 0.05, 2) > 0.52 ? '#4d6d42' : '#5f804c').clone();
      if (height < 20) return c.set('#7a7d5d').clone();
      if (height < 27) return c.set('#8b8271').clone();
      return c.set('#d8d5cb').clone();
    };
    for (let iz = 0; iz < gh; iz++) {
      for (let ix = 0; ix < gw; ix++) {
        const x = bounds.minX + (ix / w) * (bounds.maxX - bounds.minX);
        const z = bounds.minZ + (iz / h) * (bounds.maxZ - bounds.minZ);
        const hh = heights[iz * gw + ix];
        pos.push(x, hh, z);
        const cc = colorFor(hh, x, z); col.push(cc.r, cc.g, cc.b);
      }
    }
    for (let iz = 0; iz < gh - 1; iz++) for (let ix = 0; ix < gw - 1; ix++) {
      const a = iz * gw + ix, b = a + 1, cc = a + gw, d = cc + 1;
      idx.push(a, cc, b, b, cc, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0.02, flatShading: true });
    this.terrainMesh = new THREE.Mesh(geo, m);
    this.terrainMesh.receiveShadow = true;
    this.root.add(this.terrainMesh);

    // Honolulu island
    const hp = project(-157.86, 21.31);
    const island = cyl(58, 68, 4.2, 40, '#c8b489', hp.x, 0.4, hp.z);
    island.scale.y = 0.6; this.root.add(island);
    const top = new THREE.Mesh(new THREE.CircleGeometry(58, 40), mat('#6f8f4f', { roughness: 0.95 }));
    top.rotation.x = -Math.PI / 2; top.position.set(hp.x, 1.62, hp.z); this.root.add(top);
  }

  _buildWater() {
    this.waterUniforms = {
      time: { value: 0 },
      deep: { value: new THREE.Color('#123a4f') },
      shallow: { value: new THREE.Color('#2d6f80') },
      sunDir: { value: new THREE.Vector3(0.4, 0.7, 0.3) },
      sunColor: { value: new THREE.Color('#fff0c0') },
    };
    const water = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000, 110, 110), new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, this.waterUniforms]),
      vertexShader: `
        #include <common>
        #include <fog_pars_vertex>
        uniform float time;
        varying vec3 vWorld;
        void main(){
          vec3 p = position;
          p.z += sin((p.x + time * 3.0) * 0.045) * 0.22 + cos((p.y - time * 2.2) * 0.062) * 0.16;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }
      `,
      fragmentShader: `
        #include <common>
        #include <fog_pars_fragment>
        uniform float time; uniform vec3 deep; uniform vec3 shallow; uniform vec3 sunDir; uniform vec3 sunColor;
        varying vec3 vWorld;
        void main(){
          vec3 viewDir = normalize(cameraPosition - vWorld);
          vec3 n = normalize(vec3(sin(vWorld.x*0.08+time*1.1)*0.12, 1.0, cos(vWorld.z*0.07-time*0.9)*0.12));
          float fres = pow(1.0 - max(dot(viewDir, n), 0.0), 2.4);
          vec3 col = mix(deep, shallow, fres * 0.9 + 0.08);
          float spec = pow(max(dot(reflect(-normalize(sunDir), n), viewDir), 0.0), 90.0);
          col += sunColor * spec * 1.1;
          float w = sin(vWorld.x*0.22 + time*1.6) * cos(vWorld.z*0.19 - time*1.2);
          col += vec3(0.018) * w;
          gl_FragColor = vec4(col, 0.96);
          #include <fog_fragment>
        }
      `,
    }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.08; water.receiveShadow = false;
    this.water = water; this.scene.add(water);
    // UniformsUtils.merge clones uniforms, so use the uniforms the material actually owns.
    this.waterUniforms = water.material.uniforms;
  }

  _buildRoads() {
    const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.92, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    roadMat.map.repeat.set(1, 6);
    this.roadMat = roadMat;
    this.roadPoints = [];
    for (const [a, b] of ROUTES) {
      const ca = this.terrain.cityCenter(a), cb = this.terrain.cityCenter(b);
      const mid = new THREE.Vector3((ca.x + cb.x) / 2 + (cb.z - ca.z) * 0.12, 0, (ca.z + cb.z) / 2 - (cb.x - ca.x) * 0.12);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(ca.x, 0, ca.z), mid, new THREE.Vector3(cb.x, 0, cb.z)]);
      const N = 36, pts = [];
      for (let i = 0; i <= N; i++) {
        const p = curve.getPoint(i / N);
        p.y = this.heightAt(p.x, p.z) + 0.32;
        pts.push(p);
      }
      const positions = [], uvs = [], indices = [], width = 7.2;
      let dist = 0;
      for (let i = 0; i <= N; i++) {
        const p = pts[i];
        const t = i < N ? pts[i + 1].clone().sub(p) : p.clone().sub(pts[i - 1]);
        t.y = 0; t.normalize();
        const nx = -t.z, nz = t.x;
        if (i > 0) dist += p.distanceTo(pts[i - 1]);
        positions.push(p.x + nx * width / 2, p.y, p.z + nz * width / 2);
        positions.push(p.x - nx * width / 2, p.y, p.z - nz * width / 2);
        uvs.push(0, dist / 26, 1, dist / 26);
        if (i < N) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices); geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, roadMat); mesh.receiveShadow = true; this.root.add(mesh);
      this.roadPoints.push(...pts.filter((_, i) => i % 3 === 0));
    }
  }

  _buildTrees() {
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 2.0, 5); trunkGeo.translate(0, 1, 0);
    const leafGeo = new THREE.ConeGeometry(1.7, 4.2, 6); leafGeo.translate(0, 3.2, 0);
    const N = 2300;
    const trunk = new THREE.InstancedMesh(trunkGeo, mat('#4a3526', { roughness: 0.95 }), N);
    const leaf = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), N);
    trunk.castShadow = false; leaf.castShadow = false; trunk.receiveShadow = true; leaf.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const r = rng(9119);
    const cityR = CITIES.map(c => ({ ...project(c.lon, c.lat), r: c.tier === 1 ? 115 : c.tier === 2 ? 95 : 80 }));
    const greens = ['#3f6b40', '#4f7a45', '#365f3a', '#5c7d49', '#2f5636'];
    const roadPts = this.roadPoints;
    let count = 0, tries = 0;
    while (count < N && tries < N * 12) {
      tries++;
      const x = -480 + r() * 960, z = -260 + r() * 560;
      const h = this.heightAt(x, z);
      if (h < 0.7 || h > 20) continue;
      let ok = true;
      for (const c of cityR) if (Math.hypot(x - c.x, z - c.z) < c.r) { ok = false; break; }
      if (!ok) continue;
      for (let i = 0; i < roadPts.length; i += 4) { if (Math.hypot(x - roadPts[i].x, z - roadPts[i].z) < 9) { ok = false; break; } }
      if (!ok) continue;
      const s = 0.7 + r() * 1.5;
      dummy.position.set(x, h - 0.15, z); dummy.rotation.set(0, r() * 6.28, 0); dummy.scale.set(s, s * (0.8 + r() * 0.5), s);
      dummy.updateMatrix(); trunk.setMatrixAt(count, dummy.matrix); leaf.setMatrixAt(count, dummy.matrix);
      leaf.setColorAt(count, new THREE.Color(greens[Math.floor(r() * greens.length)]));
      count++;
    }
    trunk.count = count; leaf.count = count;
    this.root.add(trunk, leaf);
  }

  // ------------------------------------------------------------ cities
  cityMeta(id) { return CITIES.find(c => c.id === id); }

  _buildCities() {
    for (const city of CITIES) {
      if (city.id === 'dc') continue;
      this._buildCity(city);
    }
    this._buildCity(this.cityMeta('dc'), true);
  }

  _buildCity(city, isDC = false) {
    const p = project(city.lon, city.lat);
    const y = city.id === 'hnl' ? 1.65 : this.terrain.cityY[city.id] ?? this.terrain.sample(p.x, p.z);
    this.cityData[city.id] = { ...city, x: p.x, z: p.z, y };
    const tier = city.tier;
    const w = isDC ? 300 : tier === 1 ? 210 : tier === 2 ? 160 : 125;
    const d = isDC ? 240 : tier === 1 ? 180 : tier === 2 ? 140 : 110;
    const blocks = isDC ? 10 : tier === 1 ? 8 : tier === 2 ? 6 : 5;
    const padGeo = new THREE.PlaneGeometry(w, d);
    const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ map: padTexture(city.id.length * 31 + city.name.length, blocks, isDC), roughness: 0.95, metalness: 0.02 }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(p.x, y + 0.13, p.z); pad.receiveShadow = true;
    this.root.add(pad);

    if (city.id === 'hnl') {
      const beach = cyl(72, 80, 1.2, 36, '#d9c394', p.x, 0.65, p.z); beach.scale.y = 0.55; this.root.add(beach);
      const land = new THREE.Mesh(new THREE.CircleGeometry(72, 36), mat('#7fa05a')); land.rotation.x = -Math.PI / 2; land.position.set(p.x, 1.62, p.z); this.root.add(land);
    }

    // landmark
    const landmarkR = isDC ? 0 : tier === 1 ? 34 : tier === 2 ? 28 : 24;
    if (city.landmark === 'whitehouse') {
      // handled in _buildWashington
    } else {
      buildUSLandmark(city.landmark, p.x, y + 0.18, p.z, (x, z, r) => this.addCollider(x, z, r), this.root);
    }

    // buildings
    const r = rng(city.id.charCodeAt(0) * 977 + city.id.charCodeAt(1) * 41 + city.name.length * 13);
    const styles = { glass: [], stone: [], brick: [] };
    const cellW = w / blocks, cellD = d / blocks;
    const maxH = isDC ? 11 : tier === 1 ? 62 : tier === 2 ? 32 : 18;
    const dcCore = this.cityCores.find(c => c.id === 'dc');
    for (let ix = 0; ix < blocks; ix++) {
      for (let iz = 0; iz < blocks; iz++) {
        const lx = -w / 2 + (ix + 0.5) * cellW;
        const lz = -d / 2 + (iz + 0.5) * cellD;
        const dist = Math.hypot(lx, lz);
        if (dist < landmarkR) continue;
        if (isDC && dist < 105) continue;
        if (r() < (tier === 1 ? 0.18 : 0.32)) continue;
        const n = 1 + (r() < (tier === 1 ? 0.55 : 0.28) ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const bx = p.x + lx + (r() - 0.5) * cellW * 0.42;
          const bz = p.z + lz + (r() - 0.5) * cellD * 0.42;
          // Compressed cities sit close together: keep towers in the half of the
          // map that is nearest their own city so skylines cannot invade a
          // neighbouring district (e.g. Manhattan bleeding into the White House).
          const dOwn = Math.hypot(bx - p.x, bz - p.z);
          let blocked = false;
          for (const c of this.cityCores) {
            if (c.id === city.id) continue;
            if (Math.hypot(bx - c.x, bz - c.z) < dOwn + 8) { blocked = true; break; }
          }
          if (blocked) continue;
          const bw = Math.min(cellW * (0.3 + r() * 0.34), 18);
          const bd = Math.min(cellD * (0.3 + r() * 0.34), 18);
          let bh = 5 + r() * maxH;
          if (isDC) bh = 4 + r() * 7;
          else if (tier === 1) bh *= 0.45 + (1 - Math.min(1, dist / (w * 0.7))) * 0.9;
          if (!isDC && r() < 0.1) bh *= 1.5;
          bh = Math.max(4, bh);
          // Don't let a neighbouring compressed metropolis put skyscrapers on
          // top of the capital's monuments.
          if (!isDC) {
            const dDC = Math.hypot(bx - dcCore.x, bz - dcCore.z);
            if (dDC < 135) bh = Math.min(bh, 13 + Math.max(0, dDC - 65) * 0.18);
          }
          const style = r() < 0.3 ? 'glass' : r() < 0.6 ? 'stone' : 'brick';
          styles[style].push({ x: bx, z: bz, w: bw, h: bh, d: bd, tint: 0.78 + r() * 0.34 });
          this.addCollider(bx, bz, Math.max(bw, bd) * 0.52);
        }
      }
    }
    for (const [style, list] of Object.entries(styles)) {
      if (!list.length) continue;
      const ft = facadeTexture(style);
      const material = new THREE.MeshStandardMaterial({ map: ft.map, emissiveMap: ft.emissive, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: style === 'glass' ? 0.3 : 0.82, metalness: style === 'glass' ? 0.45 : 0.06 });
      this.facadeMats.push(material);
      const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
      const mesh = new THREE.InstancedMesh(geo, material, list.length);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const dummy = new THREE.Object3D();
      list.forEach((b, i) => {
        dummy.position.set(b.x, y + 0.16, b.z); dummy.scale.set(b.w, b.h, b.d); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, new THREE.Color(b.tint, b.tint, b.tint));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.root.add(mesh);
    }

    // roadside parked / drivable cars
    if (city.id !== 'dc' && tier <= 2) {
      const heading = r() * Math.PI * 2;
      const car = createCar(['#1a1f2b', '#6b1d24', '#c9c5b8', '#283d55'][Math.floor(r() * 4)]);
      car.position.set(p.x + (r() - 0.5) * 40, y + 0.32, p.z + (r() - 0.5) * 40);
      car.rotation.y = heading; car.castShadow = true;
      car.userData.vehicle = { id: 'car-' + city.id, type: 'car', label: 'Enter vehicle' };
      this.root.add(car); this.vehicles.push(car);
    }
    if (city.id === 'la' || city.id === 'nyc' || city.id === 'miami') {
      const heli = createHelicopter();
      heli.position.set(p.x + w * 0.36, y + 0.3, p.z + d * 0.34); heli.rotation.y = 0.7;
      heli.userData.vehicle = { id: 'heli-' + city.id, type: 'heli', label: 'Board helicopter' };
      this.root.add(heli); this.vehicles.push(heli);
    }

    // label
    const labelTex = textSprite(city.name.toUpperCase(), { w: 512, h: 128, font: '600 54px "Barlow Condensed"', sub: city.pop + ' · ' + city.state, subColor: '#e7d9ad', color: '#f4efe4' });
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false, depthTest: true, opacity: 0.88, fog: true }));
    sprite.position.set(p.x, y + (tier === 1 ? 84 : 64), p.z);
    sprite.scale.set(tier === 1 ? 46 : 38, tier === 1 ? 11.5 : 9.5, 1);
    this.root.add(sprite); this.cityLabels.push(sprite);
  }

  _buildWashington() {
    const p = project(-77.04, 38.90);
    const y = this.terrain.cityY.dc;
    const whX = p.x, whZ = p.z + 16;
    buildWhiteHouse(this.root, whX, y + 0.16, whZ, (x, z, r) => this.addCollider(x, z, r));
    // monument
    const mx = p.x - 6, mz = p.z - 24;
    this.root.add(cyl(1.4, 2.4, 62, 4, '#d8d2c2', mx, y + 31, mz, { roughness: 0.55, metalness: 0.1 }));
    this.root.add(cone(1.9, 5, 4, '#e2dccb', mx, y + 64.5, mz));
    this.root.add(cyl(0.16, 0.5, 6, 6, '#c8a24a', mx, y + 70, mz, { metalness: 0.7 }));
    this.addCollider(mx, mz, 6);
    // reflecting pool
    const pool = box(18, 0.25, 58, '#2f6b82', p.x - 6, y + 0.24, p.z - 56);
    pool.material = new THREE.MeshStandardMaterial({ color: '#2f6b82', roughness: 0.18, metalness: 0.4 });
    this.root.add(pool);
    // Lincoln
    const lx = p.x - 6, lz = p.z - 90;
    this.root.add(box(26, 9, 16, '#e8e2d4', lx, y + 4.5, lz));
    for (let i = 0; i < 6; i++) this.root.add(cyl(0.45, 0.5, 8, 10, '#f2eee4', lx - 10 + i * 4, y + 4.3, lz + 9));
    this.root.add(box(28, 1.2, 18, '#d8d2c2', lx, y + 9.6, lz));
    this.addCollider(lx, lz, 16);
    // Capitol
    const cx = p.x + 58, cz = p.z - 12;
    this.root.add(box(42, 8, 24, '#e8e2d4', cx, y + 4, cz));
    this.root.add(box(30, 7, 20, '#f0ebe0', cx, y + 11.5, cz));
    const drum = cyl(10, 11, 9, 20, '#e8e2d4', cx, y + 19, cz); this.root.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e8e2d4', { roughness: 0.6 }));
    dome.position.set(cx, y + 23.5, cz); dome.scale.y = 1.25; this.root.add(dome);
    this.root.add(cyl(1.1, 1.1, 7, 8, '#e8e2d4', cx, y + 37, cz));
    this.root.add(cyl(0.15, 0.15, 5, 5, '#c8a24a', cx, y + 43, cz));
    for (let i = 0; i < 8; i++) this.root.add(cyl(0.5, 0.55, 7, 8, '#f2eee4', cx - 14 + i * 4, y + 4, cz + 13));
    this.addCollider(cx, cz, 30);
    // Treasury / federal buildings around mall
    for (const [bx, bz, bw, bh, bd] of [[-58, 8, 30, 16, 22], [-58, -22, 26, 14, 18], [62, 22, 24, 18, 20], [88, -4, 20, 22, 22]]) {
      this.root.add(box(bw, bh, bd, '#cfc7b5', p.x + bx, y + bh / 2, p.z + bz));
      for (let i = 0; i < 5; i++) this.root.add(cyl(0.35, 0.4, bh * 0.6, 8, '#e8e2d4', p.x + bx - bw / 2 + 3 + i * (bw - 6) / 4, y + bh * 0.3, p.z + bz + bd / 2 + 0.3));
      this.addCollider(p.x + bx, p.z + bz, Math.max(bw, bd) * 0.55);
    }
    // White House drive / fountain
    const fountain = cyl(5.2, 5.6, 0.8, 20, '#cfc7b5', whX, y + 0.5, whZ + 32);
    this.root.add(fountain);
    const water = cyl(4.6, 4.6, 0.78, 20, '#2f6b82', whX, y + 0.62, whZ + 32);
    water.material = new THREE.MeshStandardMaterial({ color: '#2f6b82', roughness: 0.12, metalness: 0.5 });
    this.root.add(water);
    this.root.add(cyl(0.2, 0.5, 4, 8, '#9ecad6', whX, y + 2.2, whZ + 32, { transparent: true, opacity: 0.7 }));
    // mall trees
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const tx = p.x - 6 + side * 22, tz = p.z - 28 - Math.floor(i / 2) * 7;
      const trunk = cyl(0.22, 0.34, 2.4, 5, '#4a3526', tx, y + 1.2, tz); this.root.add(trunk);
      this.root.add(sphere(2.2, '#3f6b40', tx, y + 3.6, tz, { seg: 6, seg2: 5, flat: true }));
    }
    // The Beast
    const beast = createCar('#0c1018', { presidential: true });
    beast.position.set(whX + 19, y + 0.18, whZ + 18); beast.rotation.y = Math.PI / 2;
    beast.userData.vehicle = { id: 'beast', type: 'car', label: 'Board The Beast' };
    this.root.add(beast); this.vehicles.push(beast);
    // Marine One
    const heli = createHelicopter();
    heli.position.set(whX - 22, y + 0.18, whZ + 20); heli.rotation.y = 0.55;
    heli.userData.vehicle = { id: 'marine-one', type: 'heli', label: 'Board Marine One' };
    this.root.add(heli); this.vehicles.push(heli);
    // doors
    this.addInteractable({ id: 'white-house', label: 'Enter the White House', x: whX, z: whZ + 17.5, r: 3.2, action: 'interior' });
    this.addInteractable({ id: 'beast-interact', label: 'Board The Beast', x: whX + 19, z: whZ + 18, r: 5.2, action: 'vehicle', vehicle: beast });
    this.addInteractable({ id: 'marine-one-interact', label: 'Board Marine One', x: whX - 22, z: whZ + 20, r: 5.2, action: 'vehicle', vehicle: heli });
    // press corps figures
    for (let i = 0; i < 6; i++) {
      const a = createAgent(i % 2);
      a.position.set(p.x - 8 + i * 3.2, y + 0.16, whZ + 42);
      a.rotation.y = Math.PI;
      a.scale.setScalar(0.95);
      this.root.add(a);
    }
  }

  _buildAndrews() {
    const p = project(-77.04, 38.90);
    const x = p.x + 94, z = p.z + 76;
    const y = this.terrain.sample(x, z);
    const runway = box(110, 0.3, 26, '#26292d', x, y + 0.18, z + 6);
    runway.material = new THREE.MeshStandardMaterial({ color: '#26292d', roughness: 0.95 });
    this.root.add(runway);
    for (let i = 0; i < 12; i++) this.root.add(box(4, 0.05, 0.4, '#e8e2d4', x - 44 + i * 8, y + 0.35, z + 6));
    const plane = createPlane();
    plane.position.set(x, y + 0.15, z + 6); plane.rotation.y = -Math.PI / 2;
    this.root.add(plane);
    this.addCollider(x, z + 6, 16);
    this.af1 = plane;
    this.addInteractable({ id: 'af1', label: 'Board Air Force One', x, z: z + 6, r: 21, action: 'travel' });
    const hangar = box(30, 16, 22, '#7c8486', x - 45, y + 8, z - 20);
    this.root.add(hangar);
    this.addCollider(x - 45, z - 20, 18);
  }

  // ------------------------------------------------------------ stage
  _buildStageStatic() {
    // permanent ocean/atmosphere handled elsewhere; the stage is rebuilt on travel
  }

  buildStage(countryId) {
    const meta = COUNTRIES.find(c => c.id === countryId);
    if (!meta) return false;
    const style = WORLD_CAPITALS[countryId] || {
      style: 'generic',
      label: meta.capital.toUpperCase(),
      landmark: 'Government district & embassy',
      palette: ['#c9bda4', '#7e8b8f', '#b3202f'],
    };
    for (const child of [...this.stage.children]) {
      child.traverse(o => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });
      this.stage.remove(child);
    }
    this.stageInteracts = [];
    this.stageCountry = countryId;
    const S = { x: 3200, z: 1500 };
    const g = this.stage;
    g.add(cyl(128, 138, 3.4, 48, '#c8b489', S.x, 0.02, S.z));
    const grass = new THREE.Mesh(new THREE.CircleGeometry(126, 48), mat('#6f8f4f', { roughness: 0.95 }));
    grass.rotation.x = -Math.PI / 2; grass.position.set(S.x, 1.72, S.z); grass.receiveShadow = true; g.add(grass);
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(160, 150), new THREE.MeshStandardMaterial({ map: padTexture(77, 6, false), roughness: 0.9 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(S.x, 1.76, S.z); plaza.receiveShadow = true; g.add(plaza);
    const carpet = box(10, 0.08, 76, '#8f1f2c', S.x, 1.84, S.z + 26, { material: mat('#8f1f2c', { roughness: 0.9 }) });
    g.add(carpet);
    // embassy
    const ex = S.x - 46, ez = S.z + 22;
    g.add(box(30, 13, 18, '#ddd6c6', ex, 8.3, ez));
    for (let i = 0; i < 6; i++) g.add(cyl(0.42, 0.48, 10, 10, '#f0ebe0', ex - 10 + i * 4, 8, ez + 9.2));
    g.add(box(32, 1.4, 20, '#c8bda4', ex, 15.1, ez));
    addFlag(g, countryFlagTexture(countryId, meta.flag), ex + 11, 17.5, ez - 4, 4.2, 2.7, 10);
    this.addCollider(ex, ez, 18);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshBasicMaterial({ map: signTexture('EMBASSY OF ' + meta.name.toUpperCase(), '#0e1b2d', '#e7d9ad', '#c8a24a'), transparent: true }));
    sign.position.set(ex, 9.4, ez + 9.3); g.add(sign);
    // landmark
    buildCapitalLandmark(style.style, style.palette, S.x + 12, 1.82, S.z - 30, (x, z, r) => this.addCollider(x, z, r), g);
    // leader podium
    const lx = S.x, lz = S.z - 14;
    g.add(box(10, 1.6, 5, '#2a2f38', lx, 2.56, lz));
    g.add(box(9.6, 0.15, 0.3, '#c8a24a', lx, 3.4, lz - 2.4));
    this.addCollider(lx, lz, 5.2);
    const leader = createLeader(style.palette[1]);
    leader.position.set(lx, 1.82, lz - 2.4); leader.rotation.y = Math.PI;
    g.add(leader);
    this.stageLeader = leader;
    // honor guards
    for (const [dx, dz] of [[-8, 42], [8, 42], [-8, 34], [8, 34]]) {
      const guard = createHonorGuard(); guard.position.set(S.x + dx, 1.82, S.z + dz); guard.rotation.y = Math.PI; g.add(guard);
    }
    // flags along carpet
    for (let i = 0; i < 6; i++) {
      const fx = S.x - 18 + (i % 2) * 36, fz = S.z + 8 + Math.floor(i / 2) * 20;
      addFlag(g, countryFlagTexture(countryId, meta.flag), fx, 7, fz, 3.8, 2.4, 8);
    }
    // locals + palms
    for (let i = 0; i < 5; i++) {
      const a = createAgent(i % 2); a.position.set(S.x - 60 + i * 28, 1.82, S.z + 56); a.rotation.y = Math.random() * 6.28; g.add(a);
    }
    for (let i = 0; i < 8; i++) {
      const tx = S.x - 100 + i * 28, tz = S.z - 58 + (i % 2) * 10;
      const trunk = cyl(0.22, 0.34, 7, 6, '#6b5236', tx, 5.2, tz); g.add(trunk);
      g.add(sphere(3.4, '#3f6b40', tx, 9.2, tz, { seg: 6, seg2: 4, flat: true }));
    }
    // return runway / plane
    const rx = S.x + 82, rz = S.z + 74;
    g.add(box(60, 0.25, 18, '#26292d', rx, 1.86, rz));
    const plane = createPlane(); plane.scale.setScalar(0.55); plane.position.set(rx, 1.9, rz); plane.rotation.y = -Math.PI / 2.4; g.add(plane);
    this.addCollider(rx, rz, 7);
    // welcome sign
    const welcome = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), new THREE.MeshBasicMaterial({ map: textSprite(style.label + ' · ' + meta.name.toUpperCase(), { w: 1024, h: 160, font: '600 70px "Cormorant Garamond"', sub: 'STATE VISIT', subColor: '#e7d9ad' }), transparent: true }));
    welcome.position.set(S.x, 12, S.z + 58); g.add(welcome);
    this.stageInteracts = [
      { id: 'stage-leader', label: 'Meet with ' + meta.leader, x: lx, z: lz + 5, r: 5.5, action: 'summit', country: countryId },
      { id: 'stage-return', label: 'Return to Washington', x: rx, z: rz, r: 9, action: 'return' },
    ];
    this.stageLight.position.set(S.x, 22, S.z);
    this.stageLight.intensity = 0;
    return true;
  }

  _buildInteriorDetails() {
    const a = createAgent(0);
    a.position.set(6000 + 5.5, 0, 6000 + 6.6); a.rotation.y = 2.6; this.scene.add(a);
    this.interiorAgent = a;
  }

  _buildStars() {}

  _buildClouds() {}

  _buildTraffic() {
    const ids = ['dc', 'nyc', 'chi', 'la', 'mia', 'hou', 'sea', 'den'];
    for (const id of ids) {
      const cd = this.cityData[id];
      if (!cd) continue;
      for (let k = 0; k < (id === 'dc' ? 3 : 1); k++) {
        const g = new THREE.Group();
        const col = ['#1c2430', '#8b8f90', '#5a2a2a', '#c9c5b8', '#233b55'][Math.floor(Math.random() * 5)];
        g.add(box(3.6, 0.8, 1.7, col, 0, 0.75, 0));
        g.add(box(1.9, 0.65, 1.5, '#1a2430', -0.15, 1.4, 0));
        for (const [x, z] of [[-1.25, 0.85], [1.25, 0.85], [-1.25, -0.85], [1.25, -0.85]]) { const w = cyl(0.34, 0.34, 0.3, 8, '#111'); w.rotation.z = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w); }
        g.position.set(cd.x, cd.y + 0.25, cd.z);
        this.root.add(g);
        this.traffic.push({ group: g, cx: cd.x, cz: cd.z, rx: 32 + Math.random() * 30, rz: 26 + Math.random() * 24, phase: Math.random() * 6.28, speed: 0.18 + Math.random() * 0.22, dir: Math.random() > 0.5 ? 1 : -1, y: cd.y + 0.25 });
      }
    }
  }

  _buildProtests() {
    this.crowd = createCrowd();
    const p = project(-77.04, 38.90);
    this.crowd.group.position.set(p.x, this.terrain.cityY.dc + 0.2, p.z + 54);
    this.crowd.group.rotation.y = Math.PI;
    this.root.add(this.crowd.group);
  }

  _buildDetail() {
    const offsets = [[-3.1, -2.6], [3.1, -2.6], [-1.2, -4.4]];
    for (const [dx, dz] of offsets) {
      const a = createAgent(Math.random() > 0.5 ? 1 : 0);
      this.root.add(a);
      this.detail.push({ mesh: a, dx, dz });
    }
  }

  _buildCityLights() {
    const positions = [];
    for (const id of Object.keys(this.cityData)) {
      const cd = this.cityData[id];
      const n = cd.tier === 1 ? 80 : 45;
      for (let i = 0; i < n; i++) {
        positions.push(cd.x + (Math.random() - 0.5) * 150, cd.y + 3.5 + Math.random() * 25, cd.z + (Math.random() - 0.5) * 130);
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({ color: '#ffd98a', size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTexture() });
    this.cityLights = new THREE.Points(geo, m); this.root.add(this.cityLights);
  }

  // ------------------------------------------------------------ interactions
  vehicleNear(x, z, radius = 5) {
    let best = null, bd = radius;
    for (const v of this.vehicles) {
      const d = Math.hypot(x - v.position.x, z - v.position.z);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }

  // ------------------------------------------------------------ travel
  setMode(mode, countryId = null) {
    this.mode = mode;
    this.interior.group.visible = mode === 'interior';
    this.interiorAgent.visible = mode === 'interior';
    this.stage.visible = mode === 'stage';
    this.stageLight.intensity = mode === 'stage' ? 2.2 : 0;
    if (mode === 'stage') this.buildStage(countryId);
  }

  // ------------------------------------------------------------ update
  update(dt, elapsed, camera, playerPos, mode, playerHeading = 0) {
    this.time = elapsed;
    const st = this.sim.state;
    const hour = st.clock % 24;
    // sky interpolation
    let k0 = SKY_KEYS[0], k1 = SKY_KEYS[1];
    for (let i = 0; i < SKY_KEYS.length - 1; i++) { if (hour >= SKY_KEYS[i].h && hour <= SKY_KEYS[i + 1].h) { k0 = SKY_KEYS[i]; k1 = SKY_KEYS[i + 1]; break; } }
    const t = clamp((hour - k0.h) / Math.max(0.001, k1.h - k0.h), 0, 1);
    const ctop = new THREE.Color(k0.top).lerp(new THREE.Color(k1.top), t);
    const cbot = new THREE.Color(k0.bot).lerp(new THREE.Color(k1.bot), t);
    const csun = new THREE.Color(k0.sun).lerp(new THREE.Color(k1.sun), t);
    const hem = lerp(k0.hemi, k1.hemi, t), di = lerp(k0.dir, k1.dir, t);
    this.skyUniforms.top.value.copy(ctop); this.skyUniforms.bottom.value.copy(cbot); this.skyUniforms.sunColor.value.copy(csun);
    const az = (hour - 6) / 12 * Math.PI;
    const sunY = Math.sin(az) * 0.92;
    this.sunDir = new THREE.Vector3(Math.cos(az) * 0.75, sunY, 0.42).normalize();
    if (this.sunDir.y < -0.15) this.sunDir.y = -0.15;
    this.skyUniforms.sunDir.value.copy(this.sunDir);
    const night = 1 - smooth(-0.04, 0.18, this.sunDir.y);
    const interior = mode === 'interior';
    this.scene.fog.color.copy(new THREE.Color(k0.fog).lerp(new THREE.Color(k1.fog), t));
    this.scene.fog.density = interior ? 0.003 : 0.0017;

    this.hemi.color.copy(ctop).lerp(new THREE.Color('#ffffff'), 0.4);
    this.hemi.groundColor.set(night > 0.5 ? '#181c22' : '#4a4234');
    this.hemi.intensity = interior ? 0.6 : hem;
    this.ambient.intensity = interior ? 0.55 : lerp(0.18, 0.3, night);
    this.dir.intensity = interior ? 0.26 : di;
    this.dir.color.copy(csun);
    const lp = playerPos;
    const ld = this.sunDir;
    this.dir.position.set(lp.x + ld.x * 280, lp.y + Math.max(40, ld.y * 280), lp.z + ld.z * 280);
    this.dir.target.position.set(lp.x, lp.y, lp.z);
    this.dir.target.updateMatrixWorld();

    // sun sprite
    this.sunSprite.position.set(camera.position.x + this.sunDir.x * 5200, camera.position.y + this.sunDir.y * 5200, camera.position.z + this.sunDir.z * 5200);
    this.sunSprite.material.opacity = clamp(this.sunDir.y * 2.2, 0, 0.95);
    this.sunSprite.material.color.copy(csun);
    this.sky.position.copy(camera.position);
    this.stars.position.copy(camera.position);
    this.stars.material.opacity = night * 0.9;

    // water
    this.waterUniforms.time.value = elapsed;
    this.waterUniforms.sunDir.value.copy(this.sunDir);
    this.waterUniforms.sunColor.value.copy(csun);
    this.waterUniforms.deep.value.set(night > 0.5 ? '#081a27' : '#173f54');
    this.waterUniforms.shallow.value.set(night > 0.5 ? '#123244' : '#327788');
    this.waterUniforms.fogColor.value.copy(this.scene.fog.color);
    this.waterUniforms.fogDensity.value = this.scene.fog.density;

    // clouds
    for (const c of this.clouds) {
      c.position.x += dt * c.userData.speed;
      if (c.position.x > 620) c.position.x = -620;
      c.material.opacity = (0.16 + (1 - night) * 0.32);
      c.material.color.copy(new THREE.Color(k0.cloud).lerp(new THREE.Color(k1.cloud), t));
    }
    // emissive windows
    for (const m of this.facadeMats) m.emissiveIntensity = night * 1.25;
    if (this.cityLights) this.cityLights.material.opacity = night * 0.9;
    if (this.interiorLight) this.interiorLight.intensity = interior ? 2.6 : 0;

    // traffic
    for (const tr of this.traffic) {
      const a = elapsed * tr.speed * tr.dir + tr.phase;
      tr.group.position.set(tr.cx + Math.cos(a) * tr.rx, tr.y, tr.cz + Math.sin(a) * tr.rz);
      tr.group.rotation.y = -a + (tr.dir > 0 ? Math.PI : 0);
    }
    // crowd
    const protests = this.sim.state.protests;
    this.crowd.group.visible = protests > 3;
    if (protests > 3) this.crowd.update(elapsed, clamp(protests / 60, 0.02, 1));

    // secret service detail
    if (mode === 'usa') {
      const ang = playerHeading;
      const px = playerPos.x, pz = playerPos.z;
      for (const d of this.detail) {
        const rx = d.dx * Math.cos(ang) - d.dz * Math.sin(ang);
        const rz = d.dx * Math.sin(ang) + d.dz * Math.cos(ang);
        const tx = px + rx, tz = pz + rz;
        d.mesh.position.x = lerp(d.mesh.position.x, tx, 1 - Math.pow(0.001, dt));
        d.mesh.position.z = lerp(d.mesh.position.z, tz, 1 - Math.pow(0.001, dt));
        d.mesh.position.y = this.heightAt(d.mesh.position.x, d.mesh.position.z) + 0.18;
        d.mesh.rotation.y = Math.atan2(tx - d.mesh.position.x || 0.001, tz - d.mesh.position.z || 0.001);
      }
    }
    const detailsVisible = mode === 'usa';
    for (const d of this.detail) d.mesh.visible = detailsVisible;

    // city labels distance fade
    for (const l of this.cityLabels) {
      const d = Math.hypot(l.position.x - camera.position.x, l.position.z - camera.position.z);
      l.material.opacity = clamp(1 - (d - 300) / 500, 0, 0.9);
      l.visible = d < 800;
    }
    // leader idle
    if (this.stageLeader) this.stageLeader.rotation.y = Math.PI + Math.sin(elapsed * 0.6) * 0.08;
  }
}
