import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import parseGeoraster from 'georaster';

interface Props {
  cogUrl: string | null;
  categoryName?: string;
  unit?: string;
}

export default function PixelValuePopup({ cogUrl, categoryName, unit }: Props) {
  const map = useMap();
  const georasterRef = useRef<any>(null);

  // COG o'zgarganda georaster'ni yuklash
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
        // CogLayer allaqachon xatolikni handle qiladi
      }
    })();

    return () => { cancelled = true; };
  }, [cogUrl]);

  useMapEvents({
    click(e) {
      const gr = georasterRef.current;
      if (!gr) return;

      const { lat, lng } = e.latlng;

      // Bounds tekshirish
      if (lat < gr.ymin || lat > gr.ymax || lng < gr.xmin || lng > gr.xmax) {
        return; // Xarita chegarasidan tashqarida
      }

      // Pixel koordinatalarini hisoblash
      const x = Math.floor((lng - gr.xmin) / gr.pixelWidth);
      const y = Math.floor((gr.ymax - lat) / gr.pixelHeight);

      if (x < 0 || x >= gr.width || y < 0 || y >= gr.height) return;

      // Pixel qiymatini o'qish
      let value: number | null = null;
      try {
        if (gr.values && gr.values[0]) {
          value = gr.values[0][y]?.[x] ?? null;
        }
      } catch {
        return;
      }

      if (value == null || Number.isNaN(value) || value === gr.noDataValue) {
        L.popup()
          .setLatLng(e.latlng)
          .setContent(`
            <div style="font-family:sans-serif;font-size:13px;min-width:120px">
              <div style="color:#94a3b8;font-size:11px">${categoryName || 'Qiymat'}</div>
              <div style="color:#64748b;margin-top:4px">Ma'lumot yo'q</div>
            </div>
          `)
          .openOn(map);
        return;
      }

      const formatted = Number.isInteger(value) ? String(value) : value.toFixed(4);

      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div style="font-family:sans-serif;font-size:13px;min-width:140px">
            <div style="color:#94a3b8;font-size:11px;margin-bottom:4px">${categoryName || 'Qiymat'}</div>
            <div style="font-size:20px;font-weight:700;color:#1e293b">
              ${formatted}
              <span style="font-size:12px;font-weight:400;color:#64748b">${unit || ''}</span>
            </div>
            <div style="color:#94a3b8;font-size:10px;margin-top:6px">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
        `)
        .openOn(map);
    },
  });

  return null;
}
