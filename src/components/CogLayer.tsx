import { useEffect, useRef, useState } from 'react';
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
  url: string;
  colorSchemeJson?: string | null;
  opacity?: number;
  minValue?: number | null;
  maxValue?: number | null;
  fitBounds?: boolean;
  onLoad?: (bounds: L.LatLngBounds) => void;
  onLoading?: (loading: boolean) => void;
  onError?: (message: string) => void;
}

/**
 * Rang sxemasini 0-1 oraliqqa normalizatsiya qiladi.
 * Bu har qanday diapazondagi sxemani (0-1, 0-100, 0-16) birxil ishlashini ta'minlaydi.
 */
function normalizeScheme(scheme: ColorScheme): ColorScheme {
  if (scheme.length < 2) return scheme;
  const vals = scheme.map((s) => s.value);
  const sMin = Math.min(...vals);
  const sMax = Math.max(...vals);
  const sRange = sMax - sMin || 1;
  return scheme.map((s) => ({
    ...s,
    value: (s.value - sMin) / sRange,
  }));
}

export default function CogLayer({
  url,
  colorSchemeJson,
  opacity = 0.75,
  minValue,
  maxValue,
  fitBounds = true,
  onLoad,
  onLoading,
  onError,
}: CogLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let currentLayer: L.Layer | null = null;
    onLoading?.(true);
    onError?.('');

    (async () => {
      try {
        const georaster = await parseGeoraster(url);
        if (cancelled) return;

        const rawScheme: ColorScheme = parseColorScheme(colorSchemeJson) ?? DEFAULT_SCHEME;
        const normScheme = normalizeScheme(rawScheme);

        // Min/Max aniqlash: category > georaster > default
        const dataMin = minValue ?? georaster.mins?.[0] ?? 0;
        const dataMax = maxValue ?? georaster.maxs?.[0] ?? 1;
        const dataRange = dataMax - dataMin || 1;

        const noData = georaster.noDataValue;

        const layer = new GeoRasterLayer({
          georaster,
          opacity,
          resolution: 256,
          // Library's tile cache is a prototype-level object shared across
          // all layer instances — switching category reuses previous layer's
          // rendered tiles, showing wrong palette. Disable it.
          caching: false,
          pixelValuesToColorFn: (values: number[]) => {
            const raw = values[0];
            // NoData, null, NaN — shaffof
            if (raw == null || Number.isNaN(raw)) return null as any;
            if (noData != null && raw === noData) return null as any;

            // Pixel qiymatini 0-1 ga normalizatsiya
            const normalized = Math.max(0, Math.min(1, (raw - dataMin) / dataRange));

            return valueToColor(normalized, normScheme) ?? 'rgba(0,0,0,0)';
          },
        });

        layer.addTo(map);
        currentLayer = layer;
        layerRef.current = layer;
        setReady(true);

        const bounds = L.latLngBounds(
          [georaster.ymin, georaster.xmin],
          [georaster.ymax, georaster.xmax],
        );
        if (fitBounds) map.fitBounds(bounds, { padding: [20, 20] });
        onLoad?.(bounds);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'COG yuklashda xatolik';
          onError?.(msg);
        }
      } finally {
        if (!cancelled) onLoading?.(false);
      }
    })();

    return () => {
      cancelled = true;
      if (currentLayer) map.removeLayer(currentLayer);
      else if (layerRef.current) map.removeLayer(layerRef.current);
      layerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (layerRef.current && 'setOpacity' in layerRef.current) {
      (layerRef.current as any).setOpacity(opacity);
    }
  }, [opacity]);

  return null;
}
