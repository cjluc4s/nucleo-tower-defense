import type Phaser from 'phaser';
import { ENEMY_DEFS, getWaveEntries } from './constants';
import type { WaveEntry, WaveCurveConfig } from './constants';
import Enemy from './Enemy';

type SpawnCallback = (enemy: Enemy) => void;

interface PendingSpawn {
  entry: WaveEntry;
  spawned: number;
  timer: number;
}

export default class WaveManager {
  scene: Phaser.Scene;
  currentWave = 0; // 0-indexed internally, display as +1
  active = false;
  endless = false;
  waveEnemiesRemaining = 0;
  private pending: PendingSpawn[] = [];
  private onSpawn: SpawnCallback;
  private readonly pathPoints: { x: number; y: number }[];
  private readonly cumulativeDistances: number[];
  private readonly config: WaveCurveConfig;

  constructor(
    scene: Phaser.Scene,
    pathPoints: { x: number; y: number }[],
    cumulativeDistances: number[],
    config: WaveCurveConfig,
    onSpawn: SpawnCallback,
  ) {
    this.scene = scene;
    this.pathPoints = pathPoints;
    this.cumulativeDistances = cumulativeDistances;
    this.config = config;
    this.onSpawn = onSpawn;
  }

  get totalWaves() {
    return this.config.waveCount;
  }

  enableEndless() {
    this.endless = true;
  }

  startNextWave(): boolean {
    if (this.active) return false;
    if (!this.endless && this.currentWave >= this.config.waveCount) return false;
    const wave = getWaveEntries(this.config, this.currentWave);
    this.pending = wave.map((entry) => ({ entry, spawned: 0, timer: entry.startDelay }));
    this.waveEnemiesRemaining = wave.reduce((sum, e) => sum + e.count, 0);
    this.active = true;
    return true;
  }

  update(dt: number) {
    if (!this.active) return;
    for (const p of this.pending) {
      if (p.spawned >= p.entry.count) continue;
      p.timer -= dt;
      if (p.timer <= 0) {
        const def = ENEMY_DEFS[p.entry.type];
        const enemy = new Enemy(this.scene, def, this.pathPoints, this.cumulativeDistances);
        this.onSpawn(enemy);
        p.spawned++;
        p.timer = p.entry.interval;
      }
    }
  }

  notifyEnemyResolved() {
    this.waveEnemiesRemaining--;
    if (this.waveEnemiesRemaining <= 0 && this.allSpawned()) {
      this.active = false;
      this.currentWave++;
    }
  }

  private allSpawned(): boolean {
    return this.pending.every((p) => p.spawned >= p.entry.count);
  }
}
