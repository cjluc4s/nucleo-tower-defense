import Phaser from 'phaser';
import type { TowerDef } from './constants';
import type Enemy from './Enemy';

export default class Tower {
  scene: Phaser.Scene;
  def: TowerDef;
  x: number;
  y: number;
  col: number;
  row: number;
  cooldown = 0;
  container: Phaser.GameObjects.Container;
  rangeCircle: Phaser.GameObjects.Arc;
  private barrel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, def: TowerDef, x: number, y: number, col: number, row: number) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;

    this.container = scene.add.container(x, y);
    const base = scene.add.rectangle(0, 0, 44, 44, def.color).setStrokeStyle(2, 0x000000, 0.4);
    this.barrel = scene.add.rectangle(16, 0, 28, 8, 0x2c3e50).setOrigin(0, 0.5);
    this.container.add([base, this.barrel]);

    this.rangeCircle = scene.add.circle(x, y, def.range, 0xffffff, 0.06).setStrokeStyle(1, 0xffffff, 0.25);
    this.rangeCircle.setVisible(false);
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestProgress = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (dist <= this.def.range && e.waypointIndex > bestProgress) {
        bestProgress = e.waypointIndex;
        best = e;
      }
    }
    return best;
  }

  aimAt(target: Enemy) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.barrel.setRotation(angle);
  }

  update(dt: number) {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  canFire(): boolean {
    return this.cooldown <= 0;
  }

  fire() {
    this.cooldown = this.def.fireRate;
  }

  destroy() {
    this.container.destroy();
    this.rangeCircle.destroy();
  }
}
