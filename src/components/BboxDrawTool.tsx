import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useBboxStore } from '../store/bboxStore';
import type { Bbox } from '../lib/bbox';

const RECT_STYLE: L.PathOptions = {
  color: '#0ea5e9',
  weight: 2,
  fillColor: '#0ea5e9',
  fillOpacity: 0.1,
};

/**
 * Drives bbox selection on top of the Leaflet map.
 *
 * - When the store enters `drawing` mode: map pan is disabled and
 *   mousedown/move/up renders a live rectangle. Esc cancels.
 * - When the store has a committed bbox and is `idle`: renders a
 *   persistent rectangle so the user can see what they selected.
 */
export default function BboxDrawTool() {
  const map = useMap();
  const bbox = useBboxStore((s) => s.bbox);
  const drawMode = useBboxStore((s) => s.drawMode);
  const setBbox = useBboxStore((s) => s.setBbox);
  const cancelDrawing = useBboxStore((s) => s.cancelDrawing);

  const drawingRef = useRef<{
    start: L.LatLng | null;
    rect: L.Rectangle | null;
  }>({ start: null, rect: null });
  const persistentRectRef = useRef<L.Rectangle | null>(null);

  // Persistent rectangle for committed bbox.
  useEffect(() => {
    if (persistentRectRef.current) {
      map.removeLayer(persistentRectRef.current);
      persistentRectRef.current = null;
    }
    if (bbox && drawMode === 'idle') {
      const rect = L.rectangle(
        [
          [bbox.minLat, bbox.minLng],
          [bbox.maxLat, bbox.maxLng],
        ],
        RECT_STYLE,
      ).addTo(map);
      persistentRectRef.current = rect;
    }
  }, [bbox, drawMode, map]);

  // Active draw handlers.
  useEffect(() => {
    if (drawMode !== 'drawing') return;

    map.dragging.disable();
    map.doubleClickZoom.disable();
    const container = map.getContainer();
    container.style.cursor = 'crosshair';

    const cleanupRect = () => {
      if (drawingRef.current.rect) {
        map.removeLayer(drawingRef.current.rect);
        drawingRef.current.rect = null;
      }
      drawingRef.current.start = null;
    };

    const onDown = (e: L.LeafletMouseEvent) => {
      drawingRef.current.start = e.latlng;
      if (drawingRef.current.rect) map.removeLayer(drawingRef.current.rect);
      drawingRef.current.rect = L.rectangle(
        L.latLngBounds(e.latlng, e.latlng),
        RECT_STYLE,
      ).addTo(map);
    };
    const onMove = (e: L.LeafletMouseEvent) => {
      const start = drawingRef.current.start;
      if (!start || !drawingRef.current.rect) return;
      drawingRef.current.rect.setBounds(L.latLngBounds(start, e.latlng));
    };
    const onUp = (e: L.LeafletMouseEvent) => {
      const start = drawingRef.current.start;
      if (!start) return;
      const b: Bbox = {
        minLng: Math.min(start.lng, e.latlng.lng),
        minLat: Math.min(start.lat, e.latlng.lat),
        maxLng: Math.max(start.lng, e.latlng.lng),
        maxLat: Math.max(start.lat, e.latlng.lat),
      };
      // Zero-area click — ignore.
      if (b.maxLng - b.minLng < 1e-6 || b.maxLat - b.minLat < 1e-6) {
        cleanupRect();
        cancelDrawing();
        return;
      }
      cleanupRect();
      setBbox(b);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupRect();
        cancelDrawing();
      }
    };

    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
    window.addEventListener('keydown', onKey);

    return () => {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
      map.dragging.enable();
      map.doubleClickZoom.enable();
      container.style.cursor = '';
      cleanupRect();
    };
  }, [drawMode, map, setBbox, cancelDrawing]);

  return null;
}
