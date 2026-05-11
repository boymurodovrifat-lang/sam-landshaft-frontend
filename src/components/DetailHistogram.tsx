import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { CogStats } from '../lib/cogStats';

interface Props {
  stats: CogStats;
  unit?: string | null;
}

export default function DetailHistogram({ stats, unit }: Props) {
  if (stats.validPixels === 0) {
    return <div className="text-sm text-gray-500 italic">Ma'lumot yo'q</div>;
  }
  const data = stats.histogram.map((b) => ({
    bin: ((b.binStart + b.binEnd) / 2).toFixed(2),
    Frequency: b.count,
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bin" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) =>
              typeof v === 'number' ? v.toLocaleString() : String(v)
            }
            labelFormatter={(l) =>
              `Qiymat ≈ ${l}${unit ? ' ' + unit : ''}`
            }
          />
          <Bar dataKey="Frequency" fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
