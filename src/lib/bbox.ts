// Lon/lat axis-aligned bounding box used by bbox draw + crop + stats.

export interface Bbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function encodeBbox(b: Bbox): string {
  return `${b.minLng},${b.minLat},${b.maxLng},${b.maxLat}`;
}

export function decodeBbox(raw: string | null | undefined): Bbox | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = nums;
  if (minLng >= maxLng || minLat >= maxLat) return null;
  return { minLng, minLat, maxLng, maxLat };
}
