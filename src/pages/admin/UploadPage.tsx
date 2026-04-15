import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileImage } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { filesApi } from '../../api/files';
import type { Category } from '../../types';

export default function UploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const cats = await categoriesApi.getAll();
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    })();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.tif') && !name.endsWith('.tiff')) {
      setError('Faqat .tif yoki .tiff fayllarni yuklash mumkin');
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !categoryId) return;
    setError(null);
    setSuccess(null);
    setUploading(true);
    setProgress(0);
    try {
      await filesApi.upload(file, Number(categoryId), year, setProgress);
      setSuccess('Fayl muvaffaqiyatli yuklandi va COG formatiga o\'girildi.');
      setFile(null);
      setTimeout(() => navigate('/admin/files'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">GeoTIFF yuklash</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fayl serverga yuklangandan so'ng avtomatik tarzda COG formatiga o'giriladi
      </p>

      {categories.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Avval kamida bitta kategoriya yarating.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kategoriya *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Yil *</label>
              <select
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GeoTIFF fayl *</label>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".tif,.tiff,image/tiff"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50/50 transition">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileImage size={32} className="text-primary-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">{fileSizeMB} MB</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadIcon size={32} className="mx-auto text-gray-400 mb-2" />
                    <div className="text-sm text-gray-600">
                      Fayl tanlash uchun bosing
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      .tif yoki .tiff (2 GB gacha)
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Yuklanmoqda...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <p className="text-xs text-gray-500 mt-2">
                  Server COG formatiga o'girmoqda, bu 1-3 daqiqa davom etishi mumkin...
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-60"
            >
              {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
