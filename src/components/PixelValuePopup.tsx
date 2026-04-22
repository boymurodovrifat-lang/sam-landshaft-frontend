import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import parseGeoraster from 'georaster';

export interface PickedPixel {
  lat: number;
  lng: number;
  value: number | null;
  loading?: boolean;
}

interface Props {
  cogUrl: string | null;
  pickedLatLng?: { lat: number; lng: number } | null;
  onPick: (info: PickedPixel) => void;
}

const pinIcon = L.divIcon({
  className: 'sam-pin-icon',
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 34px;
      transform: translate(-12px, -34px);
    ">
      <svg viewBox="0 0 24 34" width="24" height="34" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 34 12 34 C12 34 24 21 24 12 C24 5.4 18.6 0 12 0 Z"
              fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

export default function PixelValuePopup({ cogUrl, pickedLatLng, onPick }: Props) {
  const map = useMap();
  const georasterRef = useRef<any>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const reqIdRef = useRef(0);

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

    return () => {
      cancelled = true;
    };
  }, [cogUrl]);

  // Reflect external pickedLatLng (e.g. cleared on close) in marker
  useEffect(() => {
    if (!pickedLatLng) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([pickedLatLng.lat, pickedLatLng.lng]);
    } else {
      markerRef.current = L.marker([pickedLatLng.lat, pickedLatLng.lng], {
        icon: pinIcon,
        interactive: false,
        keyboard: false,
      }).addTo(map);
    }
  }, [pickedLatLng, map]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  useMapEvents({
    async click(e) {
      const gr = georasterRef.current;
      const { lat, lng } = e.latlng;

      if (!gr) return;

      if (lat < gr.ymin || lat > gr.ymax || lng < gr.xmin || lng > gr.xmax) {
        return;
      }

      const reqId = ++reqIdRef.current;

      // Optimistic report — pin appears immediately, value still loading
      onPick({ lat, lng, value: null, loading: true });

      // Try fast path: in-memory values (non-COG or fully loaded)
      let value: number | null = null;
      try {
        if (gr.values && gr.values[0]) {
          const x = Math.floor((lng - gr.xmin) / gr.pixelWidth);
          const y = Math.floor((gr.ymax - lat) / gr.pixelHeight);
          if (x >= 0 && x < gr.width && y >= 0 && y < gr.height) {
            const v = gr.values[0][y]?.[x];
            if (v != null && !Number.isNaN(v) && v !== gr.noDataValue) value = v;
          }
        }
      } catch {
        // fall through to async
      }

      // Fallback: async getValues for COG / lazy raster
      // NOTE: georaster.getValues wraps geotiff.readRasters — window is in
      // PIXEL coords (not lat/lng). Need geo→pixel conversion.
      if (value == null && typeof gr.getValues === 'function') {
        try {
          const px = Math.floor((lng - gr.xmin) / gr.pixelWidth);
          const py = Math.floor((gr.ymax - lat) / gr.pixelHeight);
          if (px >= 0 && px < gr.width && py >= 0 && py < gr.height) {
            const data = await gr.getValues({
              left: px,
              top: py,
              right: px + 1,
              bottom: py + 1,
              width: 1,
              height: 1,
            });
            if (reqId !== reqIdRef.current) return;
            const cell = (data as any)?.[0]?.[0];
            let v: number | null = null;
            if (Array.isArray(cell)) v = cell[0] ?? null;
            else if (cell && typeof cell === 'object') v = cell[0] ?? cell['0'] ?? null;
            if (v != null && !Number.isNaN(v) && v !== gr.noDataValue) value = v;
          }
        } catch {
          // ignore — value stays null
        }
      }

      if (reqId !== reqIdRef.current) return;
      onPick({ lat, lng, value, loading: false });
    },
  });

  return null;
}
