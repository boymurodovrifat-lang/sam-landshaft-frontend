import type { CogStats } from '../lib/cogStats';

interface Props {
  stats: CogStats;
  unit?: string | null;
}

function fmt(n: number | null, unit?: string | null): string {
  if (n == null) return '—';
  const s = Math.abs(n) >= 100 ? n.toFixed(1) : n.toFixed(3);
  return unit ? `${s} ${unit}` : s;
}

export default function DetailStatsCard({ stats, unit }: Props) {
  if (stats.validPixels === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Bu hududda ma'lumot yo'q.
      </div>
    );
  }
  const rows: [string, string][] = [
    ["O'rtacha", fmt(stats.mean, unit)],
    ['Median', fmt(stats.median, unit)],
    ['Minimum', fmt(stats.min, unit)],
    ['Maksimum', fmt(stats.max, unit)],
    ["Standart og'ish", fmt(stats.stdDev, unit)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-gray-500">{k}</dt>
          <dd className="font-medium text-gray-900 text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
