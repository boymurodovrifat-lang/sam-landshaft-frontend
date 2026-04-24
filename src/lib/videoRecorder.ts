// Animatsiya video yaratish — MediaRecorder API orqali
// Brauzer ichida, qo'shimcha kutubxonasiz.

export interface RecordOptions {
  mapEl: HTMLElement;
  years: number[];
  onYearChange: (year: number) => Promise<void> | void;
  /**
   * Optional: called after each year change. Should resolve once the
   * new raster has finished loading (no more loading spinners).
   * If omitted, falls back to a fixed wait.
   */
  waitForFrame?: () => Promise<void>;
  holdMs?: number;        // Har bir kadrni ushlab turish vaqti
  fps?: number;           // Kadr tezligi
  onProgress?: (done: number, total: number) => void;
}

function pickMimeType(): { mimeType: string; ext: string } {
  // Prefer MP4 (wider player compatibility — iOS Safari, macOS Preview,
  // Telegram, WhatsApp inline playback). Fall back to WebM if the browser
  // cannot encode MP4 via MediaRecorder (e.g. Firefox).
  const candidates: { m: string; ext: string }[] = [
    { m: 'video/mp4;codecs=avc1.42E01F', ext: 'mp4' },  // H.264 baseline
    { m: 'video/mp4;codecs=avc1.4D401F', ext: 'mp4' },  // H.264 main
    { m: 'video/mp4;codecs=h264', ext: 'mp4' },
    { m: 'video/mp4', ext: 'mp4' },
    { m: 'video/webm;codecs=vp9', ext: 'webm' },
    { m: 'video/webm;codecs=vp8', ext: 'webm' },
    { m: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.m)) {
      return { mimeType: c.m, ext: c.ext };
    }
  }
  return { mimeType: 'video/webm', ext: 'webm' };
}

function waitMs(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function captureFrame(
  mapEl: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) {
  const html2canvasMod = await import('html2canvas');
  const html2canvas = html2canvasMod.default;
  // allowTaint: false — we need an untainted canvas so captureStream works.
  // Tiles must be served with CORS (TileLayer uses crossOrigin="anonymous").
  const snap = await html2canvas(mapEl, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });
  if (canvas.width !== snap.width || canvas.height !== snap.height) {
    canvas.width = snap.width;
    canvas.height = snap.height;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(snap, 0, 0);
}

/**
 * Har bir yil uchun xarita kadrini olib, ularni videoga birlashtiradi.
 * Natijada Blob qaytadi — brauzerda darhol yuklab olish mumkin.
 * Format: MP4 (H.264) qo'llab-quvvatlansa, aks holda WebM.
 */
export async function recordAnimation({
  mapEl,
  years,
  onYearChange,
  waitForFrame,
  holdMs = 1500,
  fps = 30,
  onProgress,
}: RecordOptions): Promise<{ blob: Blob; ext: string }> {
  if (years.length === 0) throw new Error('Yillar ro\'yxati bo\'sh');

  // Birinchi yil — dimensiya va birinchi kadr
  await onYearChange(years[0]);
  if (waitForFrame) await waitForFrame();
  else await waitMs(holdMs);

  const canvas = document.createElement('canvas');
  canvas.width = mapEl.clientWidth;
  canvas.height = mapEl.clientHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D kontekst olib bo\'lmadi');

  await captureFrame(mapEl, canvas, ctx);

  const { mimeType, ext } = pickMimeType();
  let stream: MediaStream;
  try {
    stream = canvas.captureStream(fps);
  } catch (e) {
    const err = e as Error;
    if (err?.name === 'SecurityError') {
      throw new Error(
        'Xarita plitkalari CORS bilan yuklanmagan. Sahifani yangilab, qaytadan urinib ko\'ring.',
      );
    }
    throw err;
  }
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start(200);

  // Birinchi yilni ushlab turish
  const framesPerHold = Math.max(1, Math.round((holdMs / 1000) * fps));
  for (let i = 0; i < framesPerHold; i++) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  // Qolgan yillar
  for (let i = 1; i < years.length; i++) {
    onProgress?.(i, years.length);
    await onYearChange(years[i]);
    if (waitForFrame) await waitForFrame();
    else await waitMs(holdMs * 0.5);
    await captureFrame(mapEl, canvas, ctx);
    for (let j = 0; j < framesPerHold; j++) {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
  }
  onProgress?.(years.length, years.length);

  recorder.stop();
  await stopped;

  const blob = new Blob(chunks, { type: mimeType });
  return { blob, ext };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
