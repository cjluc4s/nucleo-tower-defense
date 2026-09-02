import Phaser from 'phaser';
import type { EnemyDef } from './constants';

export default class Enemy {
  scene: Phaser.Scene;
  def: EnemyDef;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  waypointIndex = 1;
  alive = true;
  leaked = false;
  container: Phaser.GameObjects.Container;
  private readonly pathPoints: { x: number; y: number }[];
  private readonly cumulativeDistances: number[];
  private body: Phaser.GameObjects.Arc;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private slowRing: Phaser.GameObjects.Arc;
  private slowMultiplier = 1;
  private slowRemaining = 0;

  constructor(
    scene: Phaser.Scene,
    def: EnemyDef,
    pathPoints: { x: number; y: number }[],
    cumulativeDistances: number[],
  ) {
    this.scene = scene;
    this.def = def;
    this.pathPoints = pathPoints;
    this.cumulativeDistances = cumulativeDistances;
    this.hp = def.hp;
    this.maxHp = def.hp;
    const start = pathPoints[0];
    this.x = start.x;
    this.y = start.y;

    this.container = scene.add.container(this.x, this.y);
    this.body = scene.add.circle(0, 0, def.radius, def.color).setStrokeStyle(2, 0x000000, 0.35);
    this.slowRing = scene.add
      .circle(0, 0, def.radius + 4, 0x1abc9c, 0)
      .setStrokeStyle(2, 0x1abc9c, 0.9)
      .setVisible(false);
    const hpBarBg = scene.add.rectangle(0, -def.radius - 10, def.radius * 2, 5, 0x000000, 0.5);
    this.hpBarFill = scene.add.rectangle(0, -def.radius - 10, def.radius * 2, 5, 0x2ecc71);
    this.container.add([this.body, this.slowRing, hpBarBg, this.hpBarFill]);

    // Quick pop-in on spawn instead of appearing instantly.
    this.container.setScale(0);
    scene.tweens.add({ targets: this.container, scale: 1, duration: 160, ease: 'Back.easeOut' });
  }

  update(dt: number) {
    if (!this.alive) return;

    if (this.slowRemaining > 0) {
      this.slowRemaining -= dt;
      if (this.slowRemaining <= 0) {
        this.slowRemaining = 0;
        this.slowMultiplier = 1;
        this.slowRing.setVisible(false);
      }
    }

    const target = this.pathPoints[this.waypointIndex];
    if (!target) {
      this.leaked = true;
      this.alive = false;
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (this.def.speed * this.slowMultiplier * dt) / 1000;
    if (dist <= step) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    this.container.setPosition(this.x, this.y);
  }

  // Exact distance travelled along the path so far, in pixels — used for 'first'/'last'
  // tower-focus targeting instead of waypointIndex, which can't distinguish two enemies
  // walking the same segment.
  getProgress(): number {
    const prev = this.pathPoints[this.waypointIndex - 1];
    return this.cumulativeDistances[this.waypointIndex - 1] + Math.hypot(this.x - prev.x, this.y - prev.y);
  }

  applySlow(percent: number, durationMs: number) {
    this.slowMultiplier = 1 - percent;
    this.slowRemaining = durationMs;
    this.slowRing.setVisible(true);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    const pct = Math.max(this.hp, 0) / this.maxHp;
    this.hpBarFill.width = this.def.radius * 2 * pct;
    this.hpBarFill.setFillStyle(pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf1c40f : 0xe74c3c);
    this.flashHit();
    if (this.hp <= 0 && this.alive) {
      this.alive = false;
      return true; // killed
    }
    return false;
  }

  private flashHit() {
    this.body.setFillStyle(0xffffff);
    this.scene.time.delayedCall(70, () => this.body.setFillStyle(this.def.color));
  }

  destroy() {
    // The enemy is already excluded from simulation (removed from GameScene's active list,
    // gold/lives already applied) the instant `alive` goes false — this only delays the
    // container's visual removal so it shrinks/fades out instead of vanishing on the spot.
    this.scene.tweens.add({
      targets: this.container,
      scale: 0,
      alpha: 0,
      duration: 160,
      ease: 'Back.easeIn',
      onComplete: () => this.container.destroy(),
    });
  }
}
