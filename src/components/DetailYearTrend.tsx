import { useEffect, useState } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';
import { filesApi, type YearStatsResponse } from '../api/files';
import type { Bbox } from '../lib/bbox';

interface Props {
  categoryId: number;
  bbox: Bbox;
  unit?: string | null;
}

export default function DetailYearTrend({ categoryId, bbox, unit }: Props) {
  const [data, setData] = useState<YearStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    filesApi
      .getYearStats(categoryId, bbox)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat]);

  if (loading)
    return (
      <div className="text-sm text-gray-500">Yuklanmoqda...</div>
    );
  if (error)
    return <div className="text-sm text-red-600">Xatolik: {error}</div>;
  if (!data || data.years.length < 2) {
    return (
      <div className="text-sm text-gray-500 italic">
        Trend uchun yetarli yil yo'q
      </div>
    );
  }

  const rows = data.years.map((y) => ({
    year: y.year,
    mean: y.mean,
    band: [y.min, y.max],
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer>
        <ComposedChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: any) => {
              if (Array.isArray(v))
                return [
                  `${v[0]?.toFixed?.(3) ?? '—'} – ${v[1]?.toFixed?.(3) ?? '—'}${unit ? ' ' + unit : ''}`,
                  'Min/Max',
                ];
              return [
                `${typeof v === 'number' ? v.toFixed(3) : '—'}${unit ? ' ' + unit : ''}`,
                "O'rtacha",
              ];
            }}
          />
          <Area
            dataKey="band"
            stroke="none"
            fill="#0ea5e9"
            fillOpacity={0.12}
          />
          <Line
            dataKey="mean"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
