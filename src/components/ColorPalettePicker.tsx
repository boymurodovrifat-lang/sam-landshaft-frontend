import { useState } from 'react';
import chroma from 'chroma-js';

// Ilmiy va geofazoviy ranglar palitrasi
const PALETTES = [
  // Sequential — uzluksiz qiymatlar uchun
  { name: 'YlGn', label: 'Sariq → Yashil', group: 'Uzluksiz' },
  { name: 'YlGnBu', label: 'Sariq → Yashil → Ko\'k', group: 'Uzluksiz' },
  { name: 'GnBu', label: 'Yashil → Ko\'k', group: 'Uzluksiz' },
  { name: 'BuGn', label: 'Ko\'k → Yashil', group: 'Uzluksiz' },
  { name: 'YlOrRd', label: 'Sariq → Qizil', group: 'Uzluksiz' },
  { name: 'OrRd', label: 'To\'q sariq → Qizil', group: 'Uzluksiz' },
  { name: 'Blues', label: 'Ko\'k (och → to\'q)', group: 'Uzluksiz' },
  { name: 'Greens', label: 'Yashil (och → to\'q)', group: 'Uzluksiz' },
  { name: 'Oranges', label: 'To\'q sariq (och → to\'q)', group: 'Uzluksiz' },
  { name: 'Reds', label: 'Qizil (och → to\'q)', group: 'Uzluksiz' },

  // Ilmiy — maxsus maqsadlar uchun
  { name: 'Viridis', label: 'Viridis', group: 'Ilmiy' },
  { name: 'Magma', label: 'Magma', group: 'Ilmiy' },
  { name: 'Plasma', label: 'Plasma', group: 'Ilmiy' },
  { name: 'Inferno', label: 'Inferno', group: 'Ilmiy' },

  // Diverging — ikki tomonga tarqaluvchi
  { name: 'RdYlGn', label: 'Qizil ↔ Yashil', group: 'Ikki tomonlama' },
  { name: 'RdYlBu', label: 'Qizil ↔ Ko\'k', group: 'Ikki tomonlama' },
  { name: 'RdBu', label: 'Qizil ↔ Ko\'k (to\'q)', group: 'Ikki tomonlama' },
  { name: 'BrBG', label: 'Jigarrang ↔ Yashil', group: 'Ikki tomonlama' },
  { name: 'Spectral', label: 'Spektral', group: 'Ikki tomonlama' },
];

function getGradientCSS(paletteName: string, steps = 8): string {
  try {
    const colors = chroma.scale(paletteName as any).colors(steps);
    return `linear-gradient(to right, ${colors.join(', ')})`;
  } catch {
    return 'linear-gradient(to right, #ccc, #666)';
  }
}

export function paletteToColorScheme(
  paletteName: string,
  min: number,
  max: number,
  steps = 6,
): { value: number; color: string }[] {
  try {
    const colors = chroma.scale(paletteName as any).colors(steps);
    return colors.map((color, i) => ({
      value: min + (i / (steps - 1)) * (max - min),
      color,
    }));
  } catch {
    return [
      { value: min, color: '#440154' },
      { value: max, color: '#fde725' },
    ];
  }
}

interface Props {
  value?: string | null; // Tanlangan palette nomi
  min?: number;
  max?: number;
  onChange: (scheme: { value: number; color: string }[], paletteName: string) => void;
}

export default function ColorPalettePicker({
  value,
  min = 0,
  max = 1,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const groups = [...new Set(PALETTES.map((p) => p.group))];

  const handleSelect = (paletteName: string) => {
    const scheme = paletteToColorScheme(paletteName, min, max);
    onChange(scheme, paletteName);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border rounded-lg px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50"
      >
        {value ? (
          <>
            <div
              className="w-24 h-5 rounded"
              style={{ background: getGradientCSS(value) }}
            />
            <span className="text-sm text-gray-700">
              {PALETTES.find((p) => p.name === value)?.label || value}
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-400">Rang palitrasini tanlang...</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-80 overflow-y-auto bg-white border rounded-lg shadow-xl">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                {group}
              </div>
              {PALETTES.filter((p) => p.group === group).map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => handleSelect(palette.name)}
                  className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-primary-50 transition text-left ${
                    value === palette.name ? 'bg-primary-50' : ''
                  }`}
                >
                  <div
                    className="w-20 h-4 rounded flex-shrink-0"
                    style={{ background: getGradientCSS(palette.name) }}
                  />
                  <span className="text-sm text-gray-700">{palette.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
