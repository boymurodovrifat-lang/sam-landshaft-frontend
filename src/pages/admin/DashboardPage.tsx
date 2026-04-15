import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Files, Upload, HardDrive } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { filesApi } from '../../api/files';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    categories: 0,
    files: 0,
    totalSize: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cats, files] = await Promise.all([
          categoriesApi.getAll(),
          filesApi.getAll(),
        ]);
        setStats({
          categories: cats.length,
          files: files.length,
          totalSize: files.reduce((sum, f) => sum + Number(f.fileSize), 0),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    return `${(b / 1024 ** 3).toFixed(2)} GB`;
  };

  const cards = [
    {
      icon: FolderKanban,
      label: 'Kategoriyalar',
      value: stats.categories,
      to: '/admin/categories',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Files,
      label: 'Fayllar',
      value: stats.files,
      to: '/admin/files',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: HardDrive,
      label: 'Umumiy hajm',
      value: formatBytes(stats.totalSize),
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-8">Sam-Landshaft admin panelga xush kelibsiz</p>

      {loading ? (
        <div className="text-gray-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map((c) => {
            const Inner = (
              <div className="bg-white rounded-xl border p-6 hover:shadow-md transition">
                <div className={`inline-flex p-3 rounded-lg ${c.color}`}>
                  <c.icon size={20} />
                </div>
                <div className="mt-4 text-3xl font-bold text-gray-900">{c.value}</div>
                <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              </div>
            );
            return c.to ? (
              <Link key={c.label} to={c.to}>
                {Inner}
              </Link>
            ) : (
              <div key={c.label}>{Inner}</div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Tezkor amallar</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/upload"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            <Upload size={16} /> Yangi GeoTIFF yuklash
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-2 border hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm"
          >
            <FolderKanban size={16} /> Kategoriya qo'shish
          </Link>
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 border hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 text-sm"
          >
            Public xaritani ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
