// ---------------------------------------------------------------------------
// THE OVAL — bootstrap, render loop, title cinematic, audio
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { loadGeo, Terrain } from './geo.js';
import { Sim } from './state.js';
import { World } from './world.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { COUNTRIES } from './data.js';

const canvas = document.getElementById('scene');
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor('#081321', 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#b9d5e4', 0.0017);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.35, 10000);
camera.position.set(257, 12, 44);

let sim = null;
let terrain = null;
let world = null;
let player = null;
let ui = null;

let started = false;
let elapsed = 0;
let titleAngle = 0.4;
let lastPromptKey = '';
let sound = null;

const $ = id => document.getElementById(id);

function setLoad(progress, text) {
  const bar = $('loadBar');
  if (bar) bar.style.width = Math.max(4, Math.min(100, progress)) + '%';
  if (text) { const el = $('loadText'); if (el) el.textContent = text; }
}

function hideLoading() {
  const el = $('loading');
  if (!el) return;
  el.classList.add('out');
  setTimeout(() => el.classList.add('hidden'), 620);
}

function showBootError(err) {
  console.error(err);
  const el = $('loadText');
  if (el) {
    el.innerHTML = 'THE WORLD FAILED TO LOAD<br /><span style="opacity:.65;font-size:9px;letter-spacing:.12em">' +
      String(err && err.message ? err.message : err).replace(/[<>&]/g, '') + '</span>';
  }
  setLoad(100);
}

// ---------------------------------------------------------------- audio
function audioToggle() {
  try {
    if (!sound) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      // low, wide wind bed
      const len = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = last * 0.985 + white * 0.015;
        data[i] = last * 3.2;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer; noise.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.4;
      const ng = ctx.createGain(); ng.gain.value = 0.5;
      noise.connect(lp).connect(ng).connect(master);

      // distant room tone
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 55;
      const og = ctx.createGain(); og.gain.value = 0.055;
      osc.connect(og).connect(master);

      noise.start(); osc.start();
      sound = { ctx, master, on: false };
    }
    if (sound.ctx.state === 'suspended') sound.ctx.resume();
    sound.on = !sound.on;
    sound.master.gain.setTargetAtTime(sound.on ? 0.055 : 0, sound.ctx.currentTime, 0.7);
    return sound.on;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- title camera
function titleCamera(dt) {
  const target = new THREE.Vector3(257, 7, 1.6);
  titleAngle += dt * 0.05;
  const r = 47;
  const x = target.x + Math.sin(titleAngle) * r;
  const z = target.z + Math.cos(titleAngle) * r;
  const y = 26 + Math.sin(titleAngle * 0.7) * 3;
  camera.position.x += (x - camera.position.x) * Math.min(1, dt * 0.9);
  camera.position.y += (y - camera.position.y) * Math.min(1, dt * 0.9);
  camera.position.z += (z - camera.position.z) * Math.min(1, dt * 0.9);
  camera.lookAt(target.x, target.y + 3, target.z);
  camera.fov += (57 - camera.fov) * Math.min(1, dt * 1.2);
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------- wiring
function buildWorld(geo) {
  const ring = geo.usa && geo.usa.coordinates ? geo.usa.coordinates[0] : null;
  if (!ring || ring.length < 3) throw new Error('The United States geometry is unavailable.');
  terrain = new Terrain(ring, 248, 132);

  sim = new Sim();
  setLoad(58, 'DRAWING THE CONTINENT…');
  world = new World(scene, terrain, sim, renderer);

  setLoad(82, 'STAFFING THE WEST WING…');
  player = new Player(scene, camera, world, sim, renderer);

  ui = new UI(sim, player, world, {    onStart: () => {
      started = true;
      hideLoading();
      $('startScreen')?.classList.add('hidden');
      lastPromptKey = '';
    },
    onRestart: () => {
      $('gameOver')?.classList.add('hidden');
      ui.started = false;
      ui.closeAll();
      sim.reset();
      ui.start(false);
    },
    onTitle: () => {
      started = false;
      titleAngle = 0.4;
      lastPromptKey = '';
      hideLoading();
    },
    onSound: audioToggle,
  });

  if (sim.hasSave()) $('continueBtn')?.classList.remove('hidden');
  player.onAction = handlePlayerAction;
  window.__OVAL = { sim, world, player, ui, camera, scene, renderer, THREE };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('keydown', e => {
    if (!started) return;
    if (e.key === 'Escape' && ui) ui.escape();
    if (e.key.toLowerCase() === 'h' && ui) ui.openHelp();
    if (e.key.toLowerCase() === 'i' && ui) ui.openInbox();
  });

  window.addEventListener('error', e => {
    console.error('[THE OVAL]', e.message);
  });
}

// ---------------------------------------------------------------- player action bridge
function handlePlayerAction(a) {
  if (!a || !ui) return;
  switch (a.type) {
    case 'dashboard': ui.closeAll(); ui.openDashboard('nation'); break;
    case 'map': ui.closeAll(); ui.openMap(); break;
    case 'travel': ui.closeAll(); ui.openTravel(); break;
    case 'summit': {
      const meta = COUNTRIES.find(c => c.id === a.country);
      if (meta) {
        ui.dashCountry = meta.id;
        ui.closeAll();
        ui.openDashboard('diplomacy');
        ui.toast('Bilateral channel open', `The ${meta.name} delegation is seated across from you.`, 'good');
      }
      break;
    }
    case 'escape': ui.escape(); break;
    case 'interior':
      ui.toast('The Oval Office', 'The Resolute Desk holds the business of the republic. Walk to it and press E.', 'neutral');
      break;
    case 'exitInterior':
    case 'returnDC':
      ui.closeAll();
      break;
    case 'enterVehicle':
      ui.toast(a.kind === 'heli' ? 'Marine One' : 'The Beast', a.kind === 'heli' ? 'Throttle with the stick. Ascend and descend with the arrow controls.' : 'Stick controls throttle and steering.', 'neutral');
      break;
    case 'speed':
    case 'altitude':
      break;
    case 'nothing':
      break;
    case 'toast':
      ui.toast(a.title, a.body, a.tone);
      break;
  }
}

// ---------------------------------------------------------------- loop
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (sim) {
    if (started && !sim.state.flags.gameOver) sim.update(dt);
    if (player && player.active) player.update(dt);
    if (world) world.update(dt, elapsed, camera, player ? player.pos : camera.position, player ? player.mode : 'usa', player ? player.heading : 0);

    if (!started) titleCamera(dt);
    else if (player && player.active) {
      const prompt = player.prompt;
      const key = prompt ? prompt.label + '|' + (prompt.action || '') : '';
      if (key !== lastPromptKey) {
        lastPromptKey = key;
        ui.setPrompt(prompt);
      }
    }
  }

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- boot
(async function boot() {
  try {
    setLoad(6, 'ASSEMBLING THE REPUBLIC…');
    const geo = await loadGeo();
    setLoad(24, 'SURVEYING THE STATES…');
    buildWorld(geo);
    setLoad(100, 'THE PRESIDENT IS EXPECTED');
    setTimeout(hideLoading, 380);
    frame();
  } catch (err) {
    showBootError(err);
  }
})();
