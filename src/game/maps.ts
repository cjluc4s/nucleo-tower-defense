import { GRID_COLS, TOWER_DEFS } from './constants';
import type { WaveCurveConfig } from './constants';
import type { GridPoint } from './path';

export type MapTier = 'iniciante' | 'intermediario' | 'avancado';

// A sector is the "location" in the lore (Perímetro, Roteamento, Firewall) — its name,
// description and tier are shared by every route inside it. A route (MapDef below) is one
// specific playable path through that sector; a sector can hold more than one route.
export interface SectorDef {
  tier: MapTier;
  name: string;
  shortName: string;
  description: string;
  // In-game build cost per tower key, specific to this sector — cheaper in easier sectors,
  // pricier in harder ones. Firewall's Disruptor is deliberately pushed above the highest
  // possible starting gold there (300, on Fácil) so it can never be bought at wave 1 —
  // the player has to earn it, not just pick the difficulty that lets them skip that.
  towerCosts: Record<string, number>;
}

export const SECTOR_DEFS: Record<MapTier, SectorDef> = {
  iniciante: {
    tier: 'iniciante',
    name: 'Setor 1: Perímetro',
    shortName: 'Perímetro',
    description: 'A borda externa da rede. Espaço livre, ideal para aprender o básico.',
    towerCosts: { basic: 35, sniper: 65, splash: 90, limiter: 50 },
  },
  intermediario: {
    tier: 'intermediario',
    name: 'Setor 2: Roteamento',
    shortName: 'Roteamento',
    description: 'A camada de distribuição de dados. Espaço moderado, rotas mais sinuosas.',
    towerCosts: { basic: 50, sniper: 90, splash: 120, limiter: 70 },
  },
  avancado: {
    tier: 'avancado',
    name: 'Setor 3: Firewall',
    shortName: 'Firewall',
    description: 'A camada de proteção mais próxima do núcleo. Denso, apertado, hostil.',
    towerCosts: { basic: 70, sniper: 125, splash: 320, limiter: 100 },
  },
};

export interface MapDef {
  key: string;
  shortName: string; // used in the tight in-game HUD label
  routeName: string; // 'Rota Primária' / 'Rota Alternativa' — shown when picking a route
  tier: MapTier;
  description: string; // flavor text specific to this route's path shape
  pathGrid: GridPoint[];
  waveCurve: WaveCurveConfig;
  goldBonus: number;
  currencyFirstClear: number;
  currencyRepeatClear: number;
}

const EDGE = GRID_COLS - 1;

