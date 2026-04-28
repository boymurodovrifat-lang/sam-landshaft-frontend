import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Samarqand viloyati tuman markazlari
const DISTRICTS: { name: string; lat: number; lng: number; isCity?: boolean }[] = [
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597, isCity: true },
  { name: 'Kattaqo\'rg\'on', lat: 39.901812, lng: 66.268494, isCity: true },
  { name: 'Qo\'shrabot', lat: 40.246400, lng: 66.648957 },
  { name: 'Payshanba', lat: 40.010864, lng: 66.229284 },
  { name: 'Oqtosh', lat: 39.921635, lng: 65.925364 },
  { name: 'Payariq', lat: 39.990494, lng: 66.846066 },
  { name: 'Ishtixon', lat: 39.965617, lng: 66.485560 },
  { name: 'Loyish', lat: 39.879273, lng: 66.751812 },
  { name: 'Bulungur', lat: 39.763888, lng: 67.272276 },
  { name: 'Juma', lat: 39.711835, lng: 66.662717 },
  { name: 'Jomboy', lat: 39.695892, lng: 67.097526 },
  { name: 'Nurobod', lat: 39.608407, lng: 66.282603 },
  { name: 'Toyloq', lat: 39.599094, lng: 67.092022 },
  { name: 'Gulobod', lat: 39.583125, lng: 66.957176 },
  { name: 'Urgut', lat: 39.409358, lng: 67.242004 },
  { name: 'Ziyovuddin', lat: 40.116667, lng: 65.516667 },
];

interface Props {
  visible?: boolean;
}

export default function DistrictLabels({ visible = true }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const layers: L.Layer[] = [];

    DISTRICTS.forEach(({ name, lat, lng, isCity }) => {
      const radius = isCity ? 5 : 4;
      const fillColor = isCity ? '#1e3a8a' : '#ffffff';
      const strokeColor = isCity ? '#93c5fd' : '#1e3a8a';
      const weight = isCity ? 1.5 : 1.5;

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor,
        fillOpacity: 1,
        color: strokeColor,
        weight,
        interactive: false,
      });

      const tooltip = L.tooltip({
        permanent: true,
        direction: 'right',
        offset: [6, 0],
        className: isCity ? 'district-label district-label--city' : 'district-label',
        interactive: false,
      }).setContent(name);

      marker.bindTooltip(tooltip);
      marker.addTo(map);
      layers.push(marker);
    });

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [map, visible]);

  return null;
}
