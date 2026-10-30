// ---------------------------------------------------------------------------
// Player, vehicles and camera
// ---------------------------------------------------------------------------
import * as THREE from '../vendor/three.module.js';
import { createPresident } from './models.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const lerp = (a, b, t) => a + (b - a) * t;

export class Player {
  constructor(scene, camera, world, sim, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.sim = sim;
    this.renderer = renderer;
    this.character = createPresident();
    const spawn = world.startPos || { x: 269, z: 47, heading: 0 };
    this.character.position.set(spawn.x, world.heightAt(spawn.x, spawn.z) + 0.16, spawn.z);
    scene.add(this.character);
    this.pos = this.character.position;
    this.heading = spawn.heading;
    this.mode = 'usa';
    this.vehicle = null;
    this.speed = 0;
    this.vertSpeed = 0;
    this.altitude = 0;
    this.jump = 0;
    this.jumpVel = 0;
    this.move = { x: 0, y: 0 };
    this.camYaw = 0;
    this.camPitch = 0.16;
    this.vehLook = 0;
    this.vehPitch = 0;
    this.walkT = 0;
    this.moving = false;
    this.prompt = null;
    this.tiltEnabled = false;
    this.tilt = { beta: 0, gamma: 0 };
    this.keys = new Set();
    this.active = false;
    this.touchLookId = null;
    this.lastPointer = null;
    this.onAction = null;
    const sy = world.heightAt(spawn.x, spawn.z);
    this.camPos = new THREE.Vector3(spawn.x, sy + 8, spawn.z + 9);
    this.camLook = new THREE.Vector3(spawn.x, sy + 2, spawn.z);
    this.tmp = new THREE.Vector3();
    this._bindKeys();
    this.world.setMode('usa');
    this.snapCamera();
  }

  _bindKeys() {
    window.addEventListener('keydown', e => {
      if (!this.active) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'shift', ' '].includes(k)) e.preventDefault();
      this.keys.add(k);
      if (k === 'e' || k === 'enter') this.interact();
      if (k === 'f') this.enterExit();
      if (k === ' ') this.jumpPress();
      if (k === 'm' && this.onAction) this.onAction({ type: 'map' });
      if (k === 'o' && this.onAction) this.onAction({ type: 'dashboard' });
      if (k === 'escape' && this.onAction) this.onAction({ type: 'escape' });
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
  }

  setMove(x, y) { this.move.x = clamp(x, -1, 1); this.move.y = clamp(y, -1, 1); }

  look(dx, dy) {
    if (this.vehicle) { this.vehLook -= dx * 0.004; this.vehPitch = clamp(this.vehPitch - dy * 0.003, -0.3, 0.7); }
    else { this.camYaw -= dx * 0.0045; this.camPitch = clamp(this.camPitch - dy * 0.0035, -0.25, 0.9); }
  }

