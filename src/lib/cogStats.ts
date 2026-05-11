// Client-side statistics for a parsed georaster within a lon/lat bbox.
// Used to drive the detail drawer's Stats / Histogram / Class% tabs.

import type { Bbox } from './bbox';

export interface ColorStop {
  value: number;
  color: string;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
}

export interface ClassEntry {
  label: string;
  color: string;
  count: number;
  pct: number;
}

export interface CogStats {
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  stdDev: number | null;
  validPixels: number;
  histogram: HistogramBin[];
  classBreakdown?: ClassEntry[];
}

interface GeorasterLike {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  pixelWidth: number;
  pixelHeight: number;
  width: number;
  height: number;
  noDataValue?: number | null;
  values: number[][][]; // [band][y][x]
}

export function computeStats(
  g: GeorasterLike,
  bbox: Bbox,
  colorScheme?: ColorStop[],
  binCount = 30,
): CogStats {
  // Clip bbox to raster bounds.
  const lngMin = Math.max(bbox.minLng, g.xmin);
  const lngMax = Math.min(bbox.maxLng, g.xmax);
  const latMin = Math.max(bbox.minLat, g.ymin);
  const latMax = Math.min(bbox.maxLat, g.ymax);

  if (lngMin >= lngMax || latMin >= latMax) {
    return emptyStats(binCount);
  }

  const x0 = Math.max(0, Math.floor((lngMin - g.xmin) / g.pixelWidth));
  const x1 = Math.min(g.width, Math.ceil((lngMax - g.xmin) / g.pixelWidth));
  // Row 0 corresponds to ymax; rows increase as latitude decreases.
  const y0 = Math.max(0, Math.floor((g.ymax - latMax) / g.pixelHeight));
  const y1 = Math.min(g.height, Math.ceil((g.ymax - latMin) / g.pixelHeight));

  if (x0 >= x1 || y0 >= y1) return emptyStats(binCount);

  const band = g.values[0];
  const noData = g.noDataValue;
  const collected: number[] = [];
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sumSq = 0;

  for (let y = y0; y < y1; y++) {
    const row = band[y];
    if (!row) continue;
    for (let x = x0; x < x1; x++) {
      const v = row[x];
      if (v == null || Number.isNaN(v)) continue;
      if (noData != null && v === noData) continue;
      collected.push(v);
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      sumSq += v * v;
    }
  }

  const n = collected.length;
  if (n === 0) return emptyStats(binCount);

  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const sorted = [...collected].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];

  // Histogram across [min, max] split into binCount equal-width bins.
  const range = max - min || 1;
  const histogram: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    binStart: min + (range * i) / binCount,
    binEnd: min + (range * (i + 1)) / binCount,
    count: 0,
  }));
  for (const v of collected) {
    const idx = Math.min(
      binCount - 1,
      Math.floor(((v - min) / range) * binCount),
    );
    histogram[idx].count++;
  }

  // Class breakdown using colorScheme stops as half-open intervals.
  let classBreakdown: ClassEntry[] | undefined;
  if (colorScheme && colorScheme.length >= 2) {
    const sortedStops = [...colorScheme].sort((a, b) => a.value - b.value);
    classBreakdown = [];
    for (let i = 0; i < sortedStops.length - 1; i++) {
      const a = sortedStops[i];
      const b = sortedStops[i + 1];
      let count = 0;
      for (const v of collected) {
        if (v >= a.value && v < b.value) count++;
      }
      // Last interval is inclusive on the right so the top value isn't lost.
      if (i === sortedStops.length - 2) {
        for (const v of collected) {
          if (v === b.value) count++;
        }
      }
      classBreakdown.push({
        label: `${a.value.toFixed(2)} – ${b.value.toFixed(2)}`,
        color: a.color,
        count,
        pct: (count / n) * 100,
      });
    }
  }

  return {
    min,
    max,
    mean,
    median,
    stdDev,
    validPixels: n,
    histogram,
    classBreakdown,
  };
}

function emptyStats(binCount: number): CogStats {
  return {
    min: null,
    max: null,
    mean: null,
    median: null,
    stdDev: null,
    validPixels: 0,
    histogram: Array.from({ length: binCount }, (_, i) => ({
      binStart: i,
      binEnd: i + 1,
      count: 0,
    })),
  };
}
