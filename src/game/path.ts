import { GRID_SIZE, GRID_COLS, GRID_ROWS, GRID_OFFSET_X, GRID_OFFSET_Y } from './constants';

export interface GridPoint {
  col: number;
  row: number;
}

export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * GRID_SIZE + GRID_SIZE / 2 + GRID_OFFSET_X,
    y: row * GRID_SIZE + GRID_SIZE / 2 + GRID_OFFSET_Y,
  };
}

export function computePathPoints(pathGrid: GridPoint[]): { x: number; y: number }[] {
  return pathGrid.map((p) => gridToPixel(p.col, p.row));
}

// Cumulative pixel distance from the start of the path to each waypoint — computed once per
// map. This is what lets tower targeting rank enemies by exact progress along the path instead
// of by waypointIndex alone, which is too coarse: every enemy walking the same segment shares
// the same index, so 'first'/'last' targeting couldn't tell them apart within a segment.
export function computeCumulativeDistances(pathPoints: { x: number; y: number }[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    distances.push(distances[i - 1] + Math.hypot(curr.x - prev.x, curr.y - prev.y));
  }
  return distances;
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
