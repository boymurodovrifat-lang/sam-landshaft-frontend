import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import {
  parseColorScheme,
  valueToColor,
  DEFAULT_SCHEME,
  type ColorScheme,
} from '../lib/colorScheme';

interface CogLayerProps {
  url: string;              // COG fayl URL (backend /api/files/:id/cog)
  colorSchemeJson?: string | null;
  opacity?: number;
  minValue?: number | null; // Normalizatsiya uchun
  maxValue?: number | null;
  fitBounds?: boolean;
  onLoad?: (bounds: L.LatLngBounds) => void;
}

export default function CogLayer({
  url,
  colorSchemeJson,
  opacity = 0.75,
  minValue,
  maxValue,
  fitBounds = true,
  onLoad,
}: CogLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    let cancelled = false;
    let currentLayer: L.Layer | null = null;

    (async () => {
      try {
        // georaster HTTP Range Request bilan COG o'qiydi
        const georaster = await parseGeoraster(url);
        if (cancelled) return;

        const scheme: ColorScheme = parseColorScheme(colorSchemeJson) ?? DEFAULT_SCHEME;

        const min = minValue ?? (georaster.mins?.[0] ?? 0);
        const max = maxValue ?? (georaster.maxs?.[0] ?? 1);
        const range = max - min || 1;

        const layer = new GeoRasterLayer({
          georaster,
          opacity,
          resolution: 256, // brauzerda render paytida kichraytiradi
          pixelValuesToColorFn: (values: number[]) => {
            const raw = values[0];
            if (raw == null || Number.isNaN(raw)) return null as any;

            // Agar scheme absolute qiymatlar ishlatsa
            const useNormalized = scheme.every((s) => s.value >= 0 && s.value <= 1);
            const v = useNormalized ? (raw - min) / range : raw;
            return valueToColor(v, scheme) ?? 'rgba(0,0,0,0)';
          },
        });

        layer.addTo(map);
        currentLayer = layer;
        layerRef.current = layer;

        const bounds = L.latLngBounds(
          [georaster.ymin, georaster.xmin],
          [georaster.ymax, georaster.xmax],
        );
        if (fitBounds) map.fitBounds(bounds, { padding: [20, 20] });
        onLoad?.(bounds);
      } catch (err) {
        console.error('COG yuklashda xatolik:', err);
      }
    })();

    return () => {
      cancelled = true;
      if (currentLayer) map.removeLayer(currentLayer);
      else if (layerRef.current) map.removeLayer(layerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Opacity o'zgarganda
  useEffect(() => {
    if (layerRef.current && 'setOpacity' in layerRef.current) {
      (layerRef.current as any).setOpacity(opacity);
    }
  }, [opacity]);

  return null;
}
