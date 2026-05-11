import { describe, it, expect } from 'vitest';
import { computeStats } from './cogStats';
import type { Bbox } from './bbox';

// Build a synthetic georaster-like object.
// World extent xmin=0 ymin=0 xmax=W ymax=H, pixel size = 1, values row-major
function fakeGeoraster(values: number[][], noData?: number) {
  return {
    xmin: 0,
    ymin: 0,
    xmax: values[0].length,
    ymax: values.length,
    pixelWidth: 1,
    pixelHeight: 1,
    width: values[0].length,
    height: values.length,
    noDataValue: noData,
    values: [values], // [band][y][x]
  };
}

describe('computeStats', () => {
  it('returns empty stats for bbox entirely outside raster', () => {
    const g = fakeGeoraster([
      [1, 2],
      [3, 4],
    ]);
    const s = computeStats(g as any, {
      minLng: 10,
      minLat: 10,
      maxLng: 20,
      maxLat: 20,
    });
    expect(s.validPixels).toBe(0);
    expect(s.min).toBeNull();
    expect(s.mean).toBeNull();
  });

  it('computes min/max/mean over full raster', () => {
    const values = Array.from({ length: 4 }, (_, y) =>
      Array.from({ length: 4 }, (_, x) => y * 4 + x),
    );
    const g = fakeGeoraster(values);
    const bbox: Bbox = { minLng: 0, minLat: 0, maxLng: 4, maxLat: 4 };
    const s = computeStats(g as any, bbox);
    expect(s.validPixels).toBe(16);
    expect(s.min).toBe(0);
    expect(s.max).toBe(15);
    expect(s.mean).toBeCloseTo(7.5);
  });

  it('skips noData values', () => {
    const g = fakeGeoraster(
      [
        [1, -9999],
        [3, 4],
      ],
      -9999,
    );
    const s = computeStats(g as any, {
      minLng: 0,
      minLat: 0,
      maxLng: 2,
      maxLat: 2,
    });
    expect(s.validPixels).toBe(3);
    expect(s.mean).toBeCloseTo((1 + 3 + 4) / 3);
  });

  it('produces a histogram with the requested bin count', () => {
    const values = Array.from({ length: 4 }, (_, y) =>
      Array.from({ length: 4 }, (_, x) => y * 4 + x),
    );
    const g = fakeGeoraster(values);
    const s = computeStats(
      g as any,
      { minLng: 0, minLat: 0, maxLng: 4, maxLat: 4 },
      undefined,
      4,
    );
    expect(s.histogram).toHaveLength(4);
    const total = s.histogram.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(16);
  });

  it('produces a class breakdown when colorScheme provided', () => {
    const g = fakeGeoraster([
      [0, 1],
      [2, 3],
    ]);
    const scheme = [
      { value: 0, color: '#000' },
      { value: 2, color: '#888' },
      { value: 4, color: '#fff' },
    ];
    const s = computeStats(
      g as any,
      { minLng: 0, minLat: 0, maxLng: 2, maxLat: 2 },
      scheme,
    );
    expect(s.classBreakdown).toBeDefined();
    expect(s.classBreakdown!).toHaveLength(2);
    expect(s.classBreakdown![0].count).toBe(2);
    expect(s.classBreakdown![1].count).toBe(2);
    expect(s.classBreakdown![0].pct).toBeCloseTo(50);
  });
});
