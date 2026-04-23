import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Samarqand viloyati tuman markazlari
const DISTRICTS: { name: string; lat: number; lng: number; isCity?: boolean }[] = [
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597, isCity: true },
  { name: 'Kattaqo\'rg\'on', lat: 39.8968, lng: 66.2595, isCity: true },
  { name: 'Ishtixon', lat: 39.9656, lng: 66.4827 },
  { name: 'Qo\'shrabot', lat: 39.959, lng: 65.401 },
  { name: 'Loyish', lat: 39.798, lng: 66.697 },
  { name: 'Juma', lat: 40.005, lng: 67.072 },
  { name: 'Ziyovuddin', lat: 39.888, lng: 66.265 },
  { name: 'Oqtosh', lat: 39.553, lng: 66.578 },
  { name: 'Payariq', lat: 39.676, lng: 66.754 },
  { name: 'Payshanba', lat: 39.700, lng: 67.080 },
  { name: 'Jomboy', lat: 39.712, lng: 67.427 },
  { name: 'Bulungur', lat: 39.776, lng: 67.279 },
  { name: 'Gulobod', lat: 39.783, lng: 67.567 },
  { name: 'Urgut', lat: 39.396, lng: 67.252 },
  { name: 'Nurobod', lat: 39.463, lng: 67.175 },
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
