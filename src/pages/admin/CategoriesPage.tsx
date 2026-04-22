import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, FolderOpen, Folder, FileText, Sparkles } from 'lucide-react';
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

type DialogMode =
  | { kind: 'create'; parentId: number | null }
  | { kind: 'edit'; category: Category };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogMode | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const all = await categoriesApi.getAll();
      setItems(all);
      setExpanded(new Set(all.filter((c) => !c.parentId).map((c) => c.id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { roots, childrenByParent } = useMemo(() => {
    const roots = items
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    const childrenByParent = new Map<number, Category[]>();
    for (const c of items) {
      if (c.parentId) {
        const arr = childrenByParent.get(c.parentId) ?? [];
        arr.push(c);
        childrenByParent.set(c.parentId, arr);
      }
    }
    for (const arr of childrenByParent.values()) {
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    }
    return { roots, childrenByParent };
  }, [items]);

  const handleApplyPreset = async (c: Category) => {
    const ok = confirm(
      `"${c.name}" uchun standart palitra qo'llansinmi?\n` +
      `Birlik, Min/Max va rang sxemasi slug (${c.slug}) bo'yicha tiklanadi.`,
    );
    if (!ok) return;
    try {
      await categoriesApi.applyPreset(c.id);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Xatolik';
      alert(`Preset qo'llanmadi: ${msg}`);
    }
  };

  const handleDelete = async (c: Category) => {
    const hasChildren = childrenByParent.get(c.id)?.length ?? 0;
    const msg = hasChildren
      ? `"${c.name}" da ${hasChildren} ta subkategoriya bor. O'chirib bo'lmaydi. Avval subkategoriyalarni o'chiring.`
      : `"${c.name}" o'chirilsinmi? Bog'liq fayllar ham o'chadi.`;
    if (hasChildren) {
      alert(msg);
      return;
    }
    if (!confirm(msg)) return;
    await categoriesApi.delete(c.id);
    await load();
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriyalar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ikki darajali: kategoriya → subkategoriya
          </p>
        </div>
        <button
          onClick={() => setDialog({ kind: 'create', parentId: null })}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} /> Kategoriya
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Yuklanmoqda...</div>
        ) : roots.length === 0 ? (
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
              {roots.map((root) => {
                const kids = childrenByParent.get(root.id) ?? [];
                const isOpen = expanded.has(root.id);
                return (
                  <RootAndChildren
                    key={root.id}
                    root={root}
                    kids={kids}
                    isOpen={isOpen}
                    onToggle={() => toggleExpand(root.id)}
                    onEdit={(c) => setDialog({ kind: 'edit', category: c })}
                    onDelete={handleDelete}
                    onAddSub={() => setDialog({ kind: 'create', parentId: root.id })}
                    onApplyPreset={handleApplyPreset}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {dialog && (
        <CategoryDialog
          mode={dialog}
          roots={roots}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

interface RowProps {
  root: Category;
  kids: Category[];
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: () => void;
  onApplyPreset: (c: Category) => void;
}

function RootAndChildren({ root, kids, isOpen, onToggle, onEdit, onDelete, onAddSub, onApplyPreset }: RowProps) {
  return (
    <>
      <tr className="bg-gray-50/60 hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-700 flex items-center"
              disabled={kids.length === 0}
            >
              {kids.length > 0 ? (
                isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              ) : (
                <span className="w-4" />
              )}
            </button>
            {isOpen ? <FolderOpen size={16} className="text-amber-600" /> : <Folder size={16} className="text-amber-600" />}
            <div>
              <div className="font-semibold text-gray-900">{root.name}</div>
              {root.description && (
                <div className="text-xs text-gray-500 mt-0.5">{root.description}</div>
              )}
            </div>
            <span className="ml-2 text-xs text-gray-400">({kids.length})</span>
          </div>
        </td>
        <td className="px-4 py-3 text-gray-400 text-xs">—</td>
        <td className="px-4 py-3 text-gray-400 text-xs">—</td>
        <td className="px-4 py-3 text-gray-400 text-xs">—</td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <button
            onClick={onAddSub}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 rounded mr-1"
            title="Subkategoriya qo'shish"
          >
            <Plus size={12} /> Sub
          </button>
          <button
            onClick={() => onEdit(root)}
            className="inline-flex p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
            title="Tahrirlash"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(root)}
            className="inline-flex p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
            title="O'chirish"
          >
            <Trash2 size={14} />
          </button>
        </td>
      </tr>
      {isOpen &&
        kids.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2 pl-8">
                <FileText size={14} className="text-gray-400" />
                <div>
                  <div className="text-sm text-gray-800">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                  )}
                </div>
              </div>
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
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <button
                onClick={() => onApplyPreset(c)}
                className="inline-flex p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                title="Slug bo'yicha standart palitrani qo'llash"
              >
                <Sparkles size={14} />
              </button>
              <button
                onClick={() => onEdit(c)}
                className="inline-flex p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded ml-1"
                title="Tahrirlash"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(c)}
                className="inline-flex p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                title="O'chirish"
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
    </>
  );
}

interface DialogProps {
  mode: DialogMode;
  roots: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function CategoryDialog({ mode, roots, onClose, onSaved }: DialogProps) {
  const initial = mode.kind === 'edit' ? mode.category : null;
  const defaultParentId = mode.kind === 'create' ? mode.parentId : (initial?.parentId ?? null);

  const [form, setForm] = useState<CategoryPayload>({
    parentId: defaultParentId ?? null,
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

  const isSubcategory = form.parentId != null;
  const editingRoot = initial != null && initial.parentId == null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isSubcategory && form.colorScheme) {
        try {
          JSON.parse(form.colorScheme);
        } catch {
          throw new Error("Rang sxemasi JSON formatida bo'lishi kerak");
        }
      }

      const payload: CategoryPayload = {
        ...form,
        parentId: form.parentId ?? null,
        unit: isSubcategory ? form.unit : undefined,
        colorScheme: isSubcategory ? form.colorScheme : undefined,
        minValue: !isSubcategory || form.minValue === undefined || Number.isNaN(form.minValue)
          ? undefined
          : Number(form.minValue),
        maxValue: !isSubcategory || form.maxValue === undefined || Number.isNaN(form.maxValue)
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

  const title = initial
    ? editingRoot ? "Kategoriyani tahrirlash" : 'Subkategoriyani tahrirlash'
    : isSubcategory ? 'Yangi subkategoriya' : 'Yangi kategoriya';

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
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tur tanlash — faqat yangi yaratishda */}
          {!initial && (
            <div>
              <label className="block text-sm font-medium mb-1">Tur</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, parentId: null })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                    form.parentId == null
                      ? 'bg-primary-50 border-primary-400 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Kategoriya (root)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, parentId: form.parentId ?? roots[0]?.id ?? null })
                  }
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                    form.parentId != null
                      ? 'bg-primary-50 border-primary-400 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={roots.length === 0}
                >
                  Subkategoriya
                </button>
              </div>
              {roots.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Avval kategoriya yarating — keyin subkategoriya qo'shish mumkin
                </p>
              )}
            </div>
          )}

          {/* Parent tanlash */}
          {isSubcategory && (
            <div>
              <label className="block text-sm font-medium mb-1">Kategoriya (parent) *</label>
              <select
                required
                value={form.parentId ?? ''}
                onChange={(e) => setForm({ ...form, parentId: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {roots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              placeholder={isSubcategory ? 'Masalan: NDVI' : 'Masalan: Vegetatsiya indikatorlari'}
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
              placeholder="ndvi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Subkategoriya maydonlari */}
          {isSubcategory && (
            <>
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
                <label className="block text-sm font-medium mb-1">Rang palitrasi</label>
                <ColorPalettePicker
                  value={selectedPalette}
                  min={form.minValue ?? 0}
                  max={form.maxValue ?? 1}
                  onChange={(scheme, paletteName) => {
                    setSelectedPalette(paletteName);
                    setForm({ ...form, colorScheme: JSON.stringify(scheme, null, 2) });
                  }}
                />
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
                <button
                  type="button"
                  onClick={() => setShowJsonEditor(!showJsonEditor)}
                  className="text-xs text-primary-600 hover:underline mt-2"
                >
                  {showJsonEditor ? 'JSON yashirish' : "JSON ko'rish / tahrirlash"}
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
            </>
          )}

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
