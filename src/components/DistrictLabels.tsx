import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Samarqand viloyati tuman markazlari
const DISTRICTS: { name: string; lat: number; lng: number; isCity?: boolean }[] = [
  { name: 'Samarqand', lat: 39.6542, lng: 66.9597, isCity: true },
  { name: 'Qo\'shrabot', lat: 40.1500, lng: 66.6100 },
  { name: 'Payariq', lat: 39.9400, lng: 66.7700 },
  { name: 'Ishtixon', lat: 39.9660, lng: 66.4830 },
  { name: 'Oqtosh', lat: 39.8500, lng: 66.4000 },
  { name: 'Ziyovuddin', lat: 39.8880, lng: 66.2650 },
  { name: 'Loyish', lat: 39.8200, lng: 66.7000 },
  { name: 'Bulungur', lat: 39.7700, lng: 67.2700 },
  { name: 'Jomboy', lat: 39.7200, lng: 67.1100 },
  { name: 'Juma', lat: 39.6100, lng: 66.8500 },
  { name: 'Nurobod', lat: 39.5500, lng: 66.9000 },
  { name: 'Urgut', lat: 39.4060, lng: 67.2440 },
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
