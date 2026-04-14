import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { categoriesApi } from '../api/categories';
import { filesApi } from '../api/files';
import type { Category, GeotiffFile } from '../types';

// Samarqand viloyati markazi
const SAMARKAND_CENTER: [number, number] = [39.6547, 66.9597];
const SAMARKAND_ZOOM = 9;

export default function MapPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [files, setFiles] = useState<GeotiffFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, allFiles] = await Promise.all([
          categoriesApi.getAll(),
          filesApi.getAll(),
        ]);
        setCategories(cats);
        setFiles(allFiles);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
      } catch (err) {
        console.error('Ma\'lumot yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableYears = [...new Set(files.map((f) => f.year))].sort();
  const currentFile = files.find(
    (f) => f.categoryId === selectedCategory && f.year === selectedYear
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary-900 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SamGeo.uz</h1>
            <p className="text-sm text-primary-100">Samarqand viloyati landshaft geoportali</p>
          </div>
          <a
            href="/admin/login"
            className="text-sm text-primary-100 hover:text-white"
          >
            Admin
          </a>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r p-4 overflow-y-auto">
          {loading ? (
            <p className="text-gray-500">Yuklanmoqda...</p>
          ) : (
            <div className="space-y-6">
              {/* Category selector */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-800">Kategoriya</h3>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedCategory ?? ''}
                  onChange={(e) => setSelectedCategory(Number(e.target.value))}
                >
                  <option value="">Tanlang...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year selector */}
              <div>
                <h3 className="font-semibold mb-2 text-gray-800">Yil</h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        year === selectedYear
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* File info */}
              {currentFile && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium">{currentFile.filename}</div>
                  <div className="text-gray-500 mt-1">
                    Hajm: {(currentFile.fileSize / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  <a
                    href={filesApi.getDownloadUrl(currentFile.id, 'tiff')}
                    className="inline-block mt-2 text-primary-600 hover:underline"
                  >
                    GeoTIFF yuklab olish
                  </a>
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
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            {/* TODO: Add COG layer here when currentFile is set */}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
