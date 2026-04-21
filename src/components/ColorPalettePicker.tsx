import { useMemo, useState } from 'react';
import chroma from 'chroma-js';
import { Check, RotateCcw } from 'lucide-react';

type Palette = {
  name: string;
  label: string;
  group: string;
  colors?: string[];
};

// ColorBrewer (chroma-js built-in) + matplotlib perceptual (explicit hex anchors)
const PALETTES: Palette[] = [
  // === Sequential (single-hue) ===
  { name: 'Blues', label: 'Blues', group: 'Sequential (bir rangli)' },
  { name: 'Greens', label: 'Greens', group: 'Sequential (bir rangli)' },
  { name: 'Greys', label: 'Greys', group: 'Sequential (bir rangli)' },
  { name: 'Oranges', label: 'Oranges', group: 'Sequential (bir rangli)' },
  { name: 'Purples', label: 'Purples', group: 'Sequential (bir rangli)' },
  { name: 'Reds', label: 'Reds', group: 'Sequential (bir rangli)' },

  // === Sequential (multi-hue, warm) ===
  { name: 'OrRd', label: 'OrRd', group: 'Sequential (issiq)' },
  { name: 'YlOrBr', label: 'YlOrBr', group: 'Sequential (issiq)' },
  { name: 'YlOrRd', label: 'YlOrRd', group: 'Sequential (issiq)' },

  // === Sequential (multi-hue, cool) ===
  { name: 'BuGn', label: 'BuGn', group: 'Sequential (sovuq)' },
  { name: 'BuPu', label: 'BuPu', group: 'Sequential (sovuq)' },
  { name: 'GnBu', label: 'GnBu', group: 'Sequential (sovuq)' },
  { name: 'PuBu', label: 'PuBu', group: 'Sequential (sovuq)' },
  { name: 'PuBuGn', label: 'PuBuGn', group: 'Sequential (sovuq)' },
  { name: 'PuRd', label: 'PuRd', group: 'Sequential (sovuq)' },
  { name: 'RdPu', label: 'RdPu', group: 'Sequential (sovuq)' },
  { name: 'YlGn', label: 'YlGn', group: 'Sequential (sovuq)' },
  { name: 'YlGnBu', label: 'YlGnBu', group: 'Sequential (sovuq)' },

  // === Perceptual (matplotlib) ===
  { name: 'Viridis', label: 'Viridis', group: 'Perceptual' },
  {
    name: 'Plasma',
    label: 'Plasma',
    group: 'Perceptual',
    colors: ['#0d0887', '#5c01a6', '#9c179e', '#cc4778', '#ed7953', '#fdb32f', '#f0f921'],
  },
  {
    name: 'Inferno',
    label: 'Inferno',
    group: 'Perceptual',
    colors: ['#000004', '#320a5e', '#781c6d', '#bb3754', '#ec6824', '#fbb41a', '#fcffa4'],
  },
  {
    name: 'Magma',
    label: 'Magma',
    group: 'Perceptual',
    colors: ['#000004', '#2c115f', '#721f81', '#b73779', '#f1605d', '#feaf77', '#fcfdbf'],
  },
  {
    name: 'Cividis',
    label: 'Cividis',
    group: 'Perceptual',
    colors: ['#00224e', '#123570', '#3b496c', '#707173', '#a59c74', '#e1cc55', '#fee838'],
  },
  {
    name: 'Turbo',
    label: 'Turbo',
    group: 'Perceptual',
    colors: ['#30123b', '#4145ab', '#4675ed', '#39a2fc', '#1bcfd4', '#24eca6', '#61fc6c', '#d1e834', '#fe9b2d', '#d93806', '#7a0402'],
  },
  {
    name: 'Rocket',
    label: 'Rocket',
    group: 'Perceptual',
    colors: ['#03051a', '#381536', '#6b1b48', '#a42e4d', '#d14245', '#ea6a3e', '#f3933e', '#faba4f', '#fbe07b', '#f9f1b9'],
  },
  {
    name: 'Mako',
    label: 'Mako',
    group: 'Perceptual',
    colors: ['#0b0405', '#2b1d3e', '#413e7c', '#3e6998', '#3d90a1', '#4db7a7', '#71d4af', '#bde3c8', '#f5f5f2'],
  },

  // === Diverging ===
  { name: 'BrBG', label: 'BrBG', group: 'Diverging (ikki tomonlama)' },
  { name: 'PiYG', label: 'PiYG', group: 'Diverging (ikki tomonlama)' },
  { name: 'PRGn', label: 'PRGn', group: 'Diverging (ikki tomonlama)' },
  { name: 'PuOr', label: 'PuOr', group: 'Diverging (ikki tomonlama)' },
  { name: 'RdBu', label: 'RdBu', group: 'Diverging (ikki tomonlama)' },
  { name: 'RdGy', label: 'RdGy', group: 'Diverging (ikki tomonlama)' },
  { name: 'RdYlBu', label: 'RdYlBu', group: 'Diverging (ikki tomonlama)' },
  { name: 'RdYlGn', label: 'RdYlGn', group: 'Diverging (ikki tomonlama)' },
  { name: 'Spectral', label: 'Spectral', group: 'Diverging (ikki tomonlama)' },
];

