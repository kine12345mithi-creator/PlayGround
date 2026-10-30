// ---------------------------------------------------------------------------
// Geometry, projection and procedural terrain
// ---------------------------------------------------------------------------
import { project, CITIES } from './data.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function hash2(ix, iz) {
  let h = ix * 374761393 + iz * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return (a * (1 - ux) + b * ux) * (1 - uz) + (c * (1 - ux) + d * ux) * uz;
}

export function fbm(x, z, oct = 4) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += noise2(x * f, z * f) * amp; f *= 2.03; amp *= 0.5; }
  return v;
}

export function pointInRing(x, z, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], zi = ring[i][1], xj = ring[j][0], zj = ring[j][1];
    if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) inside = !inside;
  }
  return inside;
}

export function distToRing(x, z, ring) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const ax = ring[j][0], az = ring[j][1], bx = ring[i][0], bz = ring[i][1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t - x, pz = az + dz * t - z;
    const d = px * px + pz * pz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function polylineDist(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t - x, pz = az + dz * t - z;
    const d = px * px + pz * pz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

const ROCKIES = [[-114.2, 48.6], [-113.5, 45.5], [-111.5, 42.5], [-109.2, 39.4], [-106.4, 36.2], [-105.6, 33.2], [-106.3, 31.8]];
const SIERRA = [[-122.3, 48.5], [-121.4, 44.5], [-120.1, 41.0], [-118.6, 38.0], [-117.4, 35.8]];
const APPALACHIA = [[-79.5, 41.5], [-79.0, 38.5], [-81.4, 35.8], [-84.2, 33.6], [-86.6, 32.8]];

export class Terrain {
  constructor(usaRingLonLat, width = 248, height = 132) {
    this.ringLL = usaRingLonLat;
    this.ring = usaRingLonLat.map(([lon, lat]) => { const p = project(lon, lat); return [p.x, p.z]; });
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [x, z] of this.ring) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    const pad = 14;
    this.bounds = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
    this.w = width; this.h = height;
    this.gw = width + 1; this.gh = height + 1;
    this.dx = (this.bounds.maxX - this.bounds.minX) / width;
    this.dz = (this.bounds.maxZ - this.bounds.minZ) / height;
    this.heights = new Float32Array(this.gw * this.gh);
    this.ridgeCache = {};
    this._build();
    this.cityY = {};
    for (const city of CITIES) {
      const p = project(city.lon, city.lat);
      this.cityY[city.id] = this.sample(p.x, p.z);
    }
  }

  rawHeight(x, z) {
    const inside = pointInRing(x, z, this.ring);
    if (!inside) return -6.5 + fbm(x * 0.02, z * 0.02, 2) * 0.5;
    const d = distToRing(x, z, this.ring);
    const coast = smooth(0, 14, d);
    let h = 1.1 + fbm(x * 0.022 + 20, z * 0.022 - 8, 4) * 3.4 + fbm(x * 0.09, z * 0.09, 2) * 0.45;
    const rock = polylineDist(x, z, ROCKIES.map(([lo, la]) => { const p = project(lo, la); return [p.x, p.z]; }));
    const sierra = polylineDist(x, z, SIERRA.map(([lo, la]) => { const p = project(lo, la); return [p.x, p.z]; }));
    const app = polylineDist(x, z, APPALACHIA.map(([lo, la]) => { const p = project(lo, la); return [p.x, p.z]; }));
    const rough = 0.55 + fbm(x * 0.06 + 6, z * 0.06 + 3, 3) * 0.9;
    h += Math.exp(-Math.pow(rock / 34, 2)) * 25 * rough;
    h += Math.exp(-Math.pow(sierra / 18, 2)) * 15 * rough;
    h += Math.exp(-Math.pow(app / 24, 2)) * 7.5 * rough;
    h *= coast;
    return h - 0.35;
  }

  _build() {
    const { gw, gh, heights, bounds, w, h } = this;
    for (let iz = 0; iz < gh; iz++) {
      for (let ix = 0; ix < gw; ix++) {
        const x = bounds.minX + (ix / w) * (bounds.maxX - bounds.minX);
        const z = bounds.minZ + (iz / h) * (bounds.maxZ - bounds.minZ);
        heights[iz * gw + ix] = this.rawHeight(x, z);
      }
    }
    // flatten city pads
    for (const city of CITIES) {
      const p = project(city.lon, city.lat);
      let cityH = this.sampleRaw(p.x, p.z);
      if (city.id === 'hnl') cityH = 1.6;
      cityH = Math.max(cityH, city.tier === 1 ? 2.6 : 2.0);
      const R = city.id === 'dc' ? 120 : city.tier === 1 ? 82 : 65;
      const inner = R * 0.52;
      for (let iz = 0; iz < gh; iz++) {
        const z = bounds.minZ + (iz / h) * (bounds.maxZ - bounds.minZ);
        if (Math.abs(z - p.z) > R) continue;
        for (let ix = 0; ix < gw; ix++) {
          const x = bounds.minX + (ix / w) * (bounds.maxX - bounds.minX);
          const d = Math.hypot(x - p.x, z - p.z);
          if (d > R) continue;
          const t = 1 - smooth(inner, R, d);
          const idx = iz * gw + ix;
          if (heights[idx] > -2) heights[idx] = heights[idx] * (1 - t * 0.96) + cityH * (t * 0.96);
        }
      }
    }
  }

  sampleRaw(x, z) { return this.rawHeight(x, z); }

  sample(x, z) {
    const { bounds, dx, dz, gw, gh, heights } = this;
    const fx = clamp((x - bounds.minX) / dx, 0, gw - 1.001);
    const fz = clamp((z - bounds.minZ) / dz, 0, gh - 1.001);
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const tx = fx - ix, tz = fz - iz;
    const a = heights[iz * gw + ix], b = heights[iz * gw + ix + 1];
    const c = heights[(iz + 1) * gw + ix], d = heights[(iz + 1) * gw + ix + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }

  isLand(x, z) { return this.sample(x, z) > 0.35; }
  isWater(x, z) { return this.sample(x, z) < 0.2; }

  cityCenter(id) {
    const c = CITIES.find(c => c.id === id);
    const p = project(c.lon, c.lat);
    return { x: p.x, z: p.z, y: this.sample(p.x, p.z) };
  }
}

export async function loadGeo() {
  const [world, usa] = await Promise.all([
    fetch('data/world.geo.json').then(r => r.json()),
    fetch('data/usa.geo.json').then(r => r.json()),
  ]);
  return { world, usa };
}
