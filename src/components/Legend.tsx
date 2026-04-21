import { parseColorScheme, DEFAULT_SCHEME } from '../lib/colorScheme';

interface LegendProps {
  colorSchemeJson?: string | null;
  unit?: string;
  title?: string;
}

export default function Legend({ colorSchemeJson, unit, title }: LegendProps) {
  const scheme = parseColorScheme(colorSchemeJson) ?? DEFAULT_SCHEME;
  const sorted = [...scheme].sort((a, b) => a.value - b.value);

  const gradient = `linear-gradient(to top, ${sorted
    .map((s) => s.color)
    .join(', ')})`;

  const formatValue = (v: number) => {
    if (Number.isInteger(v)) return String(v);
    return String(Number(v.toFixed(3)));
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 text-xs min-w-[70px]">
      {title && <div className="font-semibold text-gray-700 mb-2 text-center">{title}</div>}
      <div className="flex gap-2 items-stretch">
        <div
          className="w-4 rounded"
          style={{ background: gradient, height: 140 }}
        />
        <div className="flex flex-col justify-between text-gray-600">
          {[...sorted].reverse().map((s, i) => (
            <div key={i}>
              {formatValue(s.value)}
              {unit ? ` ${unit}` : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