export const MAP_DEFS: Record<string, MapDef> = {
  perimetro: {
    key: 'perimetro',
    shortName: 'Perímetro',
    routeName: 'Rota Primária',
    tier: 'iniciante',
    description: 'Caminho longo e direto, muito espaço livre para posicionar módulos.',
    pathGrid: [
      { col: -1, row: 4 },
      { col: 8, row: 4 },
      { col: 8, row: 7 },
      { col: EDGE, row: 7 },
    ],
    waveCurve: { waveCount: 10, startGrunt: 6, gruntGrowth: 2, fastUnlockWave: 2, tankUnlockWave: 3 },
    goldBonus: 0,
    currencyFirstClear: 50,
    currencyRepeatClear: 10,
  },
  perimetro_b: {
    key: 'perimetro_b',
    shortName: 'Perímetro B',
    routeName: 'Rota Alternativa',
    tier: 'iniciante',
    description: 'Entra mais abaixo e sobe perto do núcleo. Ainda bastante espaço livre.',
    pathGrid: [
      { col: -1, row: 7 },
      { col: 11, row: 7 },
      { col: 11, row: 2 },
      { col: EDGE, row: 2 },
    ],
    waveCurve: { waveCount: 10, startGrunt: 6, gruntGrowth: 2, fastUnlockWave: 2, tankUnlockWave: 3 },
    goldBonus: 0,
    currencyFirstClear: 50,
    currencyRepeatClear: 10,
  },
  roteamento: {
    key: 'roteamento',
    shortName: 'Roteamento',
    routeName: 'Rota Primária',
    tier: 'intermediario',
    description: 'Caminho serpenteado que sobe e desce em ziguezague, espaço moderado.',
    pathGrid: [
      { col: -1, row: 4 },
      { col: 3, row: 4 },
      { col: 3, row: 8 },
      { col: 7, row: 8 },
      { col: 7, row: 1 },
      { col: 11, row: 1 },
      { col: 11, row: 8 },
      { col: EDGE, row: 8 },
    ],
    waveCurve: { waveCount: 14, startGrunt: 14, gruntGrowth: 2, fastUnlockWave: 1, tankUnlockWave: 2 },
    goldBonus: 40,
    currencyFirstClear: 80,
    currencyRepeatClear: 15,
  },
  roteamento_b: {
    key: 'roteamento_b',
    shortName: 'Roteamento B',
    routeName: 'Rota Alternativa',
    tier: 'intermediario',
    description: 'Outro padrão de curvas, com viradas mais cedo. Espaço moderado.',
    pathGrid: [
      { col: -1, row: 2 },
      { col: 2, row: 2 },
      { col: 2, row: 8 },
      { col: 6, row: 8 },
      { col: 6, row: 2 },
      { col: 10, row: 2 },
      { col: 10, row: 8 },
      { col: EDGE, row: 8 },
    ],
    waveCurve: { waveCount: 14, startGrunt: 14, gruntGrowth: 2, fastUnlockWave: 1, tankUnlockWave: 2 },
    goldBonus: 40,
    currencyFirstClear: 80,
    currencyRepeatClear: 15,
  },
  firewall: {
    key: 'firewall',
    shortName: 'Firewall',
    routeName: 'Rota Primária',
    tier: 'avancado',
    description: 'Faixas horizontais apertadas cobrindo quase toda a largura. Denso e hostil.',
    pathGrid: [
      { col: -1, row: 1 },
      { col: 13, row: 1 },
      { col: 13, row: 3 },
      { col: 1, row: 3 },
      { col: 1, row: 5 },
      { col: 13, row: 5 },
      { col: 13, row: 7 },
      { col: 1, row: 7 },
      { col: 1, row: 9 },
      { col: EDGE, row: 9 },
    ],
    waveCurve: { waveCount: 18, startGrunt: 24, gruntGrowth: 2, fastUnlockWave: 1, tankUnlockWave: 1 },
    goldBonus: 80,
    currencyFirstClear: 120,
    currencyRepeatClear: 25,
  },
  firewall_b: {
    key: 'firewall_b',
    shortName: 'Firewall B',
    routeName: 'Rota Alternativa',
    tier: 'avancado',
    description: 'Ziguezague vertical apertado, mesma densidade em outro ângulo.',
    pathGrid: [
      { col: -1, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 8 },
      { col: 5, row: 8 },
      { col: 5, row: 1 },
      { col: 8, row: 1 },
      { col: 8, row: 8 },
      { col: 11, row: 8 },
      { col: 11, row: 1 },
      { col: EDGE, row: 1 },
    ],
    waveCurve: { waveCount: 18, startGrunt: 24, gruntGrowth: 2, fastUnlockWave: 1, tankUnlockWave: 1 },
    goldBonus: 80,
    currencyFirstClear: 120,
    currencyRepeatClear: 25,
  },
};

export const MAP_TIER_ORDER: MapTier[] = ['iniciante', 'intermediario', 'avancado'];

export const MAP_TIER_LABELS: Record<MapTier, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export function getMapsByTier(tier: MapTier): MapDef[] {
  return Object.values(MAP_DEFS).filter((m) => m.tier === tier);
}

export function getTowerCost(towerKey: string, tier: MapTier): number {
  return SECTOR_DEFS[tier].towerCosts[towerKey] ?? TOWER_DEFS[towerKey].cost;
}
