import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Trash2, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import { filesApi } from '../../api/files';
import type { Category, GeotiffFile } from '../../types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function FilesPage() {
  const [files, setFiles] = useState<GeotiffFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Filter o'zgarsa — 1-sahifaga qaytish
  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterYear, pageSize]);

  const filtered = useMemo(
    () =>
      files.filter((f) => {
        if (filterCategory && f.categoryId !== Number(filterCategory)) return false;
        if (filterYear && f.year !== Number(filterYear)) return false;
        return true;
      }),
    [files, filterCategory, filterYear],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);

  const years = useMemo(
    () => [...new Set(files.map((f) => f.year))].sort((a, b) => b - a),
    [files],
  );

  // Kategoriya dropdown — subkategoriyalarni parent bilan guruhlash
  const categoryOptions = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    const subs = categories.filter((c) => c.parentId != null);
    return roots.map((r) => ({
      root: r,
      subs: subs.filter((s) => s.parentId === r.id),
    }));
  }, [categories]);

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
          {categoryOptions.map(({ root, subs }) => (
            <optgroup key={root.id} label={root.name}>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
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
        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          <span>{filtered.length} ta fayl</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm"
            title="Sahifa hajmi"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / sahifa
              </option>
            ))}
          </select>
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
          <>
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
                {paged.map((f) => (
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

            {totalPages > 1 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                startIdx={startIdx}
                pageSize={pageSize}
                total={filtered.length}
                onChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  startIdx: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}

function Pagination({ page, totalPages, startIdx, pageSize, total, onChange }: PaginationProps) {
  const endIdx = Math.min(startIdx + pageSize, total);
  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50 text-sm">
      <div className="text-gray-500">
        {startIdx + 1}–{endIdx} / {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
          title="Oldingi"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] px-2 py-1 rounded text-sm ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
          title="Keyingi"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | '...')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) result.push('...');
  for (let p = left; p <= right; p++) result.push(p);
  if (right < total - 1) result.push('...');

  result.push(total);
  return result;
}
