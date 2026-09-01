import { TOWER_DEFS } from './constants';

const STORAGE_KEY = 'nucleo-progress-v1';

interface ProgressState {
  currency: number;
  completedMaps: string[];
  unlockedTowers: string[];
}

function defaultState(): ProgressState {
  return { currency: 0, completedMaps: [], unlockedTowers: [] };
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      currency: typeof parsed.currency === 'number' ? parsed.currency : 0,
      completedMaps: Array.isArray(parsed.completedMaps) ? parsed.completedMaps : [],
      unlockedTowers: Array.isArray(parsed.unlockedTowers) ? parsed.unlockedTowers : [],
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — progress just won't persist.
  }
}

export function getCurrency(): number {
  return loadState().currency;
}

export function getAvailableTowerKeys(): string[] {
  const state = loadState();
  return Object.keys(TOWER_DEFS).filter(
    (key) => TOWER_DEFS[key].unlockedByDefault || state.unlockedTowers.includes(key),
  );
}

export function isTowerUnlocked(towerKey: string): boolean {
  const def = TOWER_DEFS[towerKey];
  if (!def) return false;
  if (def.unlockedByDefault) return true;
  return loadState().unlockedTowers.includes(towerKey);
}

export function unlockTower(towerKey: string): boolean {
  const def = TOWER_DEFS[towerKey];
  if (!def || def.unlockedByDefault || !def.unlockCost) return false;
  const state = loadState();
  if (state.unlockedTowers.includes(towerKey)) return false;
  if (state.currency < def.unlockCost) return false;
  state.currency -= def.unlockCost;
  state.unlockedTowers.push(towerKey);
  saveState(state);
  return true;
}

export interface MapCompletionResult {
  amountEarned: number;
  wasFirstClear: boolean;
  newBalance: number;
}

export function recordMapCompletion(
  mapKey: string,
  firstClearAmount: number,
  repeatClearAmount: number,
): MapCompletionResult {
  const state = loadState();
  const wasFirstClear = !state.completedMaps.includes(mapKey);
  const amountEarned = wasFirstClear ? firstClearAmount : repeatClearAmount;
  state.currency += amountEarned;
  if (wasFirstClear) state.completedMaps.push(mapKey);
  saveState(state);
  return { amountEarned, wasFirstClear, newBalance: state.currency };
}
