import Phaser from 'phaser';
import type Enemy from './Enemy';

export default class Projectile {
  scene: Phaser.Scene;
  x: number;
  y: number;
  target: Enemy;
  speed: number;
  damage: number;
  splashRadius: number;
  alive = true;
  onHit: (target: Enemy, damage: number, splashRadius: number) => void;
  private gfx: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    speed: number,
    damage: number,
    color: number,
    splashRadius: number,
    onHit: (target: Enemy, damage: number, splashRadius: number) => void,
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = speed;
    this.damage = damage;
    this.splashRadius = splashRadius;
    this.onHit = onHit;
    this.gfx = scene.add.circle(x, y, 5, color).setStrokeStyle(1, 0x000000, 0.4);
  }

  update(dt: number) {
    if (!this.alive) return;
    if (!this.target.alive) {
      this.destroy();
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (this.speed * dt) / 1000;
    if (dist <= step) {
      this.onHit(this.target, this.damage, this.splashRadius);
      this.destroy();
      return;
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.gfx.setPosition(this.x, this.y);
  }

  destroy() {
    this.alive = false;
    this.gfx.destroy();
  }
}