  async enableTilt(want) {
    if (!want) { this.tiltEnabled = false; return false; }
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') return false;
      }
      window.addEventListener('deviceorientation', e => {
        this.tilt.beta = e.beta || 0; this.tilt.gamma = e.gamma || 0;
      });
      this.tiltEnabled = true;
      return true;
    } catch { return false; }
  }

  interact() {
    if (!this.active) return;
    if (this.vehicle) { this.enterExit(); return; }
    const it = this.world.nearestInteractable(this.pos.x, this.pos.z, this.mode, 4.2);
    if (it) { this._doAction(it); return; }
    const v = this.world.vehicleNear(this.pos.x, this.pos.z, 5.6);
    if (v) { this.enterVehicle(v); return; }
    if (this.onAction) this.onAction({ type: 'nothing' });
  }

  _doAction(it) {
    if (it.action === 'interior' || it.id === 'white-house') { this.enterInterior(); return; }
    if (it.id === 'oval-desk') { this.onAction?.({ type: 'dashboard' }); return; }
    if (it.id === 'oval-exit') { this.exitInterior(); return; }
    if (it.action === 'travel') { this.onAction?.({ type: 'travel' }); return; }
    if (it.action === 'summit') { this.onAction?.({ type: 'summit', country: it.country }); return; }
    if (it.action === 'return') { this.returnToDC(); return; }
    if (it.action === 'vehicle') { this.enterVehicle(it.vehicle); return; }
  }

  enterExit() {
    if (this.vehicle) this.exitVehicle();
    else {
      const v = this.world.vehicleNear(this.pos.x, this.pos.z, 5.6);
      if (v) this.enterVehicle(v);
    }
  }

  jumpPress() {
    if (this.vehicle) {
      if (this.vehicle.userData.type === 'heli') this.vertSpeed = 12;
      return;
    }
    if (this.jump <= 0.01) { this.jumpVel = 5.4; this.jump = 0.01; }
  }

  brakePress() {
    if (this.vehicle?.userData.type === 'heli') { this.vertSpeed = -10; return; }
    if (this.vehicle) this.speed *= 0.82;
  }

  enterVehicle(v) {
    if (!v) return;
    this.vehicle = v;
    this.character.visible = false;
    this.speed = 0;
    const type = v.userData.type;
    if (type === 'heli') {
      this.altitude = Math.max(v.position.y + 1.4, this.world.heightAt(v.position.x, v.position.z) + 2.2);
      this.vertSpeed = 0;
    } else {
      v.position.y = this.world.heightAt(v.position.x, v.position.z) + 0.18;
    }
    this.camYaw = v.rotation.y + Math.PI;
    this.vehLook = 0; this.vehPitch = 0;
    this.onAction?.({ type: 'enterVehicle', kind: type });
  }

  exitVehicle() {
    const v = this.vehicle;
    if (!v) return;
    if (v.userData.type === 'heli') {
      const ground = this.world.heightAt(v.position.x, v.position.z);
      if (this.altitude > ground + 5.5) { this.onAction?.({ type: 'toast', tone: 'bad', title: 'Set her down first', body: 'Marine One must be on the ground to disembark.' }); return; }
    }
    const right = new THREE.Vector3(Math.cos(v.rotation.y), 0, -Math.sin(v.rotation.y));
    let ex = v.position.x + right.x * 3.4, ez = v.position.z + right.z * 3.4;
    if (this.world.heightAt(ex, ez) < 0.45) { ex = v.position.x - right.x * 3.4; ez = v.position.z - right.z * 3.4; }
    this.pos.set(ex, this.world.heightAt(ex, ez) + 0.16, ez);
    this.character.visible = true;
    this.heading = v.rotation.y;
    this.vehicle = null;
    this.camYaw = this.heading + Math.PI;
    this.onAction?.({ type: 'exitVehicle' });
  }

  enterInterior() {
    this.mode = 'interior';
    this.world.setMode('interior');
    this.pos.set(6000, 0.16, 6002);
    this.heading = Math.PI;
    this.camYaw = 0;
    this.character.visible = true;
    this.snapCamera();
    this.onAction?.({ type: 'interior' });
  }

  exitInterior() {
    this.mode = 'usa';
    this.world.setMode('usa');
    const y = this.world.heightAt(257, 21);
    this.pos.set(257, y + 0.16, 21);
    this.heading = 0;
    this.camYaw = Math.PI;
    this.snapCamera();
    this.onAction?.({ type: 'exitInterior' });
  }

  returnToDC() {
    this.mode = 'usa';
    this.world.setMode('usa');
    const spawn = this.world.startPos || { x: 269, z: 47, heading: 0 };
    this.pos.set(spawn.x, this.world.heightAt(spawn.x, spawn.z) + 0.16, spawn.z);
    this.heading = spawn.heading;
    this.camYaw = 0;
    this.character.visible = true;
    this.vehicle = null;
    this.snapCamera();
    this.onAction?.({ type: 'returnDC' });
  }

  teleportStage(country) {
    this.mode = 'stage';
    this.world.setMode('stage', country);
    const spawn = this.world.stageStart || { x: 3200, z: 1552, heading: Math.PI };
    this.pos.set(spawn.x, 1.9, spawn.z);
    this.heading = spawn.heading;
    this.camYaw = 0;
    this.character.visible = true;
    this.vehicle = null;
    this.snapCamera();
  }

  teleportCity(id) {
    const cd = this.world.cityData[id];
    if (!cd) return false;
    if (this.mode !== 'usa') this.world.setMode('usa');
    this.mode = 'usa';
    if (this.vehicle) { this.vehicle = null; this.character.visible = true; }
    const dx = id === 'dc' ? 0 : 0;
    const px = cd.x + dx, pz = cd.z + 46;
    this.pos.set(px, this.world.heightAt(px, pz) + 0.16, pz);
    this.heading = Math.PI;
    this.camYaw = 0;
    this.snapCamera();
    return true;
  }

  snapCamera() {
    const target = this.pos;
    const cy = this.mode === 'interior' ? 3.1 : 4.6;
    this.camPos.set(target.x + Math.sin(this.camYaw) * 9, target.y + cy, target.z + Math.cos(this.camYaw) * 9);
    this.camLook.set(target.x, target.y + 1.8, target.z);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  // ------------------------------------------------------------ update
  update(dt) {
    if (!this.active) return;
    this._keyboardInput();
    if (this.tiltEnabled) this._tiltInput(dt);
    if (this.vehicle) this._updateVehicle(dt);
    else this._updateFoot(dt);
    this._updateCamera(dt);
    this._updatePrompt();
  }

  _keyboardInput() {
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('w') || k.has('arrowup')) y += 1;
    if (k.has('s') || k.has('arrowdown')) y -= 1;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (x || y) {
      const l = Math.hypot(x, y);
      this.move.x = x / l; this.move.y = y / l;
    } else if (!this._touchHeld) {
      this.move.x *= 0.72; this.move.y *= 0.72;
      if (Math.abs(this.move.x) < 0.02) this.move.x = 0;
      if (Math.abs(this.move.y) < 0.02) this.move.y = 0;
    }
  }

  setMoveHeld(held) { this._touchHeld = held; }

  _tiltInput(dt) {
    const g = clamp(this.tilt.gamma / 28, -1, 1);
    const b = clamp((this.tilt.beta - 40) / 35, -1, 1);
    if (this.vehicle) {
      this.move.x = clamp(this.move.x + g, -1, 1);
      if (this.vehicle.userData.type === 'heli') this.move.y = clamp(this.move.y - b * 0.5, -1, 1);
    } else {
      this.camYaw += g * dt * 1.1;
      if (!this._touchHeld && Math.abs(g) > 0.25) { this.move.x = clamp(this.move.x + g * 0.55, -1, 1); this.move.y = clamp(this.move.y - b * 0.4, -1, 1); }
    }
  }

  _updateFoot(dt) {
    const mag = Math.hypot(this.move.x, this.move.y);
    this.moving = mag > 0.06;
    const sprint = this.keys.has('shift') || mag > 0.92;
    const speed = (this.mode === 'interior' ? 3.5 : sprint ? 12 : 7.4);
    if (this.moving) {
      const fwdX = -Math.sin(this.camYaw), fwdZ = -Math.cos(this.camYaw);
      const rightX = Math.cos(this.camYaw), rightZ = -Math.sin(this.camYaw);
      let dx = fwdX * this.move.y + rightX * this.move.x;
      let dz = fwdZ * this.move.y + rightZ * this.move.x;
      const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      this.heading = Math.atan2(dx, dz);
      let nx = this.pos.x + dx * speed * dt * Math.min(1, mag);
      let nz = this.pos.z + dz * speed * dt * Math.min(1, mag);
      const ground = this.world.heightAt(nx, nz);
      if (this.mode !== 'interior' && ground < 0.32) { nx = this.pos.x; nz = this.pos.z; }
      if (this.mode === 'interior') {
        const dxr = (nx - 6000) / 11.7, dzr = (nz - 6000) / 7.7;
        const rr = Math.hypot(dxr, dzr);
        if (rr > 1) { nx = 6000 + dxr / rr * 11.7; nz = 6000 + dzr / rr * 7.7; }
      }
      const resolved = this.world.resolveCollision(nx, nz, 0.5);
      this.pos.x = resolved.x; this.pos.z = resolved.z;
      this.walkT += dt * (sprint ? 13 : 9);
    } else {
      this.walkT += dt * 2;
    }
    // jump
    if (this.jump > 0) {
      this.jump += this.jumpVel * dt;
      this.jumpVel -= 16 * dt;
      if (this.jump <= 0) { this.jump = 0; this.jumpVel = 0; }
    }
    const ground = this.mode === 'interior' ? 0.02 : this.world.heightAt(this.pos.x, this.pos.z);
    this.pos.y = ground + 0.16 + this.jump;
    this.character.position.copy(this.pos);
    this.character.rotation.y = this.heading;
    const swing = this.moving ? Math.sin(this.walkT) * 0.5 : 0;
    const u = this.character.userData;
    u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
    u.armL.rotation.x = -swing * 0.8; u.armR.rotation.x = swing * 0.8;
    this.character.position.y += this.moving ? Math.abs(Math.sin(this.walkT)) * 0.05 : Math.sin(this.walkT * 0.5) * 0.015;
    this.sim.state.heading = this.heading;
    this._updateExhaust(dt, false);
  }

  _updateVehicle(dt) {
    const v = this.vehicle;
    const type = v.userData.type;
    if (type === 'car') {
      const throttle = this.move.y;
      const steer = this.move.x;
      const max = 52;
      if (throttle > 0.05) this.speed += throttle * 30 * dt;
      else if (throttle < -0.05) this.speed += throttle * 22 * dt;
      else this.speed *= Math.max(0, 1 - 0.9 * dt);
      this.speed = clamp(this.speed, -18, max);
      this.speed *= Math.max(0, 1 - 0.35 * dt);
      const steerRate = (0.55 + Math.min(1, Math.abs(this.speed) / 24) * 1.4) * (this.speed < 0 ? -1 : 1);
      v.rotation.y -= steer * steerRate * dt;
      const fx = Math.sin(v.rotation.y), fz = Math.cos(v.rotation.y);
      let nx = v.position.x + fx * this.speed * dt;
      let nz = v.position.z + fz * this.speed * dt;
      const ground = this.world.heightAt(nx, nz);
      if (ground < 0.4) { this.speed *= -0.2; nx = v.position.x; nz = v.position.z; }
      const res = this.world.resolveCollision(nx, nz, 1.8);
      if (res.x !== nx || res.z !== nz) this.speed *= 0.25;
      v.position.x = res.x; v.position.z = res.z;
      v.position.y = this.world.heightAt(res.x, res.z) + 0.18;
      // pitch to slope
      const ahead = this.world.heightAt(res.x + fx * 2, res.z + fz * 2);
      const behind = this.world.heightAt(res.x - fx * 2, res.z - fz * 2);
      v.rotation.x = damp(v.rotation.x, -Math.atan2(ahead - behind, 4) * 0.55, 4, dt);
      const wheels = v.userData.wheels || [];
      for (const w of wheels) w.rotation.x += this.speed * dt * 1.2;
      this.pos.set(v.position.x, v.position.y + 1.2, v.position.z);
      this.heading = v.rotation.y;
      this.sim.state.heading = this.heading;
      this.onAction?.({ type: 'speed', value: Math.abs(this.speed) / max });
    } else if (type === 'heli') {
      const fwdX = -Math.sin(this.camYaw), fwdZ = -Math.cos(this.camYaw);
      const rightX = Math.cos(this.camYaw), rightZ = -Math.sin(this.camYaw);
      const moveX = fwdX * this.move.y + rightX * this.move.x;
      const moveZ = fwdZ * this.move.y + rightZ * this.move.x;
      const ground = this.world.heightAt(v.position.x, v.position.z);
      this.altitude = Math.max(ground + 1.6, this.altitude + this.vertSpeed * dt);
      this.vertSpeed *= Math.max(0, 1 - 1.8 * dt);
      const mag = Math.hypot(moveX, moveZ);
      if (mag > 0.05) {
        const speed = 52 * Math.min(1, mag);
        v.position.x += moveX * speed * dt;
        v.position.z += moveZ * speed * dt;
        const targetRot = Math.atan2(moveX, moveZ);
        let diff = ((targetRot - v.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        v.rotation.y += clamp(diff, -1.8 * dt, 1.8 * dt);
        v.rotation.z = damp(v.rotation.z, -clamp(diff, -0.4, 0.4) * 0.5, 3, dt);
      } else {
        v.rotation.z = damp(v.rotation.z, Math.sin(this.world.time * 0.7) * 0.02, 2, dt);
      }
      this.altitude = clamp(this.altitude, ground + 1.6, 320);
      v.position.y = this.altitude;
      v.userData.rotor.rotation.y += dt * 42;
      v.userData.tailRotor.rotation.x += dt * 55;
      this.pos.set(v.position.x, v.position.y + 1.6, v.position.z);
      this.heading = v.rotation.y;
      this.sim.state.heading = this.heading;
      this.onAction?.({ type: 'altitude', value: Math.round(this.altitude - ground) });
    }
  }

  _updateExhaust(dt, heli) {}

  _updateCamera(dt) {
    let targetPos = this.tmp;
    let lookAt;
    if (this.vehicle) {
      const v = this.vehicle;
      const type = v.userData.type;
      const yaw = v.rotation.y + Math.PI + this.vehLook;
      const dist = type === 'heli' ? 22 : 13.5;
      const height = type === 'heli' ? 7.5 : 5.0;
      targetPos.set(
        v.position.x + Math.sin(yaw) * dist,
        (type === 'heli' ? this.altitude : v.position.y) + height + this.vehPitch * 8,
        v.position.z + Math.cos(yaw) * dist
      );
      const fx = Math.sin(v.rotation.y), fz = Math.cos(v.rotation.y);
      lookAt = new THREE.Vector3(v.position.x + fx * (type === 'heli' ? 8 : 5), (type === 'heli' ? this.altitude : v.position.y) + 1.7, v.position.z + fz * (type === 'heli' ? 8 : 5));
      this.vehLook = damp(this.vehLook, 0, 0.35, dt);
      this.vehPitch = damp(this.vehPitch, 0, 0.35, dt);
    } else {
      const dist = this.mode === 'interior' ? 6.2 : 9.2;
      const height = this.mode === 'interior' ? 2.4 : 4.3;
      targetPos.set(this.pos.x + Math.sin(this.camYaw) * dist, this.pos.y + height + this.camPitch * 5.2, this.pos.z + Math.cos(this.camYaw) * dist);
      lookAt = new THREE.Vector3(this.pos.x, this.pos.y + 1.8 + this.camPitch * 1.8, this.pos.z);
      if (this.mode === 'interior') {
        const dx = (targetPos.x - 6000) / 11.2, dz = (targetPos.z - 6000) / 7.2;
        const r = Math.hypot(dx, dz);
        if (r > 1) { targetPos.x = 6000 + dx / r * 11.2; targetPos.z = 6000 + dz / r * 7.2; }
      } else {
        const gh = this.world.heightAt(targetPos.x, targetPos.z);
        if (targetPos.y < gh + 1.0) targetPos.y = gh + 1.0;
      }
    }
    this.camPos.x = damp(this.camPos.x, targetPos.x, 8, dt);
    this.camPos.y = damp(this.camPos.y, targetPos.y, 8, dt);
    this.camPos.z = damp(this.camPos.z, targetPos.z, 8, dt);
    this.camLook.x = damp(this.camLook.x, lookAt.x, 12, dt);
    this.camLook.y = damp(this.camLook.y, lookAt.y, 12, dt);
    this.camLook.z = damp(this.camLook.z, lookAt.z, 12, dt);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    // subtle FOV on speed
    const targetFov = this.vehicle ? 68 + Math.min(8, Math.abs(this.speed) * 0.12) : 62;
    this.camera.fov = damp(this.camera.fov, targetFov, 3, dt);
    this.camera.updateProjectionMatrix();
  }

  _updatePrompt() {
    let prompt = null;
    if (this.vehicle) {
      prompt = { label: this.vehicle.userData.type === 'heli' ? 'Land to disembark' : 'Exit vehicle', action: 'exit' };
    } else {
      const it = this.world.nearestInteractable(this.pos.x, this.pos.z, this.mode, 4.2);
      if (it) prompt = { label: it.label, action: 'interact', id: it.id };
      else {
        const v = this.world.vehicleNear(this.pos.x, this.pos.z, 5.6);
        if (v) prompt = { label: v.userData.vehicle?.label || 'Enter vehicle', action: 'vehicle' };
      }
    }
    this.prompt = prompt;
  }
}