function getPaletteColors(palette: Palette, steps: number, invert: boolean): string[] {
  let colors: string[] = [];
  try {
    if (palette.colors) {
      colors = chroma.scale(palette.colors).mode('lab').colors(steps);
    } else {
      colors = chroma.scale(palette.name as any).colors(steps);
    }
  } catch {
    colors = ['#ccc', '#666'];
  }
  return invert ? [...colors].reverse() : colors;
}

function getGradientCSS(palette: Palette, invert = false, steps = 12): string {
  const colors = getPaletteColors(palette, steps, invert);
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

export function paletteToColorScheme(
  paletteName: string,
  min: number,
  max: number,
  steps = 6,
  invert = false,
): { value: number; color: string }[] {
  const palette = PALETTES.find((p) => p.name === paletteName);
  const colors = palette
    ? getPaletteColors(palette, steps, invert)
    : chroma.scale('Viridis' as any).colors(steps);
  return colors.map((color, i) => ({
    value: min + (i / (steps - 1)) * (max - min),
    color,
  }));
}

interface Props {
  value?: string | null;
  min?: number;
  max?: number;
  steps?: number;
  onChange: (scheme: { value: number; color: string }[], paletteName: string) => void;
}

export default function ColorPalettePicker({
  value,
  min = 0,
  max = 1,
  steps: stepsProp = 6,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [invert, setInvert] = useState(false);
  const [steps, setSteps] = useState(stepsProp);
  const [search, setSearch] = useState('');

  const groups = useMemo(() => [...new Set(PALETTES.map((p) => p.group))], []);

  const filtered = useMemo(() => {
    if (!search.trim()) return PALETTES;
    const q = search.toLowerCase();
    return PALETTES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.label.toLowerCase().includes(q),
    );
  }, [search]);

  const selected = value ? PALETTES.find((p) => p.name === value) : null;

  const emit = (paletteName: string, nextInvert = invert, nextSteps = steps) => {
    const scheme = paletteToColorScheme(paletteName, min, max, nextSteps, nextInvert);
    onChange(scheme, paletteName);
  };

  const handleSelect = (paletteName: string) => {
    emit(paletteName);
    setOpen(false);
  };

  const toggleInvert = () => {
    const next = !invert;
    setInvert(next);
    if (value) emit(value, next, steps);
  };

  const changeSteps = (n: number) => {
    setSteps(n);
    if (value) emit(value, invert, n);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full border rounded-lg px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50"
        >
          {selected ? (
            <>
              <div
                className="w-24 h-5 rounded flex-shrink-0"
                style={{ background: getGradientCSS(selected, invert) }}
              />
              <span className="text-sm text-gray-700">{selected.label}</span>
              {invert && (
                <span className="ml-auto text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  teskari
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">Rang palitrasini tanlang... ({PALETTES.length} ta)</span>
          )}
        </button>

        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-[420px] overflow-y-auto bg-white border rounded-lg shadow-xl">
            <div className="sticky top-0 bg-white border-b p-2">
              <input
                type="text"
                autoFocus
                placeholder="Qidirish (Viridis, RdYlGn, ...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-lg"
              />
            </div>
            {search.trim() ? (
              <div>
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-sm text-gray-400 text-center">Topilmadi</div>
                ) : (
                  filtered.map((p) => (
                    <PaletteRow
                      key={p.name}
                      palette={p}
                      invert={invert}
                      selected={value === p.name}
                      onClick={() => handleSelect(p.name)}
                    />
                  ))
                )}
              </div>
            ) : (
              groups.map((group) => (
                <div key={group}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-[49px]">
                    {group}
                  </div>
                  {PALETTES.filter((p) => p.group === group).map((palette) => (
                    <PaletteRow
                      key={palette.name}
                      palette={palette}
                      invert={invert}
                      selected={value === palette.name}
                      onClick={() => handleSelect(palette.name)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Boshqaruv: invert + steps */}
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={toggleInvert}
          className={`flex items-center gap-1.5 px-2 py-1 border rounded-lg text-xs ${
            invert ? 'bg-primary-50 border-primary-300 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
          title="Rangni teskari tartibga o'tkazish"
        >
          <RotateCcw size={12} /> Invert
        </button>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          Qadamlar:
          <select
            value={steps}
            onChange={(e) => changeSteps(Number(e.target.value))}
            className="border rounded px-2 py-0.5 text-xs"
          >
            {[3, 4, 5, 6, 7, 8, 9, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

interface RowProps {
  palette: Palette;
  invert: boolean;
  selected: boolean;
  onClick: () => void;
}

function PaletteRow({ palette, invert, selected, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-primary-50 transition text-left ${
        selected ? 'bg-primary-50' : ''
      }`}
    >
      <div
        className="w-24 h-4 rounded flex-shrink-0 border border-gray-200"
        style={{ background: getGradientCSS(palette, invert) }}
      />
      <span className="text-sm text-gray-700 flex-1">{palette.label}</span>
      {selected && <Check size={14} className="text-primary-600" />}
    </button>
  );
}
