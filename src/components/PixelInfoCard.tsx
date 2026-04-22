import { X, MapPin } from 'lucide-react';

export interface PixelInfo {
  lat: number;
  lng: number;
  value: number | null;
  loading?: boolean;
}

interface Props {
  info: PixelInfo;
  categoryName: string;
  categoryDescription?: string;
  unit?: string;
  year?: number | null;
  onClose: () => void;
}

export default function PixelInfoCard({
  info,
  categoryName,
  categoryDescription,
  unit,
  year,
  onClose,
}: Props) {
  const formatValue = (): string => {
    if (info.value == null || Number.isNaN(info.value)) return "Ma'lumot yo'q";
    const v = info.value;
    const suffix = unit ? ` ${unit}` : '';
    if (Number.isInteger(v)) return `${v}${suffix}`;
    return `${v.toFixed(4)}${suffix}`;
  };

  const hasValue = info.value != null && !Number.isNaN(info.value);

  return (
    <div className="absolute top-4 right-4 z-[1000] w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b bg-gradient-to-r from-primary-50 to-white">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-primary-700 font-semibold">
            Nuqta ma'lumoti
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">
            {categoryName}
            {year ? ` · ${year}` : ''}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition p-0.5 -mr-1"
          aria-label="Yopish"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <div className="text-[11px] uppercase text-gray-400 font-medium mb-1">
            Ko'rsatkich
          </div>
          {hasValue ? (
            <div className="text-2xl font-bold text-gray-900">{formatValue()}</div>
          ) : info.loading ? (
            <div className="flex items-center gap-3 py-1" aria-label="Yuklanmoqda">
              <span className="relative flex w-5 h-5 shrink-0" aria-hidden="true">
                <span className="absolute inset-0 rounded-full bg-primary-500 opacity-40 animate-ping" />
                <span className="absolute inset-[3px] rounded-full bg-primary-600 shadow-[0_0_0_2px_#fff]" />
              </span>
              <div className="flex-1 space-y-1.5">
                <div className="h-5 w-24 rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]" />
                <div className="h-2 w-36 rounded bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite_0.2s]" />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">Ma'lumot yo'q</div>
          )}
          {categoryDescription && hasValue && (
            <div className="text-[11px] text-gray-500 mt-1 leading-snug">
              {categoryDescription}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <div className="text-[10px] uppercase text-gray-400 font-medium flex items-center gap-1">
              <MapPin size={10} /> Kenglik
            </div>
            <div className="text-sm font-mono text-gray-800">
              {info.lat.toFixed(5)}°
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-gray-400 font-medium flex items-center gap-1">
              <MapPin size={10} /> Uzunlik
            </div>
            <div className="text-sm font-mono text-gray-800">
              {info.lng.toFixed(5)}°
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
