// Rang sxemasi yordamchilari

export interface ColorStop {
  value: number;
  color: string; // #rrggbb
}

export type ColorScheme = ColorStop[];

/**
 * Parse color scheme from JSON string (from DB) or return default
 */
export function parseColorScheme(schemeJson?: string | null): ColorScheme | null {
  if (!schemeJson) return null;
  try {
    const parsed = JSON.parse(schemeJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as ColorScheme;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Linearly interpolate between two hex colors.
 */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * Map a raw pixel value to a color using the given scheme.
 * Returns null for NaN / nodata values (transparent).
 */
export function valueToColor(
  value: number | null | undefined,
  scheme: ColorScheme,
): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (scheme.length === 0) return null;

  // Sort by value just in case
  const sorted = [...scheme].sort((a, b) => a.value - b.value);

  // Below range — first color
  if (value <= sorted[0].value) return sorted[0].color;
  // Above range — last color
  if (value >= sorted[sorted.length - 1].value) {
    return sorted[sorted.length - 1].color;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value || 1);
      return lerpColor(a.color, b.color, t);
    }
  }
  return sorted[sorted.length - 1].color;
}

/**
 * Default fallback scheme (viridis-ish)
 */
export const DEFAULT_SCHEME: ColorScheme = [
  { value: 0, color: '#440154' },
  { value: 0.25, color: '#3b528b' },
  { value: 0.5, color: '#21918c' },
  { value: 0.75, color: '#5ec962' },
  { value: 1, color: '#fde725' },
];
