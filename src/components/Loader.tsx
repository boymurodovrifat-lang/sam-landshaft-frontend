interface LoaderProps {
  text?: string;
  fullscreen?: boolean;
}

/**
 * Pin-marker + radar-ping loader. Matches the pixel-info card style
 * so the whole app feels like one visual system.
 */
export default function Loader({ text = "Yuklanmoqda...", fullscreen = true }: LoaderProps) {
  const wrapper = fullscreen
    ? 'flex flex-col items-center justify-center h-screen gap-4'
    : 'flex flex-col items-center justify-center gap-3 py-8';

  return (
    <div className={wrapper}>
      <div className="relative w-16 h-16">
        <span className="absolute inset-0 rounded-full bg-primary-500/30 animate-ping" />
        <span className="absolute inset-3 rounded-full bg-primary-500/50 animate-ping [animation-delay:0.35s]" />
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width="28" height="36" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 34 12 34 C12 34 24 21 24 12 C24 5.4 18.6 0 12 0 Z"
              fill="#2563eb"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="4" fill="#fff" />
          </svg>
        </span>
      </div>
      <div className="text-sm text-gray-500">{text}</div>
    </div>
  );
}
