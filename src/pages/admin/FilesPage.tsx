import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, Upload } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { filesApi } from '../../api/files';
import type { Category, GeotiffFile } from '../../types';

export default function FilesPage() {
  const [files, setFiles] = useState<GeotiffFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([filesApi.getAll(), categoriesApi.getAll()]);
      setFiles(f);
      setCategories(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      files.filter((f) => {
        if (filterCategory && f.categoryId !== Number(filterCategory)) return false;
        if (filterYear && f.year !== Number(filterYear)) return false;
        return true;
      }),
    [files, filterCategory, filterYear],
  );

  const years = useMemo(
    () => [...new Set(files.map((f) => f.year))].sort((a, b) => b - a),
    [files],
  );

  const handleDelete = async (f: GeotiffFile) => {
    if (!confirm(`"${f.filename}" (${f.year}) o'chirilsinmi?`)) return;
    await filesApi.delete(f.id);
    await load();
  };

  const formatSize = (b: number | bigint) => {
    const bn = Number(b);
    if (bn < 1024 ** 2) return `${(bn / 1024).toFixed(1)} KB`;
    if (bn < 1024 ** 3) return `${(bn / 1024 ** 2).toFixed(1)} MB`;
    return `${(bn / 1024 ** 3).toFixed(2)} GB`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GeoTIFF fayllar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Yuklangan barcha xarita fayllar
          </p>
        </div>
        <Link
          to="/admin/upload"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm"
        >
          <Upload size={16} /> Yangi yuklash
        </Link>
      </div>

      <div className="bg-white rounded-xl border mb-4 p-4 flex flex-wrap gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Barcha yillar</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500 self-center">
          {filtered.length} ta fayl
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Fayllar topilmadi
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Fayl</th>
                <th className="text-left px-4 py-3">Kategoriya</th>
                <th className="text-left px-4 py-3">Yil</th>
                <th className="text-left px-4 py-3">Hajm</th>
                <th className="text-left px-4 py-3">O'lcham</th>
                <th className="text-right px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {f.filename}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      ID: {f.id}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {f.category?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{f.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatSize(f.fileSize)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {f.width && f.height ? `${f.width} × ${f.height}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={filesApi.getDownloadUrl(f.id, 'tiff')}
                      className="inline-flex p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Yuklab olish"
                    >
                      <Download size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(f)}
                      className="inline-flex p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
