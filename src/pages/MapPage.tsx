import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Download, FileImage, Film, Play, Pause } from 'lucide-react';
import { categoriesApi } from '../api/categories';
import { filesApi } from '../api/files';
import type { Category, GeotiffFile } from '../types';
import CogLayer from '../components/CogLayer';
import Legend from '../components/Legend';
import { recordAnimation, downloadBlob } from '../lib/videoRecorder';

// Samarqand viloyati markazi
const SAMARKAND_CENTER: [number, number] = [39.6547, 66.9597];
const SAMARKAND_ZOOM = 9;

type BasemapKey = 'osm' | 'satellite' | 'dark';

const BASEMAPS: Record<BasemapKey, { url: string; attribution: string; name: string }> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    name: 'Sun\'iy yo\'ldosh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  dark: {
    name: 'Qorong\'u',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
  },
};

export default function MapPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<GeotiffFile[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(0.75);
  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState<{ done: number; total: number } | null>(null);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const [cats, allFiles] = await Promise.all([
          categoriesApi.getAll(),
          filesApi.getAll(),
        ]);
        setCategories(cats);
        setFiles(allFiles);
        if (cats.length > 0) setSelectedCategoryId(cats[0].id);
      } catch (err) {
        console.error("Ma'lumot yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter files by selected category
  const filesForCategory = useMemo(
    () => files.filter((f) => f.categoryId === selectedCategoryId),
    [files, selectedCategoryId],
  );

  // Available years for current category
  const availableYears = useMemo(
    () => [...new Set(filesForCategory.map((f) => f.year))].sort((a, b) => a - b),
    [filesForCategory],
  );

  // Set first year when category changes
  useEffect(() => {
    if (availableYears.length > 0) {
      if (!selectedYear || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[availableYears.length - 1]);
      }
    } else {
      setSelectedYear(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, availableYears.length]);

  // Current file & category
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || null;
  const currentFile = filesForCategory.find((f) => f.year === selectedYear) || null;

  // Animation — yillar orasida o'tish
  useEffect(() => {
    if (!playing || availableYears.length < 2) return;
    const t = setInterval(() => {
      setSelectedYear((y) => {
        if (y == null) return availableYears[0];
        const idx = availableYears.indexOf(y);
        const next = availableYears[(idx + 1) % availableYears.length];
        return next;
      });
    }, 1500);
    return () => clearInterval(t);
  }, [playing, availableYears]);

  const cogUrl = currentFile
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/files/${currentFile.id}/cog`
    : null;

  const handleDownloadTiff = () => {
    if (!currentFile) return;
    window.location.href = filesApi.getDownloadUrl(currentFile.id, 'tiff');
  };

  const handleDownloadJpg = async () => {
    // Simple: ekranni screenshot qilib olish
    const mapEl = document.querySelector('.leaflet-container') as HTMLElement | null;
    if (!mapEl) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(mapEl, { useCORS: true, allowTaint: true });
    const link = document.createElement('a');
    link.download = `${currentCategory?.slug || 'map'}_${selectedYear}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
  };

  const handleExportVideo = async () => {
    if (!currentCategory || availableYears.length < 2) return;
    const mapEl = document.querySelector('.leaflet-container') as HTMLElement | null;
    if (!mapEl) return;
    setRecording(true);
    setPlaying(false);
    setRecordProgress({ done: 0, total: availableYears.length });
    try {
      const { blob, ext } = await recordAnimation({
        mapEl,
        years: availableYears,
        holdMs: 1500,
        fps: 24,
        onYearChange: async (year) => {
          setSelectedYear(year);
        },
        onProgress: (done, total) => setRecordProgress({ done, total }),
      });
      downloadBlob(blob, `${currentCategory.slug}_animation.${ext}`);
    } catch (err) {
      console.error('Video eksportida xatolik:', err);
      alert('Video yaratishda xatolik yuz berdi.');
    } finally {
      setRecording(false);
      setRecordProgress(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary-900 text-white px-6 py-3 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight">Sam-Landshaft</h1>
          <p className="text-xs text-primary-100">Samarqand viloyati landshaft xaritalari</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={basemap}
            onChange={(e) => setBasemap(e.target.value as BasemapKey)}
            className="bg-primary-700 text-white text-sm rounded px-2 py-1"
          >
            {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
              <option key={k} value={k}>
                {BASEMAPS[k].name}
              </option>
            ))}
          </select>
          <a
            href="/admin/login"
            className="text-sm text-primary-100 hover:text-white border border-primary-400 rounded px-3 py-1"
          >
            Admin
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r p-4 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500">Yuklanmoqda...</p>
          ) : categories.length === 0 ? (
            <div className="text-sm text-gray-500">
              Hali birorta kategoriya qo'shilmagan.
              <br />
              Admin panel orqali qo'shing.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Kategoriya
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={selectedCategoryId ?? ''}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {currentCategory?.description && (
                  <p className="text-xs text-gray-500 mt-2">{currentCategory.description}</p>
                )}
              </div>

              {/* Years */}
              {availableYears.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Yil
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-2 py-1.5 rounded-lg text-sm font-medium transition ${
                          year === selectedYear
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  {availableYears.length > 1 && (
                    <button
                      onClick={() => setPlaying((p) => !p)}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg py-1.5 text-sm"
                    >
                      {playing ? <Pause size={14} /> : <Play size={14} />}
                      {playing ? 'To\'xtatish' : 'Animatsiya'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">
                  Bu kategoriya uchun fayl yo'q
                </div>
              )}

              {/* Opacity */}
              {currentFile && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Shaffoflik: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              {/* File info & download */}
              {currentFile && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="text-sm">
                    <div className="font-medium truncate">{currentFile.filename}</div>
                    <div className="text-gray-500 text-xs">
                      Hajm: {(Number(currentFile.fileSize) / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadTiff}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-1.5 text-sm font-medium"
                  >
                    <Download size={14} /> GeoTIFF yuklab olish
                  </button>
                  <button
                    onClick={handleDownloadJpg}
                    className="w-full flex items-center justify-center gap-2 bg-white border hover:bg-gray-50 text-gray-700 rounded-lg py-1.5 text-sm"
                  >
                    <FileImage size={14} /> JPG (skrinshot)
                  </button>
                  {availableYears.length > 1 && (
                    <button
                      onClick={handleExportVideo}
                      disabled={recording}
                      className="w-full flex items-center justify-center gap-2 bg-white border hover:bg-gray-50 text-gray-700 rounded-lg py-1.5 text-sm disabled:opacity-60"
                    >
                      <Film size={14} />
                      {recording && recordProgress
                        ? `Video tayyorlanmoqda... ${recordProgress.done}/${recordProgress.total}`
                        : 'Animatsiya videosi'}
                    </button>
                  )}
                </div>
              )}

              {/* Legend */}
              {currentFile && currentCategory && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Legenda
                  </label>
                  <Legend
                    colorSchemeJson={currentCategory.colorScheme}
                    unit={currentCategory.unit}
                  />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={SAMARKAND_CENTER}
            zoom={SAMARKAND_ZOOM}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              key={basemap}
              url={BASEMAPS[basemap].url}
              attribution={BASEMAPS[basemap].attribution}
            />
            {cogUrl && currentCategory && (
              <CogLayer
                key={cogUrl}
                url={cogUrl}
                colorSchemeJson={currentCategory.colorScheme}
                opacity={opacity}
                minValue={currentCategory.minValue ?? null}
                maxValue={currentCategory.maxValue ?? null}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
