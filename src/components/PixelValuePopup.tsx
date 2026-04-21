import { useEffect, useRef } from 'react';
import { useMapEvents } from 'react-leaflet';
import parseGeoraster from 'georaster';

export interface PickedPixel {
  lat: number;
  lng: number;
  value: number | null;
}

interface Props {
  cogUrl: string | null;
  onPick: (info: PickedPixel) => void;
}

export default function PixelValuePopup({ cogUrl, onPick }: Props) {
  const georasterRef = useRef<any>(null);

  useEffect(() => {
    if (!cogUrl) {
      georasterRef.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const gr = await parseGeoraster(cogUrl);
        if (!cancelled) georasterRef.current = gr;
      } catch {
        // CogLayer handles error
      }
    })();

    return () => { cancelled = true; };
  }, [cogUrl]);

  useMapEvents({
    click(e) {
      const gr = georasterRef.current;
      if (!gr) return;

      const { lat, lng } = e.latlng;

      if (lat < gr.ymin || lat > gr.ymax || lng < gr.xmin || lng > gr.xmax) {
        return;
      }

      const x = Math.floor((lng - gr.xmin) / gr.pixelWidth);
      const y = Math.floor((gr.ymax - lat) / gr.pixelHeight);

      if (x < 0 || x >= gr.width || y < 0 || y >= gr.height) return;

      let value: number | null = null;
      try {
        if (gr.values && gr.values[0]) {
          value = gr.values[0][y]?.[x] ?? null;
        }
      } catch {
        return;
      }

      if (value == null || Number.isNaN(value) || value === gr.noDataValue) {
        onPick({ lat, lng, value: null });
        return;
      }

      onPick({ lat, lng, value });
    },
  });

  return null;
}
