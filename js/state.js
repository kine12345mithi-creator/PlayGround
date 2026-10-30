// ---------------------------------------------------------------------------
// THE OVAL — simulation
// ---------------------------------------------------------------------------
import { COUNTRIES, EVENTS, POLICIES, OPS, INTEL_MISSIONS, NEWS_SOURCES } from './data.js';

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const SAVE_KEY = 'the-oval-save-v1';

function initialCountries() {
  const out = {};
  for (const c of COUNTRIES) {
    out[c.id] = {
      rel: c.rel,
      baseRel: c.rel,
      sanction: false,
      allied: false,
      war: false,
      trade: 1,
      tension: 0,
      lastAction: 0,
      visits: 0,
      aid: 0,
    };
  }
  return out;
}

export class Sim {
  constructor() {
    this.listeners = {};
    this.acc = 0;
    this.lastSave = 0;
    this.state = this.fresh();
  }

  fresh(president = 'Jordan Hayes', party = 'Independent') {
    const st = {
      version: 1,
      president,
      party,
      startDate: '2026-01-20',
      day: 1,
      clock: 10.5,
      speed: 1,
      paused: false,
      approval: 54,
      economy: 72,
      unemployment: 4.2,
      inflation: 3.1,
      debt: 34.8,
      treasury: 1.42,
      pc: 72,
      congressional: 48,
      media: 52,
      worldTension: 33,
      readiness: 82,
      intel: 66,
      security: 72,
      border: 62,
      climate: 58,
      polarization: 56,
      defcon: 5,
      scandal: 0,
      protests: 0,
      electionsWon: 0,
      nextElectionDay: 1000,
      lastEventDay: -6,
      lowApprovalDays: 0,
      wars: [],
      history: { approval: [54], economy: [72], tension: [33], media: [52] },
      news: [],
      inbox: [],
      countries: initialCountries(),
      flags: { nuclearUsed: false, martialLaw: false, gameOver: false, firstVisit: {} },
      stats: { actions: 0, sanctions: 0, ops: 0, summits: 0, daysInOffice: 0 },
    };
    this.addNews(st, 'AP', 'Jordan Hayes is sworn in as the 48th President of the United States.', 'neutral');
    this.addNews(st, 'THE WIRE', 'A divided nation watches a new administration take the oath on the Capitol steps.', 'neutral');
    this.addNews(st, 'BLOOMBERG', 'Markets open higher as the transition of power concludes peacefully.', 'good');
    st.inbox.push({
      id: 'welcome', from: 'Chief of Staff', subject: 'The desk is yours',
      body: 'Mr. President — the country is calm, the world is watching, and the clock is already running. Everything in this room is a choice. Open the Oval Office dashboard to govern, or step outside and see the country for yourself.',
      tone: 'neutral', day: 1, read: false,
    });
    return st;
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); return this; }
  emit(evt, data) { for (const fn of this.listeners[evt] || []) fn(data); }

  addNews(st, source, headline, tone = 'neutral') {
    st.news.unshift({ source, headline, tone, day: st.day, t: Date.now() });
    if (st.news.length > 70) st.news.length = 70;
    this.emit('news', { source, headline, tone });
  }

  get date() {
    const d = new Date(this.state.startDate + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + this.state.day - 1);
    return d;
  }

  get clockLabel() {
    const h = Math.floor(this.state.clock) % 24;
    const m = Math.floor((this.state.clock % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  dateLabel() {
    return this.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  shortDate() {
    return this.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  country(id) { return this.state.countries[id]; }
  meta(id) { return COUNTRIES.find(c => c.id === id); }

  relationshipLabel(rel) {
    if (rel >= 85) return 'Ironclad';
    if (rel >= 70) return 'Allied';
    if (rel >= 55) return 'Friendly';
    if (rel >= 40) return 'Cordial';
    if (rel >= 25) return 'Strained';
    if (rel >= 10) return 'Hostile';
    return 'Adversarial';
  }

  relColor(rel) {
    if (rel >= 70) return '#63b8a6';
    if (rel >= 50) return '#8fc7b3';
    if (rel >= 30) return '#d8b36a';
    if (rel >= 15) return '#d98a5f';
    return '#d85c5c';
  }

  politicalGroups() {
    const a = this.state.approval;
    const p = this.state.polarization;
    return [
      { name: 'Base', value: clamp(a + 17 + p * 0.08) },
      { name: 'Independents', value: clamp(a - 3) },
      { name: 'Opposition', value: clamp(100 - a - p * 0.15) },
      { name: 'Young voters', value: clamp(a - 8 + (this.state.climate - 50) * 0.12) },
      { name: 'Seniors', value: clamp(a + 2 - (this.state.inflation - 3) * 1.4) },
    ];
  }

  applyEffects(effects = {}, opts = {}) {
    const st = this.state;
    const map = {
      approval: 'approval', economy: 'economy', unemployment: 'unemployment', inflation: 'inflation',
      debt: 'debt', pc: 'pc', media: 'media', congressional: 'congressional', tension: 'worldTension',
      readiness: 'readiness', intel: 'intel', security: 'security', border: 'border', climate: 'climate',
      polarization: 'polarization', treasury: 'treasury', scandal: 'scandal',
    };
    for (const [k, v] of Object.entries(effects)) {
      if (k === 'rel') {
        for (const [id, delta] of Object.entries(v)) {
          const c = st.countries[id];
          if (c) c.rel = clamp(c.rel + delta, 0, 100);
        }
      } else if (map[k]) {
        const key = map[k];
        if (key === 'debt' || key === 'treasury') st[key] = Math.max(0, st[key] + v);
        else st[key] = clamp(st[key] + v);
      } else if (k === 'risk') {
        st.scandal = clamp(st.scandal + v * 4);
      }
    }
    if (!opts.silent) this.changed();
  }

  changed() {
    const st = this.state;
    st.approval = Math.round(st.approval * 10) / 10;
    st.economy = Math.round(st.economy * 10) / 10;
    st.worldTension = Math.round(st.worldTension * 10) / 10;
    st.media = Math.round(st.media * 10) / 10;
    this.emit('state', st);
  }

  toast(title, body, tone = 'neutral') { this.emit('toast', { title, body, tone }); }

  logAction(label) {
    this.state.stats.actions++;
    this.toast(label, 'The decision has been made. The world is reacting.', 'neutral');
  }

  // ---------------------------------------------------------------- policies
  runPolicy(id) {
    const p = POLICIES.find(x => x.id === id);
    if (!p) return false;
    const st = this.state;
    if (st.pc < p.cost) { this.toast('Not enough political capital', `You need ${p.cost} political capital.`, 'bad'); return false; }
    st.pc = clamp(st.pc - p.cost);
    this.applyEffects(p.effects);
    const head = {
      address: 'In a prime-time address, the President frames the moment and demands action.',
      rally: 'At a packed arena, the President rallies the faithful and attacks the opposition.',
      infra: 'The President signs a $420B infrastructure package into law.',
      tax: 'The middle-class tax cut clears Congress after a marathon session.',
      health: 'A landmark health coverage expansion is signed in the East Room.',
      energy: 'The Energy Independence Act promises lower prices and a new production boom.',
      immig: 'A border security package passes with a fragile bipartisan coalition.',
      press: 'The President faces the press corps for ninety unscripted minutes.',
      purge: 'A Cabinet shake-up removes two secretaries and reshuffles the West Wing.',
      pardon: 'A controversial pardon lands on the front pages.',
    }[id] || 'The President takes executive action.';
    this.addNews(st, 'THE WIRE', head, 'neutral');
    this.logAction(p.name);
    this.save();
    return true;
  }

  // ---------------------------------------------------------------- diplomacy
  diplomacy(id, action) {
    const st = this.state;
    const c = st.countries[id];
    const meta = this.meta(id);
    if (!c || !meta) return false;
    const labels = {
      call: 'Call with ' + meta.leader,
      aid: 'Aid package to ' + meta.name,
      trade: 'Trade talks with ' + meta.name,
      alliance: 'Alliance offer to ' + meta.name,
      sanction: 'Sanctions imposed on ' + meta.name,
      lift: 'Sanctions lifted on ' + meta.name,
      condemn: 'The White House condemns ' + meta.name,
      war: 'Congress notified of war powers against ' + meta.name,
      peace: 'Ceasefire agreed with ' + meta.name,
      visit: 'State visit to ' + meta.capital,
    };
    switch (action) {
      case 'call':
        c.rel = clamp(c.rel + 2.4); st.pc = clamp(st.pc - 1);
        this.toast('Call connected', `A frank conversation with ${meta.leader}. Relations improved slightly.`, 'good');
        this.addNews(st, 'REUTERS', `Readout: the President spoke with ${meta.leader} of ${meta.name}.`, 'neutral');
        break;
      case 'aid':
        if (st.treasury < 0.02) { this.toast('No funds available', 'The foreign assistance account is exhausted.', 'bad'); return false; }
        st.treasury -= 0.02; c.rel = clamp(c.rel + 7); c.aid++;
        st.approval = clamp(st.approval + 0.2);
        this.addNews(st, 'AP', `The U.S. sends a $20B assistance package to ${meta.name}.`, 'good');
        this.toast('Aid delivered', `${meta.name} is grateful — and the world noticed.`, 'good');
        break;
      case 'trade':
        if (c.rel < 35) { this.toast('Talks collapse', `${meta.name} refuses to negotiate while relations are this cold.`, 'bad'); return false; }
        c.rel = clamp(c.rel + 5); c.trade = Math.min(2, c.trade + 0.12); st.economy = clamp(st.economy + 0.3);
        this.addNews(st, 'BLOOMBERG', `A new trade framework with ${meta.name} lifts markets.`, 'good');
        this.toast('Trade framework signed', `Tariffs reduced and market access expanded with ${meta.name}.`, 'good');
        break;
      case 'alliance':
        if (c.rel < 62) { this.toast('Offer declined', `${meta.name} will not formalize an alliance yet.`, 'bad'); return false; }
        if (st.pc < 10) { this.toast('Not enough political capital', 'Alliances cost political capital.', 'bad'); return false; }
        c.allied = true; c.rel = clamp(c.rel + 10); st.pc = clamp(st.pc - 10); st.worldTension = clamp(st.worldTension + 2);
        this.addNews(st, 'REUTERS', `The United States and ${meta.name} sign a mutual defense pact.`, 'good');
        this.toast('Alliance signed', `${meta.name} is now a formal U.S. ally.`, 'good');
        break;
      case 'sanction':
        c.sanction = true; c.rel = clamp(c.rel - 12); c.trade = Math.max(0.2, c.trade - 0.4);
        st.worldTension = clamp(st.worldTension + 5); st.economy = clamp(st.economy - 0.2); st.stats.sanctions++;
        st.approval = clamp(st.approval + (meta.bloc === 'Axis' ? 0.8 : -0.4));
        this.addNews(st, 'BLOOMBERG', `Sweeping sanctions on ${meta.name} freeze assets and restrict exports.`, 'bad');
        this.toast('Sanctions in force', `${meta.name} will retaliate economically.`, 'bad');
        break;
      case 'lift':
        c.sanction = false; c.rel = clamp(c.rel + 6); c.trade = Math.min(1, c.trade + 0.25);
        st.worldTension = clamp(st.worldTension - 3);
        this.addNews(st, 'AP', `The U.S. lifts sanctions on ${meta.name} as relations thaw.`, 'good');
        break;
      case 'condemn':
        c.rel = clamp(c.rel - 6); st.media = clamp(st.media + 0.5); st.worldTension = clamp(st.worldTension + 2);
        this.addNews(st, 'THE WIRE', `The White House condemns ${meta.name} in unusually blunt terms.`, 'bad');
        break;
      case 'war':
        if (c.war) return false;
        if (st.pc < 18) { this.toast('No political mandate', 'Congress will not authorize a war without political capital.', 'bad'); return false; }
        c.war = true; c.rel = clamp(c.rel - 50); st.pc = clamp(st.pc - 18);
        st.wars.push(id); st.worldTension = clamp(st.worldTension + 22);
        st.approval = clamp(st.approval - 2.5); st.economy = clamp(st.economy - 0.8); st.readiness = clamp(st.readiness - 6);
        st.defcon = Math.min(st.defcon, 3);
        this.addNews(st, 'AP', `BREAKING: The United States declares war on ${meta.name}.`, 'bad');
        this.addNews(st, 'BBC', 'World leaders condemn the American escalation and call for restraint.', 'bad');
        this.toast('War declared', `The United States is now at war with ${meta.name}.`, 'bad');
        break;
      case 'peace':
        if (!c.war) return false;
        c.war = false; c.rel = clamp(c.rel + 12); st.wars = st.wars.filter(x => x !== id);
        st.worldTension = clamp(st.worldTension - 12); st.approval = clamp(st.approval + 1.6); st.pc = clamp(st.pc - 8);
        this.addNews(st, 'REUTERS', `A ceasefire with ${meta.name} takes effect at midnight.`, 'good');
        this.toast('Ceasefire', `The war with ${meta.name} is over.`, 'good');
        break;
      case 'visit':
        c.rel = clamp(c.rel + (c.visits ? 3 : 6)); c.visits++; st.stats.summits++;
        st.approval = clamp(st.approval + 0.5); st.media = clamp(st.media + 0.6);
        this.addNews(st, 'AP', `The President arrives in ${meta.capital} for a state visit with ${meta.leader}.`, 'good');
        break;
      default: return false;
    }
    this.changed();
    this.save();
    return true;
  }

  // ---------------------------------------------------------------- military
  militaryOp(opId, targetId) {
    const op = OPS.find(o => o.id === opId);
    const st = this.state;
    const c = st.countries[targetId];
    const meta = this.meta(targetId);
    if (!op || !c) return false;
    if (st.pc < op.cost) { this.toast('Not enough political capital', `You need ${op.cost} PC for this operation.`, 'bad'); return false; }
    st.pc = clamp(st.pc - op.cost);
    const chance = clamp(op.success + (st.readiness - 60) / 260 - (meta.military - 40) / 300 + (st.intel - 50) / 400, 0.15, 0.97);
    const success = Math.random() < chance;
    this.applyEffects(op.effects, { silent: true });
    st.stats.ops++;
    if (success) {
      st.approval = clamp(st.approval + 1.2 + (op.id === 'evac' ? 1 : 0));
      st.readiness = clamp(st.readiness - (op.id === 'drill' ? 0 : 2));
      this.addNews(st, 'AP', `Operation confirmed: U.S. forces complete a ${op.name.toLowerCase()} against ${meta.name}.`, 'good');
      this.toast('Operation successful', `${op.name} — objectives achieved.`, 'good');
    } else {
      st.approval = clamp(st.approval - 2.6);
      st.readiness = clamp(st.readiness - 7);
      c.rel = clamp(c.rel - 8);
      st.worldTension = clamp(st.worldTension + 8);
      this.addNews(st, 'BBC', `U.S. operation against ${meta.name} goes wrong; casualties reported.`, 'bad');
      this.toast('Operation failed', 'The mission went badly. The world is demanding answers.', 'bad');
    }
    this.changed();
    this.save();
    return { success, chance };
  }

  intelOp(opId, targetId) {
    const op = INTEL_MISSIONS.find(o => o.id === opId);
    const st = this.state;
    const c = st.countries[targetId];
    const meta = this.meta(targetId);
    if (!op || !c) return false;
    if (st.pc < op.cost) { this.toast('Not enough political capital', '', 'bad'); return false; }
    st.pc = clamp(st.pc - op.cost);
    const chance = clamp(0.35 + st.intel / 180 - op.risk, 0.12, 0.94);
    const success = Math.random() < chance;
    if (success) {
      st.intel = clamp(st.intel + 2.4);
      if (op.id === 'surveil') { c.rel = clamp(c.rel - 1.5); st.readiness = clamp(st.readiness + 1); }
      if (op.id === 'extract') { st.media = clamp(st.media + 0.6); }
      if (op.id === 'sabotage') { st.worldTension = clamp(st.worldTension + 4); c.rel = clamp(c.rel - 5); }
      if (op.id === 'disinfo') { c.tension = clamp(c.tension + 5); }
      this.addNews(st, 'THE WIRE', `Sources: a covert U.S. operation inside ${meta.name} has been completed.`, 'neutral');
      this.toast('Asset reports success', `The ${op.name.toLowerCase()} inside ${meta.name} went undetected.`, 'good');
    } else {
      st.intel = clamp(st.intel - 5);
      c.rel = clamp(c.rel - 7);
      st.worldTension = clamp(st.worldTension + 5);
      st.media = clamp(st.media - 1.2);
      this.addNews(st, 'BBC', `A covert American operation inside ${meta.name} has been exposed.`, 'bad');
      this.toast('Operation exposed', `The ${op.name.toLowerCase()} was compromised. ${meta.name} is furious.`, 'bad');
    }
    this.changed();
    this.save();
    return { success, chance };
  }

  setDEFCON(n) {
    const st = this.state;
    st.defcon = clamp(Math.round(n), 1, 5);
    this.addNews(st, 'AP', `U.S. strategic forces move to DEFCON ${st.defcon}.`, st.defcon <= 2 ? 'bad' : 'neutral');
    this.changed();
    this.save();
  }

  nuclearLaunch(targetId) {
    const st = this.state;
    const meta = this.meta(targetId);
    if (!meta) return false;
    st.flags.nuclearUsed = true;
    st.defcon = 1;
    st.worldTension = 100;
    st.approval = clamp(st.approval - 32);
    st.economy = clamp(st.economy - 28);
    st.media = clamp(st.media - 24);
    st.climate = clamp(st.climate - 26);
    st.pc = clamp(st.pc - 40);
    st.scandal = clamp(st.scandal + 20);
    for (const c of Object.values(st.countries)) c.rel = clamp(c.rel - 38);
    st.countries[targetId].rel = 0;
    st.countries[targetId].war = true;
    st.wars.push(targetId);
    this.addNews(st, 'AP', `FLASH: U.S. nuclear strike on ${meta.name}. Millions feared dead.`, 'bad');
    this.addNews(st, 'BBC', 'The world enters uncharted territory. Retaliation is expected within minutes.', 'bad');
    this.toast('Nuclear release authorized', 'There is no undoing this.', 'bad');
    this.changed();
    this.save();
    this.emit('nuclear', { target: meta });
    return true;
  }

  // ---------------------------------------------------------------- tick
  update(dt) {
    const st = this.state;
    if (st.paused || st.flags.gameOver) return;
    const perDay = 4.2; // seconds per simulated day at 1x
    this.acc += dt * st.speed;
    st.clock += dt * st.speed * 0.55;
    if (st.clock >= 24) { st.clock -= 24; }
    while (this.acc >= perDay) {
      this.acc -= perDay;
      this.tickDay();
    }
  }

  tickDay() {
    const st = this.state;
    st.day++;
    st.stats.daysInOffice = st.day;
    const r = Math.random;

    // economy
    const econTarget = 66 + (st.congressional - 50) * 0.12 + (st.media - 50) * 0.06 - st.wars.length * 2.2 - (st.flags.nuclearUsed ? 16 : 0);
    st.economy = clamp(st.economy + clamp(econTarget - st.economy, -1.4, 1.4) * 0.07 + rnd(-0.25, 0.25));
    st.unemployment = clamp(st.unemployment + rnd(-0.05, 0.05) + (st.economy < 50 ? 0.03 : -0.02), 2.2, 18);
    st.inflation = clamp(st.inflation + rnd(-0.04, 0.04) + (st.economy > 80 ? 0.02 : -0.01) + st.wars.length * 0.01, 0.4, 16);
    st.debt = Math.round((st.debt + 0.004 + st.wars.length * 0.008) * 1000) / 1000;
    st.treasury = Math.max(0, st.treasury - 0.0007 + (st.economy - 60) * 0.000012);

    // approval
    const warPenalty = st.wars.reduce((n, id) => n + (st.countries[id]?.rel < 5 ? 1.4 : 2.4), 0);
    const target = 44 + (st.economy - 60) * 0.34 - (st.unemployment - 4.2) * 2.0
      - (st.inflation - 3.1) * 1.8 - (st.worldTension - 30) * 0.12
      + (st.media - 50) * 0.10 + (st.congressional - 50) * 0.05
      - st.protests * 0.10 - st.scandal * 0.12 - warPenalty
      + (st.flags.nuclearUsed ? -22 : 0);
    const drift = clamp(target - st.approval, -0.55, 0.55);
    st.approval = clamp(st.approval + drift * 0.55);

    // institutions
    st.media = clamp(st.media + clamp((st.approval - 50) * 0.05 - st.scandal * 0.04 + rnd(-0.18, 0.18), -0.4, 0.4));
    st.congressional = clamp(st.congressional + clamp((st.approval - 48) * 0.04 + rnd(-0.16, 0.16), -0.35, 0.35));
    st.polarization = clamp(st.polarization + (st.media < 40 ? 0.05 : -0.02) + (st.wars.length ? 0.04 : 0));

    // protests
    const protestTarget = clamp((52 - st.approval) * 2.0 + st.polarization * 0.28 + st.wars.length * 9 + st.scandal * 0.4 + (st.flags.nuclearUsed ? 25 : 0), 0, 100);
    st.protests = clamp(st.protests + (protestTarget - st.protests) * 0.10);

    // relationship drift + hostile AI
    let hostility = 0;
    for (const c of Object.values(st.countries)) {
      if (!c.war && !c.allied) {
        const driftTo = c.baseRel < 30 ? c.baseRel - (st.wars.length ? 5 : 0) : c.baseRel + (c.sanction ? -4 : 0) + (st.worldTension > 60 ? -2 : 0);
        c.rel = clamp(c.rel + clamp(driftTo - c.rel, -0.2, 0.2));
      }
      if (c.war) c.rel = clamp(c.rel - 0.08);
      hostility += (100 - c.rel) / 100;
    }
    st.worldTension = clamp(st.worldTension + (hostility / COUNTRIES.length - 0.42) * 0.5 + st.wars.length * 0.18 + (st.flags.nuclearUsed ? 0.5 : 0), 0, 100);
    st.worldTension = Math.round(st.worldTension * 10) / 10;

    // defcon follows tension unless manually overridden recently
    const tensionDefcon = st.worldTension > 88 ? 1 : st.worldTension > 74 ? 2 : st.worldTension > 58 ? 3 : st.worldTension > 42 ? 4 : 5;
    if (!st.manualDefconDay || st.day - st.manualDefconDay > 6) st.defcon = Math.min(st.defcon, tensionDefcon);
    if (st.defcon > tensionDefcon && st.worldTension < 40) st.defcon = Math.min(5, st.defcon + 0.03);

    // readiness drifts
    st.readiness = clamp(st.readiness + (st.wars.length ? -0.08 : 0.06));
    st.security = clamp(st.security + (st.polarization > 65 ? -0.02 : 0.01));
    st.scandal = clamp(st.scandal - 0.06);

    // low approval / impeachment pressure
    if (st.approval < 22 && st.congressional < 38) st.lowApprovalDays++; else st.lowApprovalDays = 0;
    if (st.lowApprovalDays === 20) {
      this.addNews(st, 'POLITICO', 'Senior lawmakers privately discuss a vote of no confidence.', 'bad');
      st.inbox.push({ id: 'impeach-' + st.day, from: 'Speaker of the House', subject: 'A warning', body: 'Mr. President, the caucus is restless. If your numbers do not improve, I cannot guarantee the floor. This is not a threat. It is arithmetic.', tone: 'bad', day: st.day, read: false });
      this.emit('inbox');
    }
    if (st.lowApprovalDays >= 45) {
      this.endGame('impeached', 'The House has voted to impeach. The Senate has convicted. Your presidency is over.');
      return;
    }

    // random world event
    if (st.day - st.lastEventDay > 8 && Math.random() < 0.075) {
      st.lastEventDay = st.day;
      const ev = { ...pick(EVENTS), day: st.day };
      this.emit('event', ev);
      this.addNews(st, 'BREAKING', ev.title, 'bad');
    }

    // hostile state action
    this.rivalAction();

    // periodic economic / media chatter
    if (Math.random() < 0.45) {
      const r = Math.random();
      if (r < 0.3) this.addNews(st, pick(NEWS_SOURCES), pick([
        'Markets close mixed as investors weigh the White House agenda.',
        'New polling shows the President’s approval holding steady.',
        'The Federal Reserve signals patience on interest rates.',
        'Consumer confidence ticks up in the latest survey.',
        'A key manufacturing report beats expectations.',
      ]), 'neutral');
      else if (r < 0.55) this.addNews(st, pick(NEWS_SOURCES), pick([
        'The President’s schedule is dominated by national security briefings.',
        'A new foreign policy speech is being drafted in the West Wing.',
        'Senior officials deny a rift inside the Cabinet.',
        'The White House announces a new round of diplomatic travel.',
      ]), 'neutral');
      else if (r < 0.8 && st.protests > 20) this.addNews(st, pick(NEWS_SOURCES), 'Protests continue outside the White House as organizers vow to stay.', 'bad');
      else this.addNews(st, pick(NEWS_SOURCES), pick([
        'The President’s approval rating is the subject of a new battleground-state poll.',
        'A late-night vote in the Senate tests the administration’s coalition.',
        'The world waits for the next American move.',
      ]), 'neutral');
    }

    // history
    const h = st.history;
    h.approval.push(Math.round(st.approval * 10) / 10);
    h.economy.push(Math.round(st.economy * 10) / 10);
    h.tension.push(Math.round(st.worldTension * 10) / 10);
    h.media.push(Math.round(st.media * 10) / 10);
    for (const k of Object.keys(h)) if (h[k].length > 120) h[k].shift();

    // election
    if (st.day >= st.nextElectionDay && !st.flags.gameOver) this.holdElection();

    // save every 12 days
    if (st.day % 6 === 0) this.save();
    this.changed();
  }

  rivalAction() {
    const st = this.state;
    const candidates = COUNTRIES.filter(c => st.countries[c.id].rel < 26 && !st.countries[c.id].war && c.id !== 'USA');
    if (!candidates.length || Math.random() > 0.075) return;
    const meta = pick(candidates);
    const c = st.countries[meta.id];
    if (st.day - c.lastAction < 24) return;
    c.lastAction = st.day;
    const roll = Math.random();
    if (roll < 0.25) {
      c.rel = clamp(c.rel - 3);
      st.worldTension = clamp(st.worldTension + 6);
      this.addNews(st, 'REUTERS', `${meta.name} announces new military exercises near a contested border.`, 'bad');
    } else if (roll < 0.5) {
      st.intel = clamp(st.intel - 3);
      st.media = clamp(st.media - 0.6);
      this.addNews(st, 'THE WIRE', `A cyber intrusion traced to ${meta.name} hits federal networks.`, 'bad');
      this.toast('Cyber intrusion', `Federal systems were probed by actors linked to ${meta.name}.`, 'bad');
    } else if (roll < 0.7) {
      c.rel = clamp(c.rel - 2); st.economy = clamp(st.economy - 0.2);
      this.addNews(st, 'BLOOMBERG', `${meta.name} restricts exports of critical minerals to the U.S.`, 'bad');
    } else if (roll < 0.86) {
      st.worldTension = clamp(st.worldTension + 4);
      this.addNews(st, 'BBC', `${meta.name} expels two American diplomats in a tit-for-tat move.`, 'bad');
    } else {
      st.worldTension = clamp(st.worldTension + 8);
      this.addNews(st, 'AP', `A shadowy group aligned with ${meta.name} attacks a U.S. logistics convoy. No American deaths reported.`, 'bad');
    }
    this.changed();
  }

  holdElection() {
    const st = this.state;
    const econ = st.economy;
    const approval = st.approval;
    const chance = clamp(0.22 + (approval - 45) / 100 + (econ - 60) / 130 - st.wars.length * 0.04 - st.scandal * 0.01 - (st.flags.nuclearUsed ? 0.3 : 0), 0.05, 0.94);
    const won = Math.random() < chance;
    const popVote = clamp(48 + (approval - 50) * 0.42 + rnd(-2.5, 2.5), 28, 72);
    const ev = {
      won, chance, popVote,
      electoral: won ? Math.round(270 + (popVote - 48) * 9 + rnd(5, 30)) : Math.round(268 - (50 - popVote) * 7 - rnd(5, 25)),
      stateWins: [],
    };
    ev.electoral = Math.max(120, Math.min(430, ev.electoral));
    if (won) {
      st.electionsWon++;
      st.nextElectionDay = st.day + 1460;
      st.pc = clamp(st.pc + 18);
      st.approval = clamp(st.approval + 4);
      st.inbox.push({ id: 'elect-' + st.day, from: 'Campaign Manager', subject: 'Four more years', body: 'We did it. The map held, the coalition turned out, and the opposition is in shock. Do not waste the mandate.', tone: 'good', day: st.day, read: false });
      this.addNews(st, 'AP', `PROJECTED WINNER: President ${st.president} wins re-election.`, 'good');
      this.emit('election', ev);
    } else {
      this.addNews(st, 'AP', `PROJECTED WINNER: The opposition wins the presidency. President ${st.president} concedes.`, 'bad');
      this.emit('election', ev);
    }
    this.changed();
    this.save();
  }

  endGame(reason, text) {
    if (this.state.flags.gameOver) return;
    this.state.flags.gameOver = true;
    this.state.gameOverReason = reason;
    this.emit('gameover', { reason, text, state: this.state });
  }

  // ---------------------------------------------------------------- save
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch {}
  }

  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== 1) return false;
      // merge country defaults for forward compatibility
      const base = initialCountries();
      data.countries = data.countries || {};
      for (const id of Object.keys(base)) data.countries[id] = { ...base[id], ...(data.countries[id] || {}) };
      data.flags = data.flags || this.fresh().flags;
      data.history = data.history || this.fresh().history;
      this.state = data;
      this.acc = 0;
      this.changed();
      return true;
    } catch { return false; }
  }

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    this.state = this.fresh();
    this.acc = 0;
    this.changed();
  }

  setPresident(name, party) {
    this.state.president = name || 'Jordan Hayes';
    this.state.party = party || 'Independent';
    this.changed();
  }
}
