import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { CogStats } from '../lib/cogStats';

interface Props {
  stats: CogStats;
}

export default function DetailClassChart({ stats }: Props) {
  if (!stats.classBreakdown || stats.validPixels === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Sinflar bo'yicha ma'lumot yo'q
      </div>
    );
  }
  const data = stats.classBreakdown.map((c) => ({
    range: c.label,
    Percent: Number(c.pct.toFixed(2)),
    color: c.color,
  }));
  // Rotate x-axis labels and reserve room when labels look like text
  // (discrete categories — LULC class names won't fit horizontally).
  const hasTextLabels = data.some((d) => /[A-Za-z]/.test(d.range));
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: hasTextLabels ? 60 : 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={hasTextLabels ? -35 : 0}
            textAnchor={hasTextLabels ? 'end' : 'middle'}
            height={hasTextLabels ? 80 : 30}
          />
          <YAxis unit="%" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="Percent">
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
