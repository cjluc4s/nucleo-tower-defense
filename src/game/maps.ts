import { GRID_COLS } from './constants';
import type { WaveCurveConfig } from './constants';
import type { GridPoint } from './path';

export type MapTier = 'iniciante' | 'intermediario' | 'avancado';

export interface MapDef {
  key: string;
  name: string;
  shortName: string;
  tier: MapTier;
  description: string;
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
    name: 'Setor 1: Perímetro',
    shortName: 'Perímetro',
    tier: 'iniciante',
    description: 'A borda externa da rede. Caminho longo e direto, muito espaço livre.',
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
  roteamento: {
    key: 'roteamento',
    name: 'Setor 2: Roteamento',
    shortName: 'Roteamento',
    tier: 'intermediario',
    description: 'A camada de distribuição de dados. Caminho serpenteado, espaço moderado.',
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
  firewall: {
    key: 'firewall',
    name: 'Setor 3: Firewall',
    shortName: 'Firewall',
    tier: 'avancado',
    description: 'A camada de proteção mais próxima do núcleo. Denso, apertado, hostil.',
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
};

export const MAP_TIER_ORDER: MapTier[] = ['iniciante', 'intermediario', 'avancado'];

export const MAP_TIER_LABELS: Record<MapTier, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
