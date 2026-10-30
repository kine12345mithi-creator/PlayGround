// ---------------------------------------------------------------------------
// Interface: HUD, world map, Situation Room, events, travel
// ---------------------------------------------------------------------------
import { COUNTRIES, CITIES, POLICIES, OPS, INTEL_MISSIONS, WORLD_CAPITALS } from './data.js';
import { sealTexture, countryFlagTexture } from './textures.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => v >= 1 ? `$${v.toFixed(2)}T` : `$${Math.round(v * 1000)}B`;
const relLabel = r => r >= 85 ? 'IRONCLAD' : r >= 70 ? 'ALLIED' : r >= 55 ? 'FRIENDLY' : r >= 40 ? 'CORDIAL' : r >= 25 ? 'STRAINED' : r >= 10 ? 'HOSTILE' : 'ADVERSARIAL';
const relColor = r => r >= 70 ? '#63b8a6' : r >= 50 ? '#8fc7b3' : r >= 30 ? '#d8b36a' : r >= 15 ? '#d98a5f' : '#d85c5c';

const ALIASES = {
  'United States of America': 'USA', 'Russia': 'RUS', 'South Korea': 'KOR', 'North Korea': 'PRK',
  'United Kingdom': 'GBR', 'United Arab Emirates': 'ARE', 'Saudi Arabia': 'SAU', 'South Africa': 'ZAF',
  'New Zealand': 'NZL', 'Czechia': 'CZE', 'Turkey': 'TUR', 'Iran': 'IRN', 'Taiwan': 'TWN',
  'Venezuela': 'VEN', 'Vietnam': 'VNM', 'Philippines': 'PHL', 'Indonesia': 'IDN', 'Nigeria': 'NGA',
  'Colombia': 'COL', 'Argentina': 'ARG', 'Brazil': 'BRA', 'Mexico': 'MEX', 'Canada': 'CAN',
  'China': 'CHN', 'Japan': 'JPN', 'India': 'IND', 'Pakistan': 'PAK', 'Afghanistan': 'AFG',
  'Iraq': 'IRQ', 'Israel': 'ISR', 'Egypt': 'EGY', 'Ukraine': 'UKR', 'Poland': 'POL',
  'Germany': 'DEU', 'France': 'FRA', 'Italy': 'ITA', 'Spain': 'ESP', 'Sweden': 'SWE',
  'Norway': 'NOR', 'Netherlands': 'NLD', 'Switzerland': 'CHE', 'Hungary': 'HUN', 'Serbia': 'SRB',
  'Georgia': 'GEO', 'Singapore': 'SGP', 'Australia': 'AUS', 'Cuba': 'CUB', 'South Sudan': 'SSD',
};
const NAME_TO_ID = {};
for (const c of COUNTRIES) NAME_TO_ID[c.name] = c.id;
for (const [n, id] of Object.entries(ALIASES)) NAME_TO_ID[n] = id;
const MAJOR_LABELS = ['USA', 'CAN', 'MEX', 'BRA', 'ARG', 'GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'UKR', 'RUS', 'TUR', 'SAU', 'IRN', 'IND', 'CHN', 'JPN', 'KOR', 'AUS', 'ZAF', 'NGA'];

function sparkline(values, color = '#c8a24a', w = 320, h = 54) {
  if (!values || values.length < 2) values = [0, 0.1];
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(0.001, max - min);
  const pts = values.map((v, i) => [i / (values.length - 1) * w, h - 4 - ((v - min) / span) * (h - 10)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
const FLAG_URLS = new Map();
const flagURL = (id, colors) => {
  const key = id || (colors || []).join('');
  if (!FLAG_URLS.has(key)) {
    const tex = countryFlagTexture(id, colors);
    FLAG_URLS.set(key, tex.image.toDataURL());
  }
  return FLAG_URLS.get(key);
};
const flagImg = (id, colors, cls = '') => `<span class="flagimg ${cls}" style="background-image:url(${flagURL(id, colors)})"></span>`;
const flagBars = (id, colors) => `<span class="flagbars">${flagImg(id, colors)}</span>`;

export class UI {
  constructor(sim, player, world, opts = {}) {
    this.sim = sim;
    this.player = player;
    this.world = world;
    this.opts = opts;
    this.touch = (matchMedia('(pointer: coarse)').matches || innerWidth < 900 || 'ontouchstart' in window);
    this.overlay = null;
    this.dashTab = 'nation';
    this.dashCountry = 'RUS';
    this.mapSelected = null;
    this.mapHover = null;
    this.mapView = { scale: 1, x: 0, y: 0 };
    this.mapGeo = null;
    this.holds = new Set();
    this.autoPaused = false;
    this.started = false;
    this.listener = null;
    this.tickerTimer = 0;
    this._bind();
    this._seal();
    this._bindSim();
    this.renderTicker();
    this.updateHUD();
    this.updateMail();
  }

  _seal() {
    try {
      const url = sealTexture().image.toDataURL();
      for (const id of ['sealImg', 'dashSeal', 'startSeal', 'loadSeal']) { const el = document.getElementById(id); if (el) el.src = url; }
    } catch {}
  }

  _bind() {
    const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
    on('btnMap', 'click', () => this.openMap());
    on('btnDashboard', 'click', () => this.openDashboard('nation'));
    on('btnHelp', 'click', () => this.openHelp());
    on('btnMail', 'click', () => this.openInbox());
    on('btnNews', 'click', () => { this.closeAll(); this.openDashboard('media'); });
    on('tutorialClose', 'click', () => { $('#tutorial').classList.add('hidden'); });
    on('startBtn', 'click', () => this.start(false));
    on('continueBtn', 'click', () => this.start(true));
    on('goRestart', 'click', () => this.opts.onRestart?.());
    on('goTitleBtn', 'click', () => this.opts.onTitle?.());
    on('tiltToggle', 'click', async () => {
      const res = await this.player.enableTilt(!this.player.tiltEnabled);
      $('#tiltToggle').textContent = res ? 'ON' : 'OFF';
      $('#tiltToggle').classList.toggle('on', res);
      if (!res) this.toast('Motion access unavailable', 'Tilt controls need device motion permission.', 'bad');
    });
    on('soundToggle', 'click', () => {
      const onNow = this.opts.onSound?.();
      $('#soundToggle').textContent = onNow ? 'ON' : 'OFF';
      $('#soundToggle').classList.toggle('on', onNow);
    });
    on('resetBtn', 'click', () => {
      this.confirm('Reset the simulation?', 'This will erase the current presidency, the world state, and all decisions. It cannot be undone.', 'RESET EVERYTHING', () => {
        this.sim.reset(); this.closeModal(); setTimeout(() => location.reload(), 150);
      }, true);
    });
    for (const btn of $$('.speed-btn')) {
      btn.addEventListener('click', () => {
        const s = Number(btn.dataset.speed);
        this.sim.state.paused = s === 0;
        if (s > 0) this.sim.state.speed = s;
        this.updateHUD();
      });
    }
    for (const btn of $$('[data-close]')) btn.addEventListener('click', () => this.closeAll(btn.dataset.close));
    for (const tab of $$('#dashNav button')) tab.addEventListener('click', () => { this.dashTab = tab.dataset.tab; this.renderDashboard(); });
    $('#dashContent').addEventListener('click', e => this._dashClick(e));
    $('#countryPanel').addEventListener('click', e => this._mapPanelClick(e));
    $('#mapZoomIn').addEventListener('click', () => { this.mapView.scale = clamp(this.mapView.scale * 1.3, 0.8, 5); this.drawMap(); });
    $('#mapZoomOut').addEventListener('click', () => { this.mapView.scale = clamp(this.mapView.scale / 1.3, 0.8, 5); this.drawMap(); });
    $('#mapReset').addEventListener('click', () => { this.mapView = { scale: 1, x: 0, y: 0 }; this.drawMap(); });
    $('#travelSearch').addEventListener('input', () => this.renderTravel());
    for (const p of $$('#partyPills button')) p.addEventListener('click', () => { $$('#partyPills button').forEach(b => b.classList.remove('active')); p.classList.add('active'); });
    this._bindTouch();
    this._bindMapPan();
    this._bindResize();
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.escape();
    });
  }

  _bindResize() { window.addEventListener('resize', () => { if (this.overlay === 'map') this.drawMap(); }); }

  _bindSim() {
    this.sim.on('state', () => this.scheduleUpdate());
    this.sim.on('news', () => { this.renderTicker(); if (this.overlay === 'dash') this.scheduleUpdate(); });
    this.sim.on('toast', t => this.toast(t.title, t.body, t.tone));
    this.sim.on('event', ev => this.showEvent(ev));
    this.sim.on('election', ev => this.showElection(ev));
    this.sim.on('nuclear', () => this.nuclearEffect());
    this.sim.on('gameover', g => this.showGameOver(g));
    this.sim.on('inbox', () => this.updateMail());
  }

  // ------------------------------------------------------------ lifecycle
  start(continueGame) {
    if (this.started) return;
    this.started = true;
    const name = ($('#nameInput')?.value || 'Jordan Hayes').trim().slice(0, 24) || 'Jordan Hayes';
    const party = $('#partyPills .active')?.dataset.party || 'Independent';
    if (continueGame && this.sim.hasSave()) {
      const ok = this.sim.load();
      if (!ok) { this.sim.reset(); this.sim.setPresident(name, party); }
    } else {
      this.sim.reset();
      this.sim.setPresident(name, party);
    }
    this.sim.state.paused = false;
    this.sim.state.speed = 1;
    $('#startScreen').classList.add('hidden');
    $('#hud').classList.remove('hidden');
    $('#loading').classList.add('hidden');
    this.player.active = true;
    this.player.returnToDC();
    this.player.snapCamera();
    this.updateHUD();
    this.renderTicker();
    this.updateMail();
    $('#tutorial').classList.remove('hidden');
    this.opts.onStart?.();
    setTimeout(() => { if (!this.sim.state.flags.gameOver) $('#tutorial')?.classList.add('hidden'); }, 23000);
  }

  showTitle() {
    this.started = false;
    this.closeAll();
    $('#hud').classList.add('hidden');
    $('#startScreen').classList.remove('hidden');
    $('#gameOver').classList.add('hidden');
    this.player.active = false;
    this.sim.state.paused = true;
    this.opts.onTitle?.();
  }

  scheduleUpdate() {
    if (this._updating) return;
    this._updating = true;
    setTimeout(() => { this._updating = false; this.updateHUD(); if (this.overlay === 'map') this.drawMap(); if (this.overlay === 'dash') this.renderDashboard(true); if (this.overlay === 'travel') this.renderTravel(); }, 180);
  }

  updateHUD() {
    const st = this.sim.state;
    $('#hudName').textContent = `PRESIDENT ${String(st.president).toUpperCase()}`;
    $('#hudDate').textContent = this.sim.dateLabel().toUpperCase();
    $('#hudDay').textContent = `DAY ${st.day}`;
    $('#hudClock').textContent = this.sim.clockLabel;
    $('#approvalVal').textContent = Math.round(st.approval);
    $('#approvalRing').style.setProperty('--p', st.approval);
    $('#economyVal').textContent = Math.round(st.economy);
    $('#tensionVal').textContent = Math.round(st.worldTension);
    $('#defconVal').textContent = st.defcon;
    const dc = $('.defcon-stat'); dc.classList.toggle('warn', st.defcon === 3 || st.defcon === 4); dc.classList.toggle('danger', st.defcon <= 2);
    for (const b of $$('.speed-btn')) {
      const s = Number(b.dataset.speed);
      b.classList.toggle('active', s === 0 ? st.paused : (!st.paused && st.speed === s));
    }
    $('#speedState').textContent = st.paused ? 'TIME PAUSED' : st.speed > 1 ? `TIME ×${st.speed}` : 'TIME RUNNING';
    const loc = this.locationLabel();
    $('#locationText').textContent = loc;
    this.updateTouch();
    this.updateMail();
  }

  locationLabel() {
    const p = this.player;
    if (p.mode === 'interior') return 'THE OVAL OFFICE · WEST WING';
    if (p.mode === 'stage') {
      const c = COUNTRIES.find(x => x.id === this.world.stageCountry);
      return c ? `${c.capital.toUpperCase()} · ${c.name.toUpperCase()}` : 'STATE VISIT';
    }
    if (p.vehicle) {
      if (p.vehicle.userData.type === 'heli') return 'MARINE ONE · AIRBORNE';
      return 'THE BEAST · MOTORCADE';
    }
    let best = null, bd = 1e9;
    for (const [id, c] of Object.entries(this.world.cityData)) {
      const d = Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
      if (d < bd) { bd = d; best = c; }
    }
    if (best && bd < 130) return `${best.name.toUpperCase()} · ${best.state.toUpperCase()}`;
    return 'THE OPEN ROAD · UNITED STATES';
  }

  updateTouch() {
    if (!this.touch) return;
    $('#joystick').classList.remove('hidden');
    $('#touchActions').classList.remove('hidden');
    $('#lookHint').classList.remove('hidden');
    const p = this.player;
    if (p.vehicle) {
      const heli = p.vehicle.userData.type === 'heli';
      $('#interactLabel').textContent = 'EXIT';
      $('#interactIcon').textContent = '⤶';
      $('#jumpLabel').textContent = heli ? 'ASCEND' : 'JUMP';
      $('#brakeLabel').textContent = heli ? 'DESCEND' : 'BRAKE';
    } else {
      const pr = p.prompt;
      $('#interactLabel').textContent = pr ? (pr.action === 'vehicle' ? 'BOARD' : 'INTERACT') : 'INTERACT';
      $('#interactIcon').textContent = pr ? '✦' : '✦';
      $('#jumpLabel').textContent = 'JUMP';
      $('#brakeLabel').textContent = 'BRAKE';
    }
  }

  setPrompt(prompt) {
    const el = $('#prompt');
    if (!prompt) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    $('#promptText').textContent = prompt.label;
    this.updateTouch();
  }

  _bindTouch() {
    const base = $('.stick-base'), knob = $('#stickKnob');
    let active = false, id = null;
    const radius = () => base.clientWidth * 0.33;
    const set = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = radius();
      const l = Math.hypot(dx, dy);
      if (l > max) { dx = dx / l * max; dy = dy / l * max; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.player.setMove(dx / max, -dy / max);
      this.player.setMoveHeld(true);
    };
    base.addEventListener('pointerdown', e => {
      active = true; id = e.pointerId; base.setPointerCapture(id); set(e); e.preventDefault();
    });
    base.addEventListener('pointermove', e => { if (active && e.pointerId === id) set(e); });
    const end = e => {
      if (!active || (id !== null && e.pointerId !== id)) return;
      active = false; id = null; knob.style.transform = ''; this.player.setMove(0, 0); this.player.setMoveHeld(false);
    };
    base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    $('#btnInteract').addEventListener('click', () => this.player.interact());
    $('#btnJump').addEventListener('click', () => this.player.jumpPress());
    $('#btnBrake').addEventListener('click', () => this.player.brakePress());
    // drag to look anywhere on the canvas that is not UI
    const canvas = $('#scene');
    let lookId = null, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', e => {
      if (!this.started) return;
      lookId = e.pointerId; lx = e.clientX; ly = e.clientY;
    });
    canvas.addEventListener('pointermove', e => {
      if (lookId !== e.pointerId) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) this.player.look(dx, dy);
    });
    const endLook = e => { if (lookId === e.pointerId) lookId = null; };
    canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook);
  }

  // ------------------------------------------------------------ pause holds
  setHold(key, on) {
    if (on) this.holds.add(key); else this.holds.delete(key);
    const any = this.holds.size > 0;
    if (any && !this.autoPaused) {
      this.autoPaused = !this.sim.state.paused;
      if (this.autoPaused) this.sim.state.paused = true;
    } else if (!any && this.autoPaused) {
      this.autoPaused = false;
      this.sim.state.paused = false;
    }
    this.updateHUD();
  }

  // ------------------------------------------------------------ overlays
  openMap() {
    this.overlay = 'map'; $('#mapOverlay').classList.remove('hidden');
    this.setHold('map', true);
    this.renderCountryPanel(this.mapSelected || null);
    requestAnimationFrame(() => this.drawMap());
  }

  closeOverlay(name) {
    if (name === 'map') { $('#mapOverlay').classList.add('hidden'); this.setHold('map', false); }
    if (name === 'dash') { $('#dashboard').classList.add('hidden'); this.setHold('dash', false); }
    if (name === 'travel') { $('#travelOverlay').classList.add('hidden'); this.setHold('travel', false); $('#travelCinematic').classList.add('hidden'); }
    if (name === 'help') { $('#helpOverlay').classList.add('hidden'); this.setHold('help', false); }
    this.overlay = null;
  }

  closeAll(except = null) {
    if (except !== 'map' && !$('#mapOverlay').classList.contains('hidden')) this.closeOverlay('map');
    if (except !== 'dash' && !$('#dashboard').classList.contains('hidden')) this.closeOverlay('dash');
    if (except !== 'travel' && !$('#travelOverlay').classList.contains('hidden')) this.closeOverlay('travel');
    if (except !== 'help' && !$('#helpOverlay').classList.contains('hidden')) this.closeOverlay('help');
    this.closeModal();
  }

  escape() {
    if (!$('#modalRoot').classList.contains('hidden')) { this.closeModal(); return; }
    if (!$('#helpOverlay').classList.contains('hidden')) { this.closeOverlay('help'); return; }
    if (!$('#travelOverlay').classList.contains('hidden')) { this.closeOverlay('travel'); return; }
    if (!$('#mapOverlay').classList.contains('hidden')) { this.closeOverlay('map'); return; }
    if (!$('#dashboard').classList.contains('hidden')) { this.closeOverlay('dash'); return; }
  }

  openDashboard(tab = 'nation') {
    this.closeAll('dash');
    this.dashTab = tab;
    this.overlay = 'dash';
    $('#dashboard').classList.remove('hidden');
    this.setHold('dash', true);
    this.renderDashboard();
  }

  openHelp() {
    this.closeAll('help');
    this.overlay = 'help';
    $('#helpOverlay').classList.remove('hidden');
    this.setHold('help', true);
  }

  openTravel(countryId = null) {
    if (countryId) {
      this.closeAll();
      this.startTravel(countryId);
      return;
    }
    this.closeAll('travel');
    this.overlay = 'travel';
    $('#travelOverlay').classList.remove('hidden');
    $('#travelCinematic').classList.add('hidden');
    this.setHold('travel', true);
    this.renderTravel();
  }

  // ------------------------------------------------------------ map
  async ensureGeo() {
    if (this.mapGeo) return this.mapGeo;
    const res = await fetch('data/world.geo.json');
    this.mapGeo = await res.json();
    return this.mapGeo;
  }

  _bindMapPan() {
    const canvas = $('#worldMap');
    let pointers = new Map();
    let start = null, moved = false, pinch = null;
    canvas.addEventListener('pointerdown', e => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      canvas.setPointerCapture(e.pointerId);
      if (pointers.size === 1) { start = { x: e.clientX, y: e.clientY, vx: this.mapView.x, vy: this.mapView.y }; moved = false; }
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinch = { d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale: this.mapView.scale };
      }
    });
    canvas.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.mapView.scale = clamp(pinch.scale * d / Math.max(1, pinch.d), 0.8, 5);
        this.drawMap();
        return;
      }
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (moved) { this.mapView.x = start.vx + dx; this.mapView.y = start.vy + dy; this.drawMap(); }
    });
    const up = e => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        if (!moved && start) this._mapClick(e);
        start = null; pinch = null;
      }
      if (pointers.size === 1) pinch = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); if (!pointers.size) { start = null; pinch = null; } });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const before = this._screenToMap(mx, my);
      this.mapView.scale = clamp(this.mapView.scale * (e.deltaY > 0 ? 0.88 : 1.14), 0.8, 5);
      const after = this._screenToMap(mx, my);
      this.mapView.x += (after.x - before.x) * this._mapMetrics().scale;
      this.mapView.y += (after.y - before.y) * this._mapMetrics().scale;
      this.drawMap();
    }, { passive: false });
    canvas.addEventListener('pointermove', e => {
      if (pointers.size) return;
      const c = this._countryAtScreen(e.clientX, e.clientY);
      const id = c?.id || null;
      if (id !== this.mapHover) { this.mapHover = id; this.drawMap(); }
      canvas.style.cursor = id ? 'pointer' : 'grab';
    });
  }

  _mapMetrics() {
    const canvas = $('#worldMap');
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const base = Math.min(w / 360, h / 180) * 0.94;
    const s = base * this.mapView.scale;
    return { w, h, base, scale: s, tx: w / 2 - 180 * s + this.mapView.x, ty: h / 2 - 90 * s + this.mapView.y };
  }

  _screenToMap(sx, sy) {
    const m = this._mapMetrics();
    return { x: (sx - m.tx) / m.scale, y: (sy - m.ty) / m.scale };
  }

  _screenToLL(sx, sy) {
    const p = this._screenToMap(sx, sy);
    return { lon: p.x - 180, lat: 90 - p.y };
  }

  _countryAtScreen(sx, sy) {
    if (!this.mapGeo) return null;
    const r = $('#worldMap').getBoundingClientRect();
    const ll = this._screenToLL(sx - r.left, sy - r.top);
    const feature = this.mapGeo.features.find(f => {
      if (f.properties.name === 'Antarctica') return false;
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      return polys.some(poly => this._pointInRing(ll.lon, ll.lat, poly[0]));
    });
    return feature || null;
  }

  _mapClick(e) {
    const f = this._countryAtScreen(e.clientX, e.clientY);
    const id = f ? NAME_TO_ID[f.properties.name] : null;
    if (f && f.properties.name === 'United States of America') { this.mapSelected = 'USA'; this.renderCountryPanel('USA'); return; }
    this.mapSelected = id || null;
    this.renderCountryPanel(id || null);
    this.drawMap();
  }

  _pointInRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  drawMap() {
    if (!this.mapGeo) { this.ensureGeo().then(() => this.drawMap()); return; }
    const canvas = $('#worldMap');
    if (!canvas || canvas.clientWidth < 10) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    g.addColorStop(0, '#0a2033'); g.addColorStop(0.55, '#071624'); g.addColorStop(1, '#030a12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const m = this._mapMetrics();
    ctx.save(); ctx.translate(m.tx, m.ty); ctx.scale(m.scale, m.scale);
    // graticule
    ctx.strokeStyle = 'rgba(120,180,200,.07)'; ctx.lineWidth = 1 / m.scale;
    for (let lon = -180; lon <= 180; lon += 30) { ctx.beginPath(); ctx.moveTo(lon + 180, 0); ctx.lineTo(lon + 180, 180); ctx.stroke(); }
    for (let lat = -90; lat <= 90; lat += 30) { ctx.beginPath(); ctx.moveTo(0, 90 - lat); ctx.lineTo(360, 90 - lat); ctx.stroke(); }
    // countries
    for (const f of this.mapGeo.features) {
      const name = f.properties.name;
      if (name === 'Antarctica') continue;
      const id = NAME_TO_ID[name];
      const isUSA = name === 'United States of America';
      const c = id ? this.sim.state.countries[id] : null;
      const selected = (id && id === this.mapSelected) || (isUSA && this.mapSelected === 'USA');
      const hover = id && id === this.mapHover;
      let fill = '#1d3040';
      if (isUSA) fill = '#b6923f';
      else if (c) fill = relColor(c.rel);
      if (c?.war) fill = '#8e3430';
      if (isUSA) ctx.globalAlpha = 0.95; else ctx.globalAlpha = c ? (selected ? 0.95 : 0.68) : 0.48;
      ctx.fillStyle = fill;
      ctx.beginPath();
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          ring.forEach(([lon, lat], i) => {
            const x = lon + 180, y = 90 - lat;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          });
          ctx.closePath();
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = selected ? '#f0d99a' : (hover ? 'rgba(240,217,154,.6)' : 'rgba(4,12,20,.65)');
      ctx.lineWidth = (selected ? 1.8 : 0.5) / m.scale;
      ctx.stroke();
    }
    // alliance arcs from Washington
    const usaCap = { lon: -77, lat: 38.9 };
    for (const c of COUNTRIES) {
      const cs = this.sim.state.countries[c.id];
      if (!cs) continue;
      if (cs.allied) {
        ctx.beginPath();
        const x1 = usaCap.lon + 180, y1 = 90 - usaCap.lat, x2 = c.lon + 180, y2 = 90 - c.lat;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.18;
        ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2);
        ctx.strokeStyle = 'rgba(99,184,166,.28)'; ctx.lineWidth = 0.7 / m.scale; ctx.stroke();
      }
      if (cs.war) {
        ctx.beginPath();
        const x1 = usaCap.lon + 180, y1 = 90 - usaCap.lat, x2 = c.lon + 180, y2 = 90 - c.lat;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(216,92,92,.38)'; ctx.lineWidth = 0.8 / m.scale; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // capitals and conflict markers
    const t = performance.now() / 1000;
    for (const c of COUNTRIES) {
      const cs = this.sim.state.countries[c.id];
      if (!cs) continue;
      const x = c.lon + 180, y = 90 - c.lat;
      if (cs.war) {
        const r = (2.6 + Math.sin(t * 2.4) * 0.8) / m.scale;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = 'rgba(216,92,92,.22)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fillStyle = '#e2685e'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 0.9 / m.scale, 0, 7); ctx.fillStyle = cs.allied ? '#e8d29a' : 'rgba(243,237,224,.55)'; ctx.fill();
      if (WORLD_CAPITALS[c.id]) {
        ctx.beginPath(); ctx.arc(x, y, 1.8 / m.scale, 0, 7); ctx.strokeStyle = 'rgba(200,162,74,.55)'; ctx.lineWidth = 0.5 / m.scale; ctx.stroke();
      }
    }
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${7 / Math.sqrt(Math.max(1, m.scale / m.base))}px "Barlow Condensed"`;
    for (const id of MAJOR_LABELS) {
      const c = id === 'USA' ? { lon: -100, lat: 39 } : COUNTRIES.find(x => x.id === id);
      if (!c) continue;
      const x = c.lon + 180, y = 90 - c.lat;
      ctx.fillStyle = 'rgba(3,10,18,.65)';
      const label = id === 'USA' ? 'UNITED STATES' : c.name.toUpperCase();
      ctx.fillText(label, x + 0.3 / m.scale, y + 0.3 / m.scale);
      ctx.fillStyle = id === 'USA' ? '#f0d99a' : 'rgba(236,229,214,.72)';
      ctx.fillText(label, x, y);
    }
    ctx.restore();
    // coordinates corner
    ctx.fillStyle = 'rgba(200,162,74,.55)';
    ctx.font = '7px "Barlow Condensed"';
    ctx.textAlign = 'left';
    ctx.fillText('EQUIRECTANGULAR PROJECTION · LIVE', 12, h - 24);
    $('#mapTension').textContent = Math.round(this.sim.state.worldTension);
    $('#mapTensionBar').style.width = this.sim.state.worldTension + '%';
  }

  _mapPanelClick(e) {
    const btn = e.target.closest('[data-dip]');
    if (!btn) return;
    const id = btn.dataset.country, action = btn.dataset.dip;
    if (action === 'visit') { this.closeAll(); this.startTravel(id); return; }
    if (action === 'home') { this.closeAll(); this.player.returnToDC(); return; }
    if (action === 'dashboard') { this.closeAll(); this.openDashboard('nation'); return; }
    if (action === 'war' || action === 'nuke') {
      const meta = COUNTRIES.find(c => c.id === id);
      if (action === 'war') this.confirm(`Declare war on ${meta.name}?`, 'Congress will be notified under the War Powers Resolution. Casualties, global markets, and alliances will react immediately.', 'DECLARE WAR', () => { this.sim.diplomacy(id, 'war'); this.renderCountryPanel(id); this.drawMap(); }, true);
      return;
    }
    if (action === 'alliance') {
      const meta = COUNTRIES.find(c => c.id === id);
      if (this.sim.state.countries[id].rel < 62) { this.toast('Offer declined', `${meta.name} will not formalize an alliance yet.`, 'bad'); return; }
    }
    this.sim.diplomacy(id, action);
    this.renderCountryPanel(id);
    this.drawMap();
  }

  renderCountryPanel(id) {
    const panel = $('#countryPanel');
    if (!panel) return;
    if (!id) {
      panel.innerHTML = `<div class="panel-empty"><div class="empty-mark">◎</div><h3>SELECT A NATION</h3><p>Tap any country to open a diplomatic channel. Gold-ringed capitals can be visited in person.</p></div>`;
      return;
    }
    if (id === 'USA') {
      const st = this.sim.state;
      panel.innerHTML = `
        <div class="cp-head"><div class="cp-flag">${flagImg('USA', ['#b22234', '#fff', '#3c3b6e'])}</div><div><div class="cp-name">United States</div><div class="cp-sub">WASHINGTON, D.C. · HOME</div><div class="cp-tags"><span class="tag">THE PRESIDENT</span></div></div></div>
        <div class="cp-rel"><div class="num" style="color:#f0d99a">${Math.round(st.approval)}</div><div class="lbl">DOMESTIC<br/>APPROVAL</div></div>
        <div class="rel-bar"><i style="width:${st.approval}%;background:#c8a24a"></i></div>
        <div class="cp-stats"><div class="cp-stat"><span>ECONOMY</span><b>${Math.round(st.economy)}</b></div><div class="cp-stat"><span>MILITARY</span><b>${Math.round(st.readiness)}</b></div><div class="cp-stat"><span>DEFCON</span><b>${st.defcon}</b></div><div class="cp-stat"><span>WORLD TENSION</span><b>${Math.round(st.worldTension)}</b></div></div>
        <div class="cp-section">THE PRESIDENT'S ORDERS</div>
        <div class="cp-actions"><button class="gold" data-dip="home" data-country="USA">RETURN TO WASHINGTON</button><button data-dip="dashboard" data-country="USA">OVAL OFFICE</button></div>
        <div class="cp-note">“The buck stops here.” — Harry S. Truman</div>`;
      return;
    }
    const meta = COUNTRIES.find(c => c.id === id);
    const c = this.sim.state.countries[id];
    if (!meta || !c) { this.renderCountryPanel(null); return; }
    const visit = WORLD_CAPITALS[id] ? 'STATE VISIT' : 'STATE VISIT';
    panel.innerHTML = `
      <div class="cp-head">
        <div class="cp-flag">${flagImg(meta.id, meta.flag)}</div>
        <div><div class="cp-name">${esc(meta.name)}</div><div class="cp-sub">${esc(meta.capital).toUpperCase()} · ${esc(meta.region).toUpperCase()}</div>
        <div class="cp-tags">${c.allied ? '<span class="tag ally">ALLY</span>' : ''}${c.sanction ? '<span class="tag sanction">SANCTIONED</span>' : ''}${c.war ? '<span class="tag war">AT WAR</span>' : ''}<span class="tag">${esc(meta.bloc)}</span></div></div>
      </div>
      <div class="cp-rel"><div class="num" style="color:${relColor(c.rel)}">${Math.round(c.rel)}</div><div class="lbl">RELATIONSHIP<br/>WITH THE U.S.</div></div>
      <div class="rel-bar"><i style="width:${c.rel}%;background:${relColor(c.rel)}"></i></div>
      <div class="cp-stats">
        <div class="cp-stat"><span>GDP</span><b>$${meta.gdp.toFixed(2)}T</b></div>
        <div class="cp-stat"><span>MILITARY</span><b>${meta.military}</b></div>
        <div class="cp-stat"><span>STABILITY</span><b>${Math.round(meta.stability)}</b></div>
        <div class="cp-stat"><span>NUCLEAR</span><b>${meta.nuclear ? 'YES' : 'NO'}</b></div>
      </div>
      <div style="font-size:10px;line-height:1.45;color:var(--paper-dim);margin-bottom:4px"><b style="color:var(--paper)">${esc(meta.leader)}</b><br/>${esc(meta.gov)}</div>
      <div class="cp-section">DIPLOMATIC CHANNEL · ${relLabel(c.rel)}</div>
      <div class="cp-actions">
        <button data-dip="call" data-country="${id}">CALL LEADER</button>
        <button data-dip="aid" data-country="${id}">SEND AID</button>
        <button data-dip="trade" data-country="${id}">TRADE TALKS</button>
        <button data-dip="condemn" data-country="${id}">CONDEMN</button>
        ${c.allied ? '' : `<button data-dip="alliance" data-country="${id}">FORM ALLIANCE</button>`}
        ${c.sanction ? `<button data-dip="lift" data-country="${id}">LIFT SANCTIONS</button>` : `<button data-dip="sanction" data-country="${id}">SANCTION</button>`}
        ${c.war ? `<button data-dip="peace" data-country="${id}">CEASEFIRE</button>` : `<button class="danger" data-dip="war" data-country="${id}">DECLARE WAR</button>`}
        <button class="gold wide" data-dip="visit" data-country="${id}">${visit}</button>
      </div>
      <div class="cp-note">Relationships shift with every call, sanction, and deployment. The world is keeping score.</div>`;
  }

  // ------------------------------------------------------------ dashboard
  renderDashboard(silent = false) {
    const st = this.sim.state;
    if (!silent) {
      for (const b of $$('#dashNav button')) b.classList.toggle('active', b.dataset.tab === this.dashTab);
    }
    $('#dashPc').textContent = Math.round(st.pc);
    $('#dashTreasury').textContent = money(st.treasury);
    let html = '';
    switch (this.dashTab) {
      case 'nation': html = this._dashNation(st); break;
      case 'diplomacy': html = this._dashDiplomacy(st); break;
      case 'military': html = this._dashMilitary(st); break;
      case 'intel': html = this._dashIntel(st); break;
      case 'nuclear': html = this._dashNuclear(st); break;
      case 'politics': html = this._dashPolitics(st); break;
      case 'media': html = this._dashMedia(st); break;
    }
    $('#dashContent').innerHTML = html;
    if (!silent) $('#dashContent').scrollTop = 0;
    for (const b of $$('#dashNav button')) b.classList.toggle('active', b.dataset.tab === this.dashTab);
  }

  _dashNation(st) {
    const groups = this.sim.politicalGroups();
    const cabinet = [['Chief of Staff', 'Dana Whitfield'], ['Secretary of State', 'Marcus Bell'], ['Secretary of Defense', 'Gen. Rosa Vance'], ['National Security Advisor', 'Dr. Farid Haddad'], ['Treasury Secretary', 'Nina Park'], ['Press Secretary', 'Theo Grant']];
    return `<div class="kicker">THE STATE OF THE UNION</div><h2>${st.approval >= 50 ? 'A Nation Holding Steady' : 'A Nation on Edge'}</h2>
      <p class="lead">${this.sim.shortDate()} · Day ${st.day} of the administration. Approval is ${st.approval >= 50 ? 'above' : 'below'} the political fault line, world tension sits at ${Math.round(st.worldTension)}, and ${st.protests > 15 ? 'demonstrations are growing outside the gates.' : 'the streets are quiet for now.'}</p>
      <div class="grid-4">
        <div class="card"><h3>APPROVAL</h3><div class="metric">${Math.round(st.approval)}<small>%</small></div><div class="metric-sub ${st.approval >= 50 ? 'trend-up' : 'trend-down'}">${st.approval >= 50 ? '▲' : '▼'} ${Math.abs(st.approval - 50).toFixed(1)} from 50</div>${sparkline(st.history.approval, '#c8a24a')}</div>
        <div class="card"><h3>ECONOMY</h3><div class="metric">${Math.round(st.economy)}<small>/100</small></div><div class="metric-sub">UNEMP ${st.unemployment.toFixed(1)}% · CPI ${st.inflation.toFixed(1)}%</div>${sparkline(st.history.economy, '#63b8a6')}</div>
        <div class="card"><h3>WORLD TENSION</h3><div class="metric">${Math.round(st.worldTension)}<small>/100</small></div><div class="metric-sub">DEFCON ${st.defcon} · ${st.wars.length} active war${st.wars.length === 1 ? '' : 's'}</div>${sparkline(st.history.tension, '#d85c5c')}</div>
        <div class="card"><h3>POLITICAL CAPITAL</h3><div class="metric">${Math.round(st.pc)}<small>/100</small></div><div class="metric-sub">CONGRESS ${Math.round(st.congressional)}% · MEDIA ${Math.round(st.media)}%</div><div class="meter"><i style="width:${st.pc}%"></i></div></div>
      </div>
      <div class="grid-2" style="margin-top:10px">
        <div class="card"><h3>THE COALITION</h3>${groups.map(g => `<div class="group-row"><span>${g.name.toUpperCase()}</span><div class="meter ${g.value > 50 ? 'teal' : 'red'}"><i style="width:${g.value}%"></i></div><b>${Math.round(g.value)}</b></div>`).join('')}
          <div class="section-title"><h3>STREET HEAT</h3><span>${st.protests > 35 ? 'CRITICAL' : st.protests > 15 ? 'ELEVATED' : 'LOW'}</span></div><div class="meter red"><i style="width:${st.protests}%"></i></div><div class="metric-sub">${Math.round(st.protests)}% protest intensity · ${st.scandal > 2 ? 'scandal pressure rising' : 'no active scandal'}</div></div>
        <div class="card"><h3>THE CABINET</h3>${cabinet.map(([r, n]) => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(231,217,173,.07)"><span style="font-size:8px;letter-spacing:.12em;color:var(--paper-dim)">${r.toUpperCase()}</span><span style="font-size:10px">${n}</span></div>`).join('')}</div>
      </div>
      <div class="section-title"><h3>EXECUTIVE AGENDA</h3><span>POLITICAL CAPITAL ${Math.round(st.pc)}</span></div>
      <div class="policy-grid">${POLICIES.map(p => `<button class="policy ${st.pc < p.cost ? 'disabled' : ''}" data-policy="${p.id}"><div class="policy-top"><b>${p.name.toUpperCase()}</b><span class="cost">${p.cost ? p.cost + ' PC' : 'FREE'}</span></div><p>${p.desc}</p></button>`).join('')}</div>`;
  }

  _dashDiplomacy(st) {
    const list = [...COUNTRIES].sort((a, b) => st.countries[b.id].rel - st.countries[a.id].rel);
    if (!this.dashCountry) this.dashCountry = 'RUS';
    const meta = COUNTRIES.find(c => c.id === this.dashCountry) || list[0];
    const c = st.countries[meta.id];
    const allies = COUNTRIES.filter(x => st.countries[x.id].allied).length;
    const wars = st.wars.length;
    return `<div class="kicker">THE DEPARTMENT OF STATE</div><h2>The World, In Your Hands</h2><p class="lead">Every call is a signal. Every sanction is a cost. Every alliance is a promise. ${allies} formal allies, ${wars} active war${wars === 1 ? '' : 's'}, and ${Object.values(st.countries).filter(x => x.sanction).length} sanctioned states.</p>
      <div class="grid-4">
        <div class="card"><h3>ALLIES</h3><div class="metric">${allies}</div><div class="metric-sub">FORMAL DEFENSE PACKTS</div></div>
        <div class="card"><h3>HOSTILE</h3><div class="metric">${COUNTRIES.filter(x => st.countries[x.id].rel < 25).length}</div><div class="metric-sub">RELATIONS BELOW 25</div></div>
        <div class="card"><h3>SANCTIONS</h3><div class="metric">${Object.values(st.countries).filter(x => x.sanction).length}</div><div class="metric-sub">ACTIVE REGIMES</div></div>
        <div class="card"><h3>WORLD TENSION</h3><div class="metric">${Math.round(st.worldTension)}</div><div class="metric-sub">DEFCON ${st.defcon}</div><div class="meter red"><i style="width:${st.worldTension}%"></i></div></div>
      </div>
      <div class="section-title"><h3>BILATERAL RELATIONSHIPS</h3><span><button class="ghost-btn" data-action="open-map">OPEN LIVE MAP</button></span></div>
      <div class="diplo-wrap">
        <div class="diplo-list">${list.map(x => { const cs = st.countries[x.id]; return `<button class="diplo-item ${x.id === meta.id ? 'active' : ''}" data-dipsel="${x.id}">${flagBars(x.id, x.flag)}<span class="n">${esc(x.name)}</span><span class="rel-pill" style="color:${relColor(cs.rel)}">${Math.round(cs.rel)}</span></button>`; }).join('')}</div>
        <div class="diplo-detail">
          <div class="cp-head"><div class="cp-flag">${flagImg(meta.id, meta.flag)}</div><div><div class="cp-name">${esc(meta.name)}</div><div class="cp-sub">${esc(meta.capital).toUpperCase()} · ${esc(meta.region).toUpperCase()}</div><div class="cp-tags">${c.allied ? '<span class="tag ally">ALLY</span>' : ''}${c.sanction ? '<span class="tag sanction">SANCTIONED</span>' : ''}${c.war ? '<span class="tag war">AT WAR</span>' : ''}</div></div></div>
          <div class="cp-rel"><div class="num" style="color:${relColor(c.rel)}">${Math.round(c.rel)}</div><div class="lbl">${relLabel(c.rel)}<br/>RELATIONSHIP</div></div>
          <div class="rel-bar"><i style="width:${c.rel}%;background:${relColor(c.rel)}"></i></div>
          <div class="cp-stats">
            <div class="cp-stat"><span>LEADER</span><b style="font-size:11px;font-family:var(--sans);letter-spacing:.04em">${esc(meta.leader)}</b></div>
            <div class="cp-stat"><span>GOVERNMENT</span><b style="font-size:11px;font-family:var(--sans);letter-spacing:.04em">${esc(meta.gov)}</b></div>
            <div class="cp-stat"><span>GDP</span><b>$${meta.gdp.toFixed(2)}T</b></div>
            <div class="cp-stat"><span>MILITARY</span><b>${meta.military}</b></div>
          </div>
          <div class="cp-section">DIPLOMATIC ACTIONS</div>
          <div class="cp-actions">
            <button data-dip="call" data-country="${meta.id}">CALL</button>
            <button data-dip="aid" data-country="${meta.id}">SEND AID</button>
            <button data-dip="trade" data-country="${meta.id}">TRADE</button>
            <button data-dip="condemn" data-country="${meta.id}">CONDEMN</button>
            ${c.allied ? '' : `<button data-dip="alliance" data-country="${meta.id}">ALLIANCE</button>`}
            ${c.sanction ? `<button data-dip="lift" data-country="${meta.id}">LIFT SANCTIONS</button>` : `<button data-dip="sanction" data-country="${meta.id}">SANCTION</button>`}
            ${c.war ? `<button data-dip="peace" data-country="${meta.id}">CEASEFIRE</button>` : `<button class="danger" data-dip="war" data-country="${meta.id}">DECLARE WAR</button>`}
            <button class="gold wide" data-dip="visit" data-country="${meta.id}">STATE VISIT</button>
          </div>
          <div class="cp-note">${c.war ? 'American forces are engaged. A ceasefire costs political capital but saves lives.' : c.rel < 30 ? 'This relationship is on a knife’s edge. Back-channel signals may be misread.' : 'The channel is open. What you say next will be remembered.'}</div>
        </div>
      </div>`;
  }

  _dashMilitary(st) {
    const wars = st.wars.map(id => COUNTRIES.find(c => c.id === id)).filter(Boolean);
    return `<div class="kicker">THE PENTAGON · NATIONAL MILITARY COMMAND</div><h2>Force and Consequence</h2><p class="lead">Readiness is ${Math.round(st.readiness)}. DEFCON ${st.defcon}. ${wars.length ? 'American forces are in active combat.' : 'No active declared wars.'} Every operation spends readiness, political capital, and the lives of the people who volunteer.</p>
      <div class="grid-4">
        <div class="card"><h3>READINESS</h3><div class="metric">${Math.round(st.readiness)}<small>/100</small></div><div class="meter teal"><i style="width:${st.readiness}%"></i></div></div>
        <div class="card"><h3>DEFCON</h3><div class="metric" style="color:${st.defcon <= 2 ? '#e2685e' : 'var(--paper)'}">${st.defcon}</div><div class="metric-sub">${['','COCKED PISTOL','FAST PACE','ROUND HOUSE','DOUBLE TAKE','FADE OUT'][st.defcon]}</div></div>
        <div class="card"><h3>ACTIVE WARS</h3><div class="metric">${wars.length}</div><div class="metric-sub">${wars.map(w => w.name.toUpperCase()).join(' · ') || 'NONE'}</div></div>
        <div class="card"><h3>INTELLIGENCE</h3><div class="metric">${Math.round(st.intel)}</div><div class="metric-sub">NETWORK CONFIDENCE</div><div class="meter"><i style="width:${st.intel}%"></i></div></div>
      </div>
      <div class="section-title"><h3>DEFCON POSTURE</h3><span>SECRETARY OF DEFENSE</span></div>
      <div class="defcon-ladder">${[5, 4, 3, 2, 1].map(n => `<button class="dl ${st.defcon === n ? 'active' : ''} ${n <= 2 ? 'danger' : ''}" data-defcon="${n}"><b>${n}</b><span>${['','COCKED','FAST','ROUND','DOUBLE','FADE'][n]}</span></button>`).join('')}</div>
      <div class="section-title"><h3>MILITARY OPERATIONS</h3><span>SELECT A TARGET · PC COST IN PARENTHESES</span></div>
      <div class="op-grid">${OPS.map(op => `<div class="op-card"><div class="policy-top"><b>${op.name.toUpperCase()}</b><span class="cost">${op.cost} PC</span></div><p>${op.desc}</p><div class="op-target"><select class="dash-select" data-target-for="${op.id}">${this._targetOptions(st)}</select><button class="execute" data-op="${op.id}">EXECUTE</button></div></div>`).join('')}</div>
      ${wars.length ? `<div class="section-title"><h3>WARS IN PROGRESS</h3><span>CASUALTY REPORTS CLASSIFIED</span></div><div class="card">${wars.map(w => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(231,217,173,.07)"><span>${esc(w.name)}</span><button class="execute" data-dip="peace" data-country="${w.id}">CEASEFIRE</button></div>`).join('')}</div>` : ''}`;
  }

  _targetOptions(st) {
    return [...COUNTRIES].sort((a, b) => st.countries[a.id].rel - st.countries[b.id].rel).map(c => `<option value="${c.id}">${esc(c.name)} · ${Math.round(st.countries[c.id].rel)}</option>`).join('');
  }

  _dashIntel(st) {
    return `<div class="kicker">CENTRAL INTELLIGENCE AGENCY · COVERT ACTION</div><h2>The Quiet War</h2><p class="lead">Your intelligence network is at ${Math.round(st.intel)}. The most important operations will never appear in a press release. Success buys options; failure buys a scandal.</p>
      <div class="grid-3">
        <div class="card"><h3>NETWORK CONFIDENCE</h3><div class="metric">${Math.round(st.intel)}<small>/100</small></div><div class="meter teal"><i style="width:${st.intel}%"></i></div><div class="metric-sub">HUMINT · SIGINT · SATELLITE</div></div>
        <div class="card"><h3>BLACK BUDGET</h3><div class="metric">$${(4.2 + st.intel * 0.02).toFixed(1)}<small>B</small></div><div class="metric-sub">CLASSIFIED APPROPRIATION</div></div>
        <div class="card"><h3>COUNTERINTEL</h3><div class="metric">${Math.round(100 - st.scandal * 2)}<small>/100</small></div><div class="metric-sub">SCANDAL PRESSURE ${Math.round(st.scandal)}</div><div class="meter red"><i style="width:${st.scandal * 2}%"></i></div></div>
      </div>
      <div class="section-title"><h3>AUTHORIZED COVERT OPERATIONS</h3><span>DENIABILITY IS NEVER GUARANTEED</span></div>
      <div class="op-grid">${INTEL_MISSIONS.map(op => `<div class="op-card"><div class="policy-top"><b>${op.name.toUpperCase()}</b><span class="cost">${op.cost} PC</span></div><p>${op.desc}</p><div class="op-target"><select class="dash-select" data-target-for="${op.id}">${this._targetOptions(st)}</select><button class="execute" data-intel="${op.id}">AUTHORIZE</button></div></div>`).join('')}</div>
      <div class="card" style="margin-top:10px"><h3>DIRECTOR'S NOTE</h3><p style="font-size:11px;line-height:1.5;color:var(--paper-dim);margin:0">“Mr. President, the world is not short of secrets. It is short of people willing to live with them.”</p></div>`;
  }

  _dashNuclear(st) {
    return `<div class="kicker">UNITED STATES STRATEGIC COMMAND · EYES ONLY</div><h2>The Unthinkable</h2><p class="lead">The arsenal is ready. The order is yours. There is no simulation of what happens after — only consequences you will carry for the rest of this presidency.</p>
      <div class="grid-4">
        <div class="card"><h3>DEPLOYED WARHEADS</h3><div class="metric">1,770</div><div class="metric-sub">TRIAD · NUCLEAR POSTURE</div></div>
        <div class="card"><h3>DEFCON</h3><div class="metric" style="color:${st.defcon <= 2 ? '#e2685e' : 'var(--paper)'}">${st.defcon}</div><div class="metric-sub">${['','COCKED PISTOL','FAST PACE','ROUND HOUSE','DOUBLE TAKE','FADE OUT'][st.defcon]}</div></div>
        <div class="card"><h3>LAUNCH AUTHORITY</h3><div class="metric" style="font-size:23px;letter-spacing:.05em">${st.flags.nuclearUsed ? 'USED' : 'SOLE'}</div><div class="metric-sub">THE PRESIDENT</div></div>
        <div class="card"><h3>MISSILE DEFENSE</h3><div class="metric">${Math.round(68 + st.readiness * 0.2)}<small>%</small></div><div class="metric-sub">HOMELAND INTERCEPT</div></div>
      </div>
      <div class="section-title"><h3>STRATEGIC POSTURE</h3><span>MANUAL OVERRIDE</span></div>
      <div class="defcon-ladder">${[5, 4, 3, 2, 1].map(n => `<button class="dl ${st.defcon === n ? 'active' : ''} ${n <= 2 ? 'danger' : ''}" data-defcon="${n}"><b>${n}</b><span>${['','COCKED','FAST','ROUND','DOUBLE','FADE'][n]}</span></button>`).join('')}</div>
      <div class="nuke-warning"><b>NUCLEAR RELEASE · TWO-PERSON RULE</b><p>Authorization requires the President and the Secretary of Defense. A launch will kill millions, end the global order as it exists, and permanently change this simulation. Choose a target only if you accept that.</p><div class="op-target"><select class="dash-select" id="nukeTarget">${this._targetOptions(st)}</select><button class="launch-btn" data-nuke="1">AUTHORIZE RELEASE</button></div></div>
      <div class="grid-2" style="margin-top:10px"><div class="card"><h3>TRIAD STATUS</h3><div class="metric-sub">OHIO-CLASS SSBN · 14 PATROLS</div><div class="meter teal"><i style="width:96%"></i></div><div class="metric-sub">MINUTEMAN III · 400 SILOS</div><div class="meter"><i style="width:91%"></i></div><div class="metric-sub">B-2 / B-52 · 46 AIRFRAMES</div><div class="meter"><i style="width:88%"></i></div></div><div class="card"><h3>DOCTRINE</h3><p style="font-size:11px;line-height:1.5;color:var(--paper-dim);margin:0">The United States maintains a policy of strategic ambiguity on first use. The decision to cross that line has never been made. Every president who has held this authority has prayed they would never use it.</p></div></div>`;
  }

  _dashPolitics(st) {
    const days = Math.max(0, st.nextElectionDay - st.day);
    const groups = this.sim.politicalGroups();
    return `<div class="kicker">THE AMERICAN PEOPLE</div><h2>Politics Is the Art of the Possible</h2><p class="lead">${days} days until the next general election. Congress is at ${Math.round(st.congressional)}% support, media trust at ${Math.round(st.media)}%. The coalition is ${st.polarization > 65 ? 'fractured and loud' : 'restless but holding'}.</p>
      <div class="grid-4">
        <div class="card"><h3>NEXT ELECTION</h3><div class="metric">${days}<small>DAYS</small></div><div class="metric-sub">${st.electionsWon} TERM${st.electionsWon === 1 ? '' : 'S'} WON</div></div>
        <div class="card"><h3>CONGRESS</h3><div class="metric">${Math.round(st.congressional)}<small>%</small></div><div class="meter"><i style="width:${st.congressional}%"></i></div></div>
        <div class="card"><h3>MEDIA TRUST</h3><div class="metric">${Math.round(st.media)}<small>%</small></div><div class="meter teal"><i style="width:${st.media}%"></i></div></div>
        <div class="card"><h3>POLARIZATION</h3><div class="metric">${Math.round(st.polarization)}<small>/100</small></div><div class="meter red"><i style="width:${st.polarization}%"></i></div></div>
      </div>
      <div class="grid-2" style="margin-top:10px"><div class="card"><h3>APPROVAL BY GROUP</h3>${groups.map(g => `<div class="group-row"><span>${g.name.toUpperCase()}</span><div class="meter ${g.value > 50 ? 'teal' : 'red'}"><i style="width:${g.value}%"></i></div><b>${Math.round(g.value)}</b></div>`).join('')}</div><div class="card"><h3>THE MIDTERM MATH</h3><p style="font-size:11px;line-height:1.55;color:var(--paper-dim)">The President's party holds 48 Senate seats and 212 House seats. Every vote is a negotiation. Political capital is the currency; the base is the constraint.</p><div class="metric-sub">SENATE 48 / 100 · HOUSE 212 / 435</div><div class="meter" style="margin-top:8px"><i style="width:48%"></i></div></div></div>
      <div class="section-title"><h3>POLITICAL ACTIONS</h3><span>WHAT THE WEST WING CAN DO TODAY</span></div>
      <div class="policy-grid">${POLICIES.filter(p => ['address', 'rally', 'press', 'purge', 'pardon', 'immig'].includes(p.id)).map(p => `<button class="policy ${st.pc < p.cost ? 'disabled' : ''}" data-policy="${p.id}"><div class="policy-top"><b>${p.name.toUpperCase()}</b><span class="cost">${p.cost ? p.cost + ' PC' : 'FREE'}</span></div><p>${p.desc}</p></button>`).join('')}</div>`;
  }

  _dashMedia(st) {
    const news = st.news.slice(0, 26);
    return `<div class="kicker">THE PRESS ROOM · WEST WING</div><h2>The Narrative Is Power</h2><p class="lead">Media trust is ${Math.round(st.media)}. Approval is ${Math.round(st.approval)}. The cameras are always on, and the story is being written with or without you.</p>
      <div class="grid-3">
        <div class="card"><h3>MEDIA TRUST</h3><div class="metric">${Math.round(st.media)}<small>%</small></div><div class="meter teal"><i style="width:${st.media}%"></i></div></div>
        <div class="card"><h3>APPROVAL</h3><div class="metric">${Math.round(st.approval)}<small>%</small></div>${sparkline(st.history.approval, '#c8a24a')}</div>
        <div class="card"><h3>PRESS CONFERENCES</h3><button class="policy" data-policy="press" style="margin-top:4px;width:100%"><div class="policy-top"><b>FACE THE PRESS</b><span class="cost">FREE</span></div><p>Call a full press conference. Unscripted. High risk.</p></button></div>
      </div>
      <div class="section-title"><h3>THE WIRE · LIVE</h3><span>${news.length} STORIES</span></div>
      <div class="news-feed">${news.map(n => `<div class="news-item ${n.tone}"><span class="src">${esc(n.source)}</span><span class="head">${esc(n.headline)}</span></div>`).join('')}</div>`;
  }

  _dashClick(e) {
    const policy = e.target.closest('[data-policy]');
    if (policy) { if (policy.classList.contains('disabled')) return; this.sim.runPolicy(policy.dataset.policy); this.renderDashboard(); return; }
    const sel = e.target.closest('[data-dipsel]');
    if (sel) { this.dashCountry = sel.dataset.dipsel; this.renderDashboard(); return; }
    const dip = e.target.closest('[data-dip]');
    if (dip) {
      const id = dip.dataset.country, action = dip.dataset.dip;
      if (action === 'visit') { this.closeAll(); this.startTravel(id); return; }
      if (action === 'home') { this.closeAll(); this.player.returnToDC(); return; }
      if (action === 'dashboard') { return; }
      if (action === 'war') {
        const meta = COUNTRIES.find(c => c.id === id);
        this.confirm(`Declare war on ${meta.name}?`, 'You are about to order American forces into combat. Congress will be notified. Casualties are inevitable.', 'DECLARE WAR', () => { this.sim.diplomacy(id, 'war'); this.renderDashboard(); }, true);
        return;
      }
      this.sim.diplomacy(id, action);
      this.renderDashboard();
      return;
    }
    const op = e.target.closest('[data-op]');
    if (op) {
      const opId = op.dataset.op, target = $(`[data-target-for="${opId}"]`)?.value;
      const meta = COUNTRIES.find(c => c.id === target);
      const def = OPS.find(o => o.id === opId);
      this.confirm(`${def.name} · ${meta.name}`, `${def.desc} Military success depends on readiness, intelligence, and the target’s capabilities.`, 'AUTHORIZE OPERATION', () => {
        this.sim.militaryOp(opId, target); this.renderDashboard();
      }, false);
      return;
    }
    const intel = e.target.closest('[data-intel]');
    if (intel) {
      const opId = intel.dataset.intel, target = $(`[data-target-for="${opId}"]`)?.value;
      const meta = COUNTRIES.find(c => c.id === target);
      const def = INTEL_MISSIONS.find(o => o.id === opId);
      this.confirm(`${def.name} · ${meta.name}`, `${def.desc} If compromised, the operation will become an international incident.`, 'AUTHORIZE COVERT ACTION', () => {
        this.sim.intelOp(opId, target); this.renderDashboard();
      }, true);
      return;
    }
    const defcon = e.target.closest('[data-defcon]');
    if (defcon) { this.sim.setDEFCON(Number(defcon.dataset.defcon)); this.sim.state.manualDefconDay = this.sim.state.day; this.renderDashboard(); return; }
    const nuke = e.target.closest('[data-nuke]');
    if (nuke) {
      const target = $('#nukeTarget')?.value;
      const meta = COUNTRIES.find(c => c.id === target);
      this.nuclearConfirm(meta);
      return;
    }
    const mapBtn = e.target.closest('[data-action="open-map"]');
    if (mapBtn) { this.closeAll(); this.openMap(); }
  }

  // ------------------------------------------------------------ modals
  _modal(html, hold = 'modal') {
    const root = $('#modalRoot');
    root.classList.remove('hidden');
    root.innerHTML = `<div class="modal"><div class="modal-inner">${html}</div></div>`;
    this.setHold(hold, true);
    return root.firstElementChild;
  }

  closeModal(hold = 'modal') {
    const root = $('#modalRoot');
    if (root.classList.contains('hidden')) return;
    root.classList.add('hidden');
    root.innerHTML = '';
    this.setHold('modal', false);
    this.setHold('event', false);
    this.setHold('election', false);
  }

  confirm(title, body, label, onConfirm, danger = false) {
    this._modal(`<div class="cat">EXECUTIVE DECISION</div><h2>${esc(title)}</h2><p>${esc(body)}</p><div class="modal-actions"><button data-mcancel>CANCEL</button><button data-mconfirm class="${danger ? 'danger' : 'primary'}">${esc(label)}</button></div>`);
    const root = $('#modalRoot');
    root.querySelector('[data-mcancel]').onclick = () => this.closeModal();
    root.querySelector('[data-mconfirm]').onclick = () => { this.closeModal(); onConfirm(); };
  }

  nuclearConfirm(meta) {
    this._modal(`<div class="cat" style="color:#e2685e">STRATEGIC RELEASE · EYES ONLY</div><h2>Authorize a nuclear strike on ${esc(meta.name)}?</h2><p>This is not a conventional operation. A nuclear release will kill millions of civilians, trigger retaliation, collapse global markets, and permanently poison American standing in the world. There is no undo.</p><div class="consequence">TARGET: ${esc(meta.capital.toUpperCase())} · DELIVERY: BALLISTIC · AUTHORITY: THE PRESIDENT</div><p class="fine">Type <b style="color:#f0a49d">LAUNCH</b> to unlock the release order.</p><input id="nukeCode" class="start-form" style="width:100%;background:rgba(0,0,0,.35);border:1px solid rgba(196,71,63,.4);color:var(--paper);padding:10px;font-size:13px;letter-spacing:.25em;outline:none;margin-bottom:12px" placeholder="TYPE LAUNCH" autocomplete="off" /><div class="modal-actions"><button data-mcancel>STAND DOWN</button><button data-mconfirm class="danger" disabled style="opacity:.4">AUTHORIZE RELEASE</button></div>`);
    const root = $('#modalRoot');
    const input = root.querySelector('#nukeCode'), btn = root.querySelector('[data-mconfirm]');
    input.addEventListener('input', () => { const ok = input.value.trim().toUpperCase() === 'LAUNCH'; btn.disabled = !ok; btn.style.opacity = ok ? 1 : .4; });
    root.querySelector('[data-mcancel]').onclick = () => this.closeModal();
    btn.onclick = () => { if (btn.disabled) return; this.closeModal(); this.sim.nuclearLaunch(meta.id); this.closeAll(); this.flash(); this.toast('Nuclear release authorized', 'The order has been transmitted. The world will never be the same.', 'bad'); };
  }

  nuclearEffect() {
    this.flash();
    this.player.active = false;
    setTimeout(() => { this.player.active = true; }, 900);
    this.closeAll();
    this._modal(`<div class="cat" style="color:#e2685e">FLASH · NATIONAL EMERGENCY</div><h2>The Order Has Been Carried Out</h2><p>American missiles have struck their target. Retaliation is expected. Markets have halted. The Emergency Broadcast System is live. There are no good outcomes left — only decisions about what remains.</p><div class="consequence">DEFCON 1 · GLOBAL TENSION 100 · NUCLEAR WINTER RISK</div><div class="modal-actions"><button data-mconfirm class="danger">FACE THE CONSEQUENCES</button></div>`);
    $('#modalRoot [data-mconfirm]').onclick = () => this.closeModal();
  }

  flash() {
    const f = $('#flash');
    f.classList.add('on');
    setTimeout(() => f.classList.remove('on'), 160);
    setTimeout(() => { f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 90); }, 250);
  }

  showEvent(ev) {
    this.setHold('event', true);
    this._modal(`<div class="cat">${esc(ev.cat)} · SITUATION ROOM</div><h2>${esc(ev.title)}</h2><p>${esc(ev.body)}</p><div class="modal-choices">${ev.choices.map((c, i) => `<button class="choice" data-choice="${i}"><b>${esc(c.label)}</b><span>${esc(c.hint)}</span></button>`).join('')}</div><p class="fine" style="margin-top:12px">Time is paused. The decision cannot be delegated.</p>`);
    const root = $('#modalRoot');
    root.querySelectorAll('[data-choice]').forEach(btn => {
      btn.onclick = () => {
        const c = ev.choices[Number(btn.dataset.choice)];
        this.sim.applyEffects(c.effects);
        this.sim.addNews(this.sim.state, 'THE WIRE', `The President decides: ${c.label}.`, c.effects.approval >= 0 ? 'neutral' : 'bad');
        this.closeModal();
        this.toast(ev.title, c.hint, c.effects.approval < 0 ? 'bad' : 'good');
        this.renderDashboard(true);
      };
    });
  }

  showElection(ev) {
    this.setHold('election', true);
    this._modal(`<div class="cat">${ev.won ? 'RE-ELECTION' : 'ELECTION NIGHT'} · DECISION 2028</div><h2>${ev.won ? 'Four More Years' : 'The American People Have Spoken'}</h2><p>${ev.won ? 'The map held. The coalition turned out. You have been returned to office with a mandate — and a shorter fuse.' : 'The opposition has won the presidency. The transition will begin at dawn. History will judge the work, not the margin.'}</p><div class="legacy-grid" style="margin:16px 0"><div><span>POPULAR VOTE</span><b>${ev.popVote.toFixed(1)}%</b></div><div><span>ELECTORAL VOTES</span><b>${ev.electoral}</b></div><div><span>APPROVAL</span><b>${Math.round(this.sim.state.approval)}%</b></div><div><span>TERMS WON</span><b>${this.sim.state.electionsWon}</b></div></div><div class="modal-actions"><button data-mconfirm class="${ev.won ? 'primary' : 'danger'}">${ev.won ? 'CLAIM THE MANDATE' : 'BEGIN THE TRANSITION'}</button></div>`);
    $('#modalRoot [data-mconfirm]').onclick = () => {
      this.closeModal();
      if (!ev.won) this.sim.endGame('election', 'The American people chose another direction. Your presidency ends at noon on January 20.');
    };
  }

  showGameOver(g) {
    this.closeAll();
    const st = g.state;
    const title = g.reason === 'impeached' ? 'REMOVED FROM OFFICE' : 'THE PRESIDENCY ENDS';
    $('#goKicker').textContent = title;
    $('#goTitle').textContent = g.reason === 'impeached' ? 'The House Has Spoken' : 'A Nation Moves On';
    $('#goText').textContent = g.text;
    $('#legacyGrid').innerHTML = `<div><span>DAYS IN OFFICE</span><b>${st.day}</b></div><div><span>FINAL APPROVAL</span><b>${Math.round(st.approval)}%</b></div><div><span>ECONOMY</span><b>${Math.round(st.economy)}</b></div><div><span>TERMS WON</span><b>${st.electionsWon}</b></div><div><span>SANCTIONS</span><b>${st.stats.sanctions}</b></div><div><span>OPERATIONS</span><b>${st.stats.ops}</b></div><div><span>SUMMITS</span><b>${st.stats.summits}</b></div><div><span>NUCLEAR</span><b>${st.flags.nuclearUsed ? 'USED' : 'NEVER'}</b></div>`;
    $('#gameOver').classList.remove('hidden');
    $('#hud').classList.add('hidden');
  }

  async openInbox() {
    const st = this.sim.state;
    st.inbox.forEach(m => m.read = true);
    const items = st.inbox.slice().reverse();
    this._modal(`<div class="cat">THE WEST WING · INBOX</div><h2>Papers for the President</h2>${items.length ? items.map(m => `<div style="border-bottom:1px solid rgba(231,217,173,.09);padding:10px 0"><div style="font-size:7px;letter-spacing:.16em;color:var(--gold-2)">${esc(m.from.toUpperCase())} · DAY ${m.day}</div><div style="font-family:var(--serif);font-size:20px;margin:2px 0 3px">${esc(m.subject)}</div><div style="font-size:11px;line-height:1.5;color:var(--paper-dim)">${esc(m.body)}</div></div>`).join('') : '<div class="empty-state">The inbox is empty. Enjoy it.</div>'}<div class="modal-actions"><button data-mconfirm class="primary">CLOSE</button></div>`);
    $('#modalRoot [data-mconfirm]').onclick = () => this.closeModal();
    this.updateMail();
  }

  updateMail() {
    const n = this.sim.state.inbox.filter(m => !m.read).length;
    const b = $('#mailBadge');
    if (!b) return;
    b.textContent = n; b.classList.toggle('hidden', n === 0);
  }

  // ------------------------------------------------------------ travel
  renderTravel() {
    const q = ($('#travelSearch')?.value || '').toLowerCase();
    const list = [...COUNTRIES].filter(c => (c.name + ' ' + c.capital + ' ' + c.region).toLowerCase().includes(q));
    $('#travelCount').textContent = `${list.length} DESTINATIONS`;
    $('#travelGrid').innerHTML = list.map(c => `<button class="travel-card" data-travel="${c.id}"><div class="tc-flag">${flagImg(c.id, c.flag)}</div><div class="tc-name">${esc(c.name)}</div><div class="tc-cap">${esc(c.capital).toUpperCase()}</div><div class="tc-land">${esc(WORLD_CAPITALS[c.id]?.landmark || 'Government district & embassy')}</div><div class="tc-meta"><span>${Math.round(this.sim.state.countries[c.id].rel)} RELATION</span><b>${WORLD_CAPITALS[c.id] ? 'STATE VISIT' : 'DIPLOMATIC VISIT'}</b></div></button>`).join('') || '<div class="empty-state">No destination matches that search.</div>';
    for (const b of $$('#travelGrid [data-travel]')) b.onclick = () => this.startTravel(b.dataset.travel);
  }

  startTravel(countryId) {
    const meta = COUNTRIES.find(c => c.id === countryId);
    if (!meta) return;
    this.overlay = 'travel';
    $('#travelOverlay').classList.remove('hidden');
    this.setHold('travel', true);
    const cine = $('#travelCinematic');
    cine.classList.remove('hidden');
    cine.innerHTML = `<div class="cine-kicker">AIR FORCE ONE · VC-25A</div><div class="cine-route"><span class="cine-dot"></span><i></i><svg><use href="#i-plane"/></svg></div><div class="cine-title">EN ROUTE TO ${esc(meta.capital.toUpperCase())}</div><div class="cine-sub">STATE VISIT · ${esc(meta.name.toUpperCase())}</div><div class="cine-bar"><i></i></div>`;
    setTimeout(() => {
      this.closeOverlay('travel');
      cine.classList.add('hidden');
      this.sim.diplomacy(countryId, 'visit');
      this.player.teleportStage(countryId);
      this.setHold('travel', false);
      this.toast(`Welcome to ${meta.capital}`, `You have arrived for a state visit with ${meta.leader}.`, 'good');
      this.showArrivalTip(meta);
    }, 1900);
  }

  showArrivalTip(meta) {
    const el = $('#tutorial');
    if (!el) return;
    el.classList.remove('hidden');
    $('#tutorialText').innerHTML = `You are in <b>${esc(meta.capital)}</b>. Walk to the leader’s podium to open the bilateral channel, or return to Air Force One to fly home. The world is still moving.`;
    $('#tutorialClose').textContent = 'EXPLORE';
    $('#tutorialClose').onclick = () => el.classList.add('hidden');
    setTimeout(() => el.classList.add('hidden'), 14000);
  }

  returnFromStage() {
    const cine = $('#travelCinematic');
    $('#travelOverlay').classList.remove('hidden');
    this.setHold('travel', true);
    cine.classList.remove('hidden');
    cine.innerHTML = `<div class="cine-kicker">AIR FORCE ONE · RETURN</div><div class="cine-route"><span class="cine-dot"></span><i></i><svg><use href="#i-plane"/></svg></div><div class="cine-title">RETURNING TO WASHINGTON</div><div class="cine-sub">THE WHITE HOUSE · 1600 PENNSYLVANIA AVENUE</div><div class="cine-bar"><i></i></div>`;
    setTimeout(() => {
      this.closeOverlay('travel'); cine.classList.add('hidden');
      this.player.returnToDC();
      this.setHold('travel', false);
    }, 1700);
  }

  // ------------------------------------------------------------ misc
  toast(title, body, tone = 'neutral') {
    const box = $('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (tone === 'bad' ? 'bad' : tone === 'good' ? 'good' : '');
    el.innerHTML = `<div class="toast-title">${esc(title).toUpperCase()}</div>${body ? `<div class="toast-body">${esc(body)}</div>` : ''}`;
    box.appendChild(el);
    while (box.children.length > 4) box.removeChild(box.firstElementChild);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .35s'; setTimeout(() => el.remove(), 380); }, 6200);
  }

  renderTicker() {
    const track = $('#tickerTrack');
    if (!track) return;
    const news = this.sim.state.news.slice(0, 9);
    const text = news.map(n => `${n.source} — ${n.headline}`).join('   ◆   ') || 'The Wire is waiting for the first story.';
    track.textContent = text;
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
  }
}
