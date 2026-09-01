export const GRID_SIZE = 64;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;
export const TOP_BAR_HEIGHT = 44;
export const BOTTOM_BAR_HEIGHT = 74;
export const GRID_OFFSET_Y = TOP_BAR_HEIGHT;
export const GAME_WIDTH = GRID_COLS * GRID_SIZE;
export const GAME_HEIGHT = TOP_BAR_HEIGHT + GRID_ROWS * GRID_SIZE + BOTTOM_BAR_HEIGHT;

export type DifficultyKey = 'easy' | 'medium' | 'hard';

export interface DifficultyDef {
  key: DifficultyKey;
  name: string;
  startingGold: number;
  startingLives: number;
  rewardMultiplier: number;
  color: number;
}

export const DIFFICULTY_DEFS: Record<DifficultyKey, DifficultyDef> = {
  easy: {
    key: 'easy',
    name: 'Fácil',
    startingGold: 220,
    startingLives: 30,
    rewardMultiplier: 0.85,
    color: 0x2ecc71,
  },
  medium: {
    key: 'medium',
    name: 'Médio',
    startingGold: 150,
    startingLives: 20,
    rewardMultiplier: 0.65,
    color: 0xf1c40f,
  },
  hard: {
    key: 'hard',
    name: 'Difícil',
    startingGold: 100,
    startingLives: 12,
    rewardMultiplier: 0.5,
    color: 0xe74c3c,
  },
};

export interface TowerDef {
  key: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // ms between shots
  projectileSpeed: number; // px/s
  color: number;
  splashRadius?: number;
  slowPercent?: number; // 0-1, fraction of speed removed
  slowDuration?: number; // ms
  unlockedByDefault: boolean;
  unlockCost?: number; // Dados Recuperados cost in the shop, when not unlocked by default
  description?: string; // shown in the shop
}

export const TOWER_DEFS: Record<string, TowerDef> = {
  basic: {
    key: 'basic',
    name: 'Emissor',
    cost: 50,
    range: 150,
    damage: 12,
    fireRate: 550,
    projectileSpeed: 500,
    color: 0x4da6ff,
    unlockedByDefault: true,
  },
  sniper: {
    key: 'sniper',
    name: 'Rastreador',
    cost: 90,
    range: 300,
    damage: 40,
    fireRate: 1300,
    projectileSpeed: 800,
    color: 0x9b59b6,
    unlockedByDefault: true,
  },
  splash: {
    key: 'splash',
    name: 'Disruptor',
    cost: 120,
    range: 130,
    damage: 18,
    fireRate: 1000,
    projectileSpeed: 350,
    color: 0xe67e22,
    splashRadius: 70,
    unlockedByDefault: true,
  },
  limiter: {
    key: 'limiter',
    name: 'Limitador',
    cost: 70,
    range: 140,
    damage: 5,
    fireRate: 700,
    projectileSpeed: 450,
    color: 0x1abc9c,
    slowPercent: 0.4,
    slowDuration: 2000,
    unlockedByDefault: false,
    unlockCost: 150,
    description: 'Reduz a velocidade dos vetores atingidos, prendendo-os no alcance dos outros módulos.',
  },
};

export interface EnemyDef {
  key: string;
  name: string;
  hp: number;
  speed: number; // px/s
  reward: number;
  damage: number; // lives lost on leak
  color: number;
  radius: number;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  grunt: { key: 'grunt', name: 'Fragmento', hp: 60, speed: 80, reward: 8, damage: 1, color: 0x2ecc71, radius: 14 },
  fast: { key: 'fast', name: 'Pulso', hp: 32, speed: 155, reward: 6, damage: 1, color: 0xf1c40f, radius: 11 },
  tank: { key: 'tank', name: 'Monólito', hp: 260, speed: 42, reward: 22, damage: 3, color: 0xc0392b, radius: 19 },
};

export interface WaveEntry {
  type: keyof typeof ENEMY_DEFS;
  count: number;
  interval: number; // ms between spawns within this entry
  startDelay: number; // ms delay from wave start
}

export interface WaveCurveConfig {
  waveCount: number; // "official" waves for this map — clearing this wins
  startGrunt: number;
  gruntGrowth: number;
  fastUnlockWave: number; // 1-indexed wave when Pulsos start appearing
  tankUnlockWave: number; // 1-indexed wave when Monólitos start appearing
}

// Computes the composition for any wave index (0-indexed) from a curve — including
// indices beyond waveCount, which is what powers infinite/endless mode.
export function getWaveEntries(config: WaveCurveConfig, waveIndex: number): WaveEntry[] {
  const wave: WaveEntry[] = [];
  const gruntCount = config.startGrunt + waveIndex * config.gruntGrowth;
  wave.push({ type: 'grunt', count: gruntCount, interval: 550, startDelay: 0 });

  if (waveIndex + 1 >= config.fastUnlockWave) {
    const sinceUnlock = waveIndex - (config.fastUnlockWave - 1);
    wave.push({ type: 'fast', count: 3 + Math.floor(sinceUnlock * 1.5), interval: 350, startDelay: 800 });
  }
  if (waveIndex + 1 >= config.tankUnlockWave) {
    const sinceUnlock = waveIndex - (config.tankUnlockWave - 1);
    if (sinceUnlock % 2 === 0) {
      wave.push({ type: 'tank', count: 1 + Math.floor(sinceUnlock / 2), interval: 1200, startDelay: 1500 });
    }
  }
  return wave;
}
