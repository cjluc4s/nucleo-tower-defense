import Phaser from 'phaser';
import {
  GRID_SIZE,
  GRID_COLS,
  GRID_ROWS,
  GRID_OFFSET_Y,
  GAME_WIDTH,
  TOWER_DEFS,
  DIFFICULTY_DEFS,
} from '../game/constants';
import type { DifficultyKey } from '../game/constants';
import { computePathPoints, computeBlockedCells, cellKey, isInGrid, gridToPixel } from '../game/path';
import { MAP_DEFS } from '../game/maps';
import { isTowerUnlocked, recordMapCompletion } from '../game/progress';
import type { MapCompletionResult } from '../game/progress';
import Enemy from '../game/Enemy';
import Tower from '../game/Tower';
import Projectile from '../game/Projectile';
import WaveManager from '../game/WaveManager';
import EventBus from '../game/EventBus';

export default class GameScene extends Phaser.Scene {
  private gold = 0;
  private lives = 0;
  private difficulty: DifficultyKey = 'medium';
  private mapKey = 'roteamento';
  private pathPoints: { x: number; y: number }[] = [];
  private blocked = new Set<string>();
  private readonly occupied = new Set<string>();
  private enemies: Enemy[] = [];
  private towers: Tower[] = [];
  private projectiles: Projectile[] = [];
  private waveManager!: WaveManager;
  private selectedTowerKey: string | null = null;
  private hoverGraphics!: Phaser.GameObjects.Graphics;
  private nucleo!: Phaser.GameObjects.Container;
  private nucleoCore!: Phaser.GameObjects.Arc;
  private gameEnded = false;
  private officialWinTriggered = false;

  constructor() {
    super('GameScene');
  }

  init(data: { difficulty?: DifficultyKey; mapKey?: string }) {
    this.difficulty = data?.difficulty ?? 'medium';
    this.mapKey = data?.mapKey && MAP_DEFS[data.mapKey] ? data.mapKey : 'roteamento';
  }

  create() {
    const mapDef = MAP_DEFS[this.mapKey];
    this.pathPoints = computePathPoints(mapDef.pathGrid);
    this.blocked = computeBlockedCells(mapDef.pathGrid);

    this.gold = DIFFICULTY_DEFS[this.difficulty].startingGold + mapDef.goldBonus;
    this.lives = DIFFICULTY_DEFS[this.difficulty].startingLives;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.occupied.clear();
    this.selectedTowerKey = null;
    this.gameEnded = false;
    this.officialWinTriggered = false;

    this.cameras.main.setBackgroundColor('#16212c');
    this.drawGrid();
    this.drawPath();
    this.createNucleo();

    this.hoverGraphics = this.add.graphics();

    this.waveManager = new WaveManager(this, this.pathPoints, mapDef.waveCurve, (enemy) => this.enemies.push(enemy));

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.handleHover(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.handleClick(p));

    EventBus.on('select-tower', (key: string | null) => {
      this.selectedTowerKey = key;
      if (!key) this.hoverGraphics.clear();
    });
    EventBus.on('request-start-wave', () => this.startNextWave());
    EventBus.on('request-state', () => this.emitState());
    EventBus.on('continue-endless', () => this.continueEndless());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupListeners());

