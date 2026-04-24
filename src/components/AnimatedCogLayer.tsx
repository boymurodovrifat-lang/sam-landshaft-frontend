import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import parseGeoraster, { type Georaster } from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import {
  parseColorScheme,
  valueToColor,
  DEFAULT_SCHEME,
  type ColorScheme,
} from '../lib/colorScheme';
import type { GeotiffFile } from '../types';

interface AnimatedCogLayerProps {
  files: GeotiffFile[];
  currentFileId: number | null;
  apiBase: string;
  colorSchemeJson?: string | null;
  opacity?: number;
  minValue?: number | null;
  maxValue?: number | null;
  fitBoundsOnce?: boolean;
  onProgress?: (done: number, total: number) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
}

function normalizeScheme(scheme: ColorScheme): ColorScheme {
  if (scheme.length < 2) return scheme;
  const vals = scheme.map((s) => s.value);
  const sMin = Math.min(...vals);
  const sMax = Math.max(...vals);
  const sRange = sMax - sMin || 1;
  return scheme.map((s) => ({ ...s, value: (s.value - sMin) / sRange }));
}

export default function AnimatedCogLayer({
  files,
  currentFileId,
  apiBase,
  colorSchemeJson,
  opacity = 0.75,
  minValue,
  maxValue,
  fitBoundsOnce = true,
  onProgress,
  onReady,
  onError,
}: AnimatedCogLayerProps) {
  const map = useMap();
  const layersRef = useRef<Map<number, L.Layer>>(new Map());
  const readyRef = useRef(false);

  const filesKey = useMemo(
    () => files.map((f) => f.id).sort((a, b) => a - b).join(','),
    [files],
  );

  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;
    onError?.('');

    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current.clear();

    if (files.length === 0) return;

    const rawScheme: ColorScheme = parseColorScheme(colorSchemeJson) ?? DEFAULT_SCHEME;
    const normScheme = normalizeScheme(rawScheme);

    let done = 0;
    onProgress?.(0, files.length);

    (async () => {
      try {
        const georasters = await Promise.all(
          files.map(async (f) => {
            const url = `${apiBase}/files/${f.id}/cog`;
            const georaster = await parseGeoraster(url);
            return { file: f, georaster };
          }),
        );
        if (cancelled) return;

        let firstBounds: L.LatLngBounds | null = null;

        await Promise.all(
          georasters.map(({ file, georaster }) =>
            new Promise<void>((resolve) => {
              const dataMin = minValue ?? georaster.mins?.[0] ?? 0;
              const dataMax = maxValue ?? georaster.maxs?.[0] ?? 1;
              const dataRange = dataMax - dataMin || 1;
              const noData = georaster.noDataValue;

              const layer = new GeoRasterLayer({
                georaster: georaster as Georaster,
                opacity: 0,
                resolution: 256,
                caching: false,
                pixelValuesToColorFn: (values: number[]) => {
                  const raw = values[0];
                  if (raw == null || Number.isNaN(raw)) return null as any;
                  if (noData != null && raw === noData) return null as any;
                  const normalized = Math.max(
                    0,
                    Math.min(1, (raw - dataMin) / dataRange),
                  );
                  return valueToColor(normalized, normScheme) ?? 'rgba(0,0,0,0)';
                },
              });

              if (!firstBounds) {
                firstBounds = L.latLngBounds(
                  [georaster.ymin, georaster.xmin],
                  [georaster.ymax, georaster.xmax],
                );
              }

              let settled = false;
              const finish = () => {
                if (settled) return;
                settled = true;
                if (cancelled) {
                  map.removeLayer(layer);
                  resolve();
                  return;
                }
                layersRef.current.set(file.id, layer);
                done += 1;
                onProgress?.(done, files.length);
                resolve();
              };

              layer.once('load', finish);
              layer.addTo(map);
              // safety — bounded COG with no visible tiles / network hiccup
              setTimeout(finish, 20000);
            }),
          ),
        );

        if (cancelled) return;

        if (fitBoundsOnce && firstBounds) {
          map.fitBounds(firstBounds, { padding: [20, 20] });
        }

        readyRef.current = true;
        onReady?.();
      } catch (err) {
        if (!cancelled) {
          onError?.(
            err instanceof Error ? err.message : 'COG preload xatolik',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      layersRef.current.forEach((l) => map.removeLayer(l));
      layersRef.current.clear();
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey, colorSchemeJson, minValue, maxValue, apiBase]);

  // Swap visible layer — instant, no reload
  useEffect(() => {
    layersRef.current.forEach((l, id) => {
      if ('setOpacity' in l) {
        (l as any).setOpacity(id === currentFileId ? opacity : 0);
      }
    });
  }, [currentFileId, opacity]);

  return null;
}
