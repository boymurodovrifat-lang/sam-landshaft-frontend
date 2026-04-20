import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { categoriesApi } from '../../api/categories';
import type { Category, CategoryPayload } from '../../types';
import ColorPalettePicker from '../../components/ColorPalettePicker';

const DEFAULT_COLOR_SCHEME = JSON.stringify(
  [
    { value: 0, color: '#2ecc71' },
    { value: 25, color: '#f1c40f' },
    { value: 50, color: '#e67e22' },
    { value: 75, color: '#e74c3c' },
    { value: 100, color: '#8e44ad' },
  ],
  null,
  2,
);

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await categoriesApi.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (c: Category) => {
    if (!confirm(`"${c.name}" o'chirilsinmi? Bu kategoriyaga tegishli barcha fayllar ham o'chadi.`)) return;
    await categoriesApi.delete(c.id);
    await load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xaritalarni turli kriteriyalar bo'yicha saralash uchun kategoriyalar
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} /> Yangi
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Hali kategoriya qo'shilmagan
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Nomi</th>
                <th className="text-left px-4 py-3">Rang</th>
                <th className="text-left px-4 py-3">Birlik</th>
                <th className="text-left px-4 py-3">Min - Max</th>
                <th className="text-right px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    {c.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.colorScheme ? (
                      <div
                        className="w-16 h-3 rounded"
                        style={{
                          background: (() => {
                            try {
                              const stops = JSON.parse(c.colorScheme) as { color: string }[];
                              return `linear-gradient(to right, ${stops.map((s) => s.color).join(', ')})`;
                            } catch { return '#ccc'; }
                          })(),
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.unit || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.minValue != null && c.maxValue != null
                      ? `${c.minValue} — ${c.maxValue}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(c)}
                      className="inline-flex p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Tahrirlash"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
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

      {(creating || editing) && (
        <CategoryDialog
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

interface DialogProps {
  initial: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

function CategoryDialog({ initial, onClose, onSaved }: DialogProps) {
  const [form, setForm] = useState<CategoryPayload>({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    unit: initial?.unit || '',
    colorScheme: initial?.colorScheme || DEFAULT_COLOR_SCHEME,
    minValue: initial?.minValue ?? undefined,
    maxValue: initial?.maxValue ?? undefined,
  });
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Validate colorScheme JSON
      if (form.colorScheme) {
        try {
          JSON.parse(form.colorScheme);
        } catch {
          throw new Error('Rang sxemasi JSON formatida bo\'lishi kerak');
        }
      }

      const payload: CategoryPayload = {
        ...form,
        minValue: form.minValue === undefined || Number.isNaN(form.minValue)
          ? undefined
          : Number(form.minValue),
        maxValue: form.maxValue === undefined || Number.isNaN(form.maxValue)
          ? undefined
          : Number(form.maxValue),
      };

      if (initial) {
        await categoriesApi.update(initial.id, payload);
      } else {
        await categoriesApi.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">
            {initial ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nomi *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, slug: form.slug || slugify(name) });
              }}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Masalan: Tuproq sho'rlanishi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
              placeholder="soil-salinity"
            />
            <p className="text-xs text-gray-500 mt-1">Fayl nomlarida ishlatiladi. Lotin, raqam, "-" dan tashkil topadi</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Qisqacha tushuntirish..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Birlik</label>
              <input
                type="text"
                value={form.unit || ''}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="%, dS/m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min</label>
              <input
                type="number"
                step="any"
                value={form.minValue ?? ''}
                onChange={(e) =>
                  setForm({ ...form, minValue: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max</label>
              <input
                type="number"
                step="any"
                value={form.maxValue ?? ''}
                onChange={(e) =>
                  setForm({ ...form, maxValue: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Rang palitrasi
            </label>
            <ColorPalettePicker
              value={selectedPalette}
              min={form.minValue ?? 0}
              max={form.maxValue ?? 1}
              onChange={(scheme, paletteName) => {
                setSelectedPalette(paletteName);
                setForm({ ...form, colorScheme: JSON.stringify(scheme, null, 2) });
              }}
            />

            {/* Preview */}
            {form.colorScheme && (
              <div className="mt-2">
                <div
                  className="h-4 rounded w-full"
                  style={{
                    background: (() => {
                      try {
                        const stops = JSON.parse(form.colorScheme) as { color: string }[];
                        return `linear-gradient(to right, ${stops.map((s) => s.color).join(', ')})`;
                      } catch {
                        return '#ccc';
                      }
                    })(),
                  }}
                />
              </div>
            )}

            {/* JSON editor — ilg'or foydalanuvchilar uchun */}
            <button
              type="button"
              onClick={() => setShowJsonEditor(!showJsonEditor)}
              className="text-xs text-primary-600 hover:underline mt-2"
            >
              {showJsonEditor ? 'JSON yashirish' : 'JSON ko\'rish / tahrirlash'}
            </button>
            {showJsonEditor && (
              <textarea
                rows={6}
                value={form.colorScheme || ''}
                onChange={(e) => setForm({ ...form, colorScheme: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 font-mono text-xs mt-1"
              />
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60"
            >
              {saving ? 'Saqlanmoqda...' : initial ? 'Yangilash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