    this.emitState();
  }

  private cleanupListeners() {
    EventBus.off('select-tower');
    EventBus.off('request-start-wave');
    EventBus.off('request-state');
    EventBus.off('continue-endless');
  }

  private continueEndless() {
    if (!this.officialWinTriggered) return;
    this.gameEnded = false;
    this.waveManager.enableEndless();
    this.emitState();
  }

  private drawGrid() {
    const gridBottom = GRID_OFFSET_Y + GRID_ROWS * GRID_SIZE;
    const g = this.add.graphics();
    g.lineStyle(1, 0x24333f, 1);
    for (let c = 0; c <= GRID_COLS; c++) {
      g.lineBetween(c * GRID_SIZE, GRID_OFFSET_Y, c * GRID_SIZE, gridBottom);
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      g.lineBetween(0, r * GRID_SIZE + GRID_OFFSET_Y, GAME_WIDTH, r * GRID_SIZE + GRID_OFFSET_Y);
    }
  }

  private drawPath() {
    const g = this.add.graphics();
    g.lineStyle(GRID_SIZE * 0.8, 0x3b4a58, 1);
    g.beginPath();
    g.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      g.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    g.strokePath();
  }

  private createNucleo() {
    const pos = this.pathPoints[this.pathPoints.length - 1];
    this.nucleo = this.add.container(pos.x, pos.y);

    const outerRing = this.add.circle(0, 0, 34, 0x2de1fc, 0).setStrokeStyle(2, 0x2de1fc, 0.5);
    const midGlow = this.add.circle(0, 0, 24, 0x2de1fc, 0.25);
    this.nucleoCore = this.add.circle(0, 0, 13, 0x2de1fc, 1).setStrokeStyle(2, 0xffffff, 0.9);

    this.nucleo.add([outerRing, midGlow, this.nucleoCore]);

    this.tweens.add({
      targets: [midGlow, this.nucleoCore],
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.add({
      targets: outerRing,
      alpha: { from: 0.5, to: 0.15 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private flashNucleoDamage() {
    this.nucleoCore.setFillStyle(0xff4d4d, 1);
    this.tweens.add({
      targets: this.nucleo,
      scaleX: { from: 1.35, to: 1 },
      scaleY: { from: 1.35, to: 1 },
      duration: 220,
      ease: 'Quad.easeOut',
    });
    this.time.delayedCall(150, () => this.nucleoCore.setFillStyle(0x2de1fc, 1));
  }

  private handleHover(pointer: Phaser.Input.Pointer) {
    this.hoverGraphics.clear();
    if (!this.selectedTowerKey) return;
    const { col, row } = this.pixelToCell(pointer.x, pointer.y);
    if (!isInGrid(col, row)) return;
    const valid = this.isCellBuildable(col, row);
    const def = TOWER_DEFS[this.selectedTowerKey];
    const center = gridToPixel(col, row);

    this.hoverGraphics.fillStyle(valid ? 0x2ecc71 : 0xe74c3c, 0.25);
    this.hoverGraphics.fillRect(col * GRID_SIZE, row * GRID_SIZE + GRID_OFFSET_Y, GRID_SIZE, GRID_SIZE);
    this.hoverGraphics.lineStyle(1, 0xffffff, 0.4);
    this.hoverGraphics.strokeCircle(center.x, center.y, def.range);
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    if (pointer.rightButtonDown()) {
      EventBus.emit('cancel-tower-selection');
      return;
    }
    if (!this.selectedTowerKey || this.gameEnded) return;
    if (!isTowerUnlocked(this.selectedTowerKey)) return;
    const { col, row } = this.pixelToCell(pointer.x, pointer.y);
    if (!isInGrid(col, row) || !this.isCellBuildable(col, row)) return;

    const def = TOWER_DEFS[this.selectedTowerKey];
    if (this.gold < def.cost) {
      EventBus.emit('insufficient-gold');
      return;
    }

    this.gold -= def.cost;
    const center = gridToPixel(col, row);
    const tower = new Tower(this, def, center.x, center.y, col, row);
    this.towers.push(tower);
    this.occupied.add(cellKey(col, row));
    this.emitState();
  }

  private isCellBuildable(col: number, row: number): boolean {
    const key = cellKey(col, row);
    return !this.blocked.has(key) && !this.occupied.has(key);
  }

  private pixelToCell(x: number, y: number) {
    return { col: Math.floor(x / GRID_SIZE), row: Math.floor((y - GRID_OFFSET_Y) / GRID_SIZE) };
  }

  private startNextWave() {
    if (this.gameEnded) return;
    const started = this.waveManager.startNextWave();
    if (started) this.emitState();
  }

  update(_time: number, delta: number) {
    if (this.gameEnded) return;

    this.waveManager.update(delta);

    for (const enemy of this.enemies) {
      enemy.update(delta);
    }

    for (const enemy of this.enemies) {
      if (enemy.leaked) {
        this.lives -= enemy.def.damage;
        this.waveManager.notifyEnemyResolved();
        this.flashNucleoDamage();
      }
    }
    this.enemies = this.enemies.filter((e) => {
      if (!e.alive) {
        e.destroy();
        return false;
      }
      return true;
    });

    for (const tower of this.towers) {
      tower.update(delta);
      const target = tower.findTarget(this.enemies);
      if (target) {
        tower.aimAt(target);
        if (tower.canFire()) {
          tower.fire();
          const proj = new Projectile(
            this,
            tower.x,
            tower.y,
            target,
            tower.def.projectileSpeed,
            tower.def.damage,
            tower.def.color,
            tower.def.splashRadius ?? 0,
            (t, dmg, splash) => this.resolveHit(t, dmg, splash, tower.def.slowPercent, tower.def.slowDuration),
          );
          this.projectiles.push(proj);
        }
      }
    }

    for (const proj of this.projectiles) {
      proj.update(delta);
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);

    if (this.lives <= 0) {
      this.endGame(false);
      return;
    }

    if (
      !this.officialWinTriggered &&
      !this.waveManager.active &&
      this.waveManager.currentWave >= this.waveManager.totalWaves &&
      this.enemies.length === 0
    ) {
      this.officialWinTriggered = true;
      const mapDef = MAP_DEFS[this.mapKey];
      const completion = recordMapCompletion(mapDef.key, mapDef.currencyFirstClear, mapDef.currencyRepeatClear);
      this.endGame(true, completion);
      return;
    }

    this.emitState();
  }

  private resolveHit(
    target: Enemy,
    damage: number,
    splashRadius: number,
    slowPercent?: number,
    slowDuration?: number,
  ) {
    const killed = target.takeDamage(damage);
    this.handleKill(target, killed);

    if (slowPercent && slowDuration && target.alive) {
      target.applySlow(slowPercent, slowDuration);
    }

    if (splashRadius > 0) {
      this.showSplashEffect(target.x, target.y, splashRadius);
      for (const other of this.enemies) {
        if (other === target || !other.alive) continue;
        const dist = Phaser.Math.Distance.Between(target.x, target.y, other.x, other.y);
        if (dist <= splashRadius) {
          const k = other.takeDamage(Math.round(damage * 0.6));
          this.handleKill(other, k);
        }
      }
    }
  }

  private showSplashEffect(x: number, y: number, radius: number) {
    const circle = this.add.circle(x, y, radius, 0xe67e22, 0.35).setStrokeStyle(2, 0xe67e22, 0.8);
    this.tweens.add({
      targets: circle,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 250,
      onComplete: () => circle.destroy(),
    });
  }

  private handleKill(enemy: Enemy, killed: boolean) {
    if (killed) {
      this.gold += Math.round(enemy.def.reward * DIFFICULTY_DEFS[this.difficulty].rewardMultiplier);
      this.waveManager.notifyEnemyResolved();
    }
  }

  private endGame(won: boolean, completion?: MapCompletionResult) {
    this.gameEnded = true;
    if (won) {
      EventBus.emit('game-win', completion);
    } else {
      EventBus.emit('game-over');
    }
  }

  private emitState() {
    const wave = this.waveManager.endless
      ? this.waveManager.currentWave + 1
      : Math.min(this.waveManager.currentWave + 1, this.waveManager.totalWaves);
    EventBus.emit('state', {
      gold: this.gold,
      lives: this.lives,
      wave,
      totalWaves: this.waveManager.totalWaves,
      waveActive: this.waveManager.active,
      endless: this.waveManager.endless,
    });
  }
}
