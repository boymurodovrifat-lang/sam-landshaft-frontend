import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Download, FileImage, Film, Play, Pause, Menu, X } from 'lucide-react';
import { categoriesApi } from '../api/categories';
import { filesApi } from '../api/files';
import type { Category, GeotiffFile } from '../types';
import CogLayer from '../components/CogLayer';
import Legend from '../components/Legend';
import PixelValuePopup, { type PickedPixel } from '../components/PixelValuePopup';
import PixelInfoCard from '../components/PixelInfoCard';
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
  const [selectedRootId, setSelectedRootId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(0.75);
  const [basemap, setBasemap] = useState<BasemapKey>('osm');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState<{ done: number; total: number } | null>(null);
  const [cogLoading, setCogLoading] = useState(false);
  const cogLoadingRef = useRef(false);
  const [cogError, setCogError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pickedPixel, setPickedPixel] = useState<PickedPixel | null>(null);

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

        // Birinchi faylga ega subkategoriyani tanlab qo'yish
        const fileCatIds = new Set(allFiles.map((f) => f.categoryId));
        const firstSubWithFile = cats.find(
          (c) => c.parentId != null && fileCatIds.has(c.id),
        );
        if (firstSubWithFile) {
          setSelectedCategoryId(firstSubWithFile.id);
          setSelectedRootId(firstSubWithFile.parentId ?? null);
        } else {
          const firstRoot = cats.find((c) => c.parentId == null);
          if (firstRoot) setSelectedRootId(firstRoot.id);
        }
      } catch (err) {
        console.error("Ma'lumot yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rootCategories = useMemo(
    () => categories
      .filter((c) => c.parentId == null)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [categories],
  );

  const subcategoriesForRoot = useMemo(
    () => categories
      .filter((c) => c.parentId === selectedRootId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [categories, selectedRootId],
  );

  // Root o'zgarganda — birinchi subkategoriyani tanlash (faylga ega bo'lsa ustun)
  useEffect(() => {
    if (selectedRootId == null) return;
    if (
      selectedCategoryId != null &&
      subcategoriesForRoot.some((c) => c.id === selectedCategoryId)
    ) {
      return;
    }
    const fileCatIds = new Set(files.map((f) => f.categoryId));
    const withFile = subcategoriesForRoot.find((c) => fileCatIds.has(c.id));
    setSelectedCategoryId(withFile?.id ?? subcategoriesForRoot[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRootId, subcategoriesForRoot.length]);

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

  // Animation — advance only when the current frame has actually loaded.
  // Previously a naïve setInterval raced through years while tiles were
  // still fetching, so some frames were never shown.
  useEffect(() => {
    if (!playing || availableYears.length < 2) return;
    if (cogLoading) return; // wait for current frame's tiles
    const t = setTimeout(() => {
      setSelectedYear((y) => {
        if (y == null) return availableYears[0];
        const idx = availableYears.indexOf(y);
        return availableYears[(idx + 1) % availableYears.length];
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [playing, availableYears, cogLoading, selectedYear]);

  const cogUrl = currentFile
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/files/${currentFile.id}/cog`
    : null;

  // File/category changes → close card
  useEffect(() => {
    setPickedPixel(null);
  }, [cogUrl]);

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
        // Wait until tiles for the new year have actually rendered.
        // Ref-based polling keeps this out of the render loop.
        waitForFrame: async () => {
          // Give React a tick to propagate the new year + kick off load
          await new Promise<void>((r) => setTimeout(r, 150));
          const deadline = Date.now() + 15_000;
          while (cogLoadingRef.current && Date.now() < deadline) {
            await new Promise<void>((r) => setTimeout(r, 100));
          }
          // Small settle delay for the final paint
          await new Promise<void>((r) => setTimeout(r, 250));
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
      <header className="bg-primary-900 text-white px-4 md:px-6 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1 rounded hover:bg-primary-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold leading-tight">Sam-Landshaft</h1>
            <p className="text-xs text-primary-100 hidden sm:block">Samarqand viloyati landshaft xaritalari</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <select
            value={basemap}
            onChange={(e) => setBasemap(e.target.value as BasemapKey)}
            className="bg-primary-700 text-white text-xs md:text-sm rounded px-2 py-1"
          >
            {(Object.keys(BASEMAPS) as BasemapKey[]).map((k) => (
              <option key={k} value={k}>
                {BASEMAPS[k].name}
              </option>
            ))}
          </select>
          <a
            href="/admin/login"
            className="text-xs md:text-sm text-primary-100 hover:text-white border border-primary-400 rounded px-2 md:px-3 py-1"
          >
            Admin
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — desktop: doim ko'rinadi, mobile: overlay sifatida */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            fixed md:static inset-y-0 left-0 z-40
            w-72 md:w-80 bg-white border-r p-4 overflow-y-auto
            transition-transform duration-200 ease-in-out
            top-[52px] md:top-0
          `}
        >
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
              {/* Kategoriya (root) */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Kategoriya
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={selectedRootId ?? ''}
                  onChange={(e) => {
                    setSelectedRootId(Number(e.target.value));
                    setSelectedCategoryId(null);
                  }}
                >
                  {rootCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subkategoriya */}
              {subcategoriesForRoot.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                    Subkategoriya
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={selectedCategoryId ?? ''}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                  >
                    {subcategoriesForRoot.map((c) => {
                      const hasFile = files.some((f) => f.categoryId === c.id);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name}{!hasFile ? ' — (fayl yo\'q)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {currentCategory?.description && (
                    <p className="text-xs text-gray-500 mt-2">{currentCategory.description}</p>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">
                  Bu kategoriyada subkategoriya yo'q
                </div>
              )}

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
              <>
                <CogLayer
                  key={cogUrl}
                  url={cogUrl}
                  colorSchemeJson={currentCategory.colorScheme}
                  opacity={opacity}
                  minValue={currentCategory.minValue ?? null}
                  maxValue={currentCategory.maxValue ?? null}
                  onLoading={(v) => {
                    cogLoadingRef.current = v;
                    setCogLoading(v);
                  }}
                  onError={(msg) => setCogError(msg || null)}
                />
                <PixelValuePopup
                  cogUrl={cogUrl}
                  pickedLatLng={
                    pickedPixel
                      ? { lat: pickedPixel.lat, lng: pickedPixel.lng }
                      : null
                  }
                  onPick={setPickedPixel}
                />
              </>
            )}
          </MapContainer>

          {pickedPixel && currentCategory && (
            <PixelInfoCard
              info={pickedPixel}
              categoryName={currentCategory.name}
              categoryDescription={currentCategory.description}
              unit={currentCategory.unit}
              year={selectedYear}
              onClose={() => setPickedPixel(null)}
            />
          )}

          {/* COG loading indicator */}
          {cogLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              Xarita yuklanmoqda...
            </div>
          )}

          {/* COG error */}
          {cogError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {cogError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
