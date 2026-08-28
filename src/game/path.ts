import { GRID_SIZE, GRID_COLS, GRID_ROWS, GRID_OFFSET_Y } from './constants';

export interface GridPoint {
  col: number;
  row: number;
}

export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return { x: col * GRID_SIZE + GRID_SIZE / 2, y: row * GRID_SIZE + GRID_SIZE / 2 + GRID_OFFSET_Y };
}

export function computePathPoints(pathGrid: GridPoint[]): { x: number; y: number }[] {
  return pathGrid.map((p) => gridToPixel(p.col, p.row));
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function computeBlockedCells(pathGrid: GridPoint[]): Set<string> {
  const blocked = new Set<string>();
  for (let i = 0; i < pathGrid.length - 1; i++) {
    const a = pathGrid[i];
    const b = pathGrid[i + 1];
    if (a.row === b.row) {
      const minC = Math.min(a.col, b.col);
      const maxC = Math.max(a.col, b.col);
      for (let c = minC; c <= maxC; c++) blocked.add(cellKey(c, a.row));
    } else if (a.col === b.col) {
      const minR = Math.min(a.row, b.row);
      const maxR = Math.max(a.row, b.row);
      for (let r = minR; r <= maxR; r++) blocked.add(cellKey(a.col, r));
    }
  }
  return blocked;
}

export function isInGrid(col: number, row: number): boolean {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}
