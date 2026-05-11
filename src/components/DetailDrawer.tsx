import { useMemo, useState } from 'react';
import { X, Download, Pencil } from 'lucide-react';
import { useBboxStore } from '../store/bboxStore';
import { computeStats, type ColorStop } from '../lib/cogStats';
import { parseColorScheme } from '../lib/colorScheme';
import { filesApi } from '../api/files';
import DetailStatsCard from './DetailStatsCard';
import DetailHistogram from './DetailHistogram';
import DetailClassChart from './DetailClassChart';
import DetailYearTrend from './DetailYearTrend';

interface Props {
  georaster: any | null;
  categoryId: number | null;
  categoryName?: string;
  colorSchemeJson?: string | null;
  unit?: string | null;
  currentFileId: number | null;
  hasMultiYear: boolean;
}

type Tab = 'stats' | 'hist' | 'class' | 'trend';

/**
 * Right-side (desktop) / bottom-sheet (mobile) panel that renders the
 * stats + chart tabs for the active bbox. Mounts only when a bbox is
 * committed in the store.
 */
export default function DetailDrawer({
  georaster,
  categoryId,
  categoryName,
  colorSchemeJson,
  unit,
  currentFileId,
  hasMultiYear,
}: Props) {
  const bbox = useBboxStore((s) => s.bbox);
  const setBbox = useBboxStore((s) => s.setBbox);
  const startDrawing = useBboxStore((s) => s.startDrawing);
  const [tab, setTab] = useState<Tab>('stats');

  const scheme = useMemo<ColorStop[] | undefined>(
    () => parseColorScheme(colorSchemeJson) ?? undefined,
    [colorSchemeJson],
  );

  const stats = useMemo(() => {
    if (!georaster || !bbox) return null;
    return computeStats(georaster, bbox, scheme);
  }, [georaster, bbox, scheme]);

  if (!bbox) return null;

  const handleClose = () => setBbox(null);
  const handleRedraw = () => startDrawing();
  const handleDownload = () => {
    if (!currentFileId || !bbox) return;
    window.location.href = filesApi.getCropUrl(currentFileId, bbox);
  };

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'stats', label: 'Statistika', show: true },
    { key: 'hist', label: 'Histogramma', show: true },
    { key: 'class', label: 'Sinf %', show: !!scheme },
    { key: 'trend', label: 'Yillar trendi', show: hasMultiYear },
  ];

  return (
    <aside
      className="
        fixed md:absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto
        md:w-[420px] w-full max-h-[80vh] md:max-h-none md:h-full
        bg-white z-[1100] shadow-2xl border-t md:border-l md:border-t-0
        flex flex-col
      "
    >
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {categoryName ?? 'Hudud tahlili'}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {bbox.minLng.toFixed(3)}, {bbox.minLat.toFixed(3)} →{' '}
            {bbox.maxLng.toFixed(3)}, {bbox.maxLat.toFixed(3)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleRedraw}
            title="Qayta chizish"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={handleClose}
            title="Yopish"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <nav className="flex border-b text-xs overflow-x-auto">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 whitespace-nowrap border-b-2 ${
                tab === t.key
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!stats && (
          <div className="text-sm text-gray-500">Hisoblanmoqda...</div>
        )}
        {stats && tab === 'stats' && (
          <DetailStatsCard stats={stats} unit={unit} />
        )}
        {stats && tab === 'hist' && (
          <DetailHistogram stats={stats} unit={unit} />
        )}
        {stats && tab === 'class' && <DetailClassChart stats={stats} />}
        {tab === 'trend' && categoryId != null && (
          <DetailYearTrend
            categoryId={categoryId}
            bbox={bbox}
            unit={unit}
          />
        )}
      </div>

      <footer className="p-3 border-t">
        <button
          onClick={handleDownload}
          disabled={!currentFileId}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
        >
          <Download size={14} /> Qirqilgan GeoTIFF yuklab olish
        </button>
      </footer>
    </aside>
  );
}
