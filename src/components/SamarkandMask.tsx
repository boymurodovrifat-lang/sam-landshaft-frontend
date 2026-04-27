import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  visible?: boolean;
  opacity?: number;
  color?: string;
}

type Ring = [number, number][];

export default function SamarkandMask({
  visible = true,
  opacity = 0.55,
  color = '#0b1220',
}: Props) {
  const map = useMap();
  const [region, setRegion] = useState<Ring[] | null>(null);

  useEffect(() => {
    let aborted = false;
    fetch('/samarkand-region.geojson')
      .then((r) => r.json())
      .then((gj) => {
        if (aborted) return;
        const geom = gj.geometry;
        if (!geom) return;
        let polys: Ring[][] = [];
        if (geom.type === 'Polygon') polys = [geom.coordinates];
        else if (geom.type === 'MultiPolygon') polys = geom.coordinates;
        const rings = polys.map((p) => p[0] as Ring);
        setRegion(rings);
      })
      .catch((e) => console.error('Mask boundary load failed:', e));
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    if (!visible || !region) return;

    const MASK_PANE = 'samarkand-mask-pane';
    const OUTLINE_PANE = 'samarkand-outline-pane';
    if (!map.getPane(MASK_PANE)) {
      const p = map.createPane(MASK_PANE);
      p.style.zIndex = '450';
      p.style.pointerEvents = 'none';
    }
    if (!map.getPane(OUTLINE_PANE)) {
      const p = map.createPane(OUTLINE_PANE);
      p.style.zIndex = '460';
      p.style.pointerEvents = 'none';
    }

    const world: [number, number][] = [
      [-90, -360],
      [-90, 360],
      [90, 360],
      [90, -360],
    ];

    const holes: [number, number][][] = region.map((ring) =>
      ring.map(([lng, lat]) => [lat, lng] as [number, number]),
    );

    const mask = L.polygon([world, ...holes], {
      stroke: false,
      fillColor: color,
      fillOpacity: opacity,
      interactive: false,
      pane: MASK_PANE,
    });

    const outline = L.polygon(holes, {
      fill: false,
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.9,
      interactive: false,
      pane: OUTLINE_PANE,
    });

    mask.addTo(map);
    outline.addTo(map);

    return () => {
      map.removeLayer(mask);
      map.removeLayer(outline);
    };
  }, [map, region, visible, opacity, color]);

  return null;
}
