// Animatsiya video yaratish — MediaRecorder API orqali
// Brauzer ichida, qo'shimcha kutubxonasiz.

export interface RecordOptions {
  mapEl: HTMLElement;
  years: number[];
  onYearChange: (year: number) => Promise<void> | void;
  holdMs?: number;        // Har bir kadr ushlash vaqti
  fps?: number;           // Kadr tezligi
  onProgress?: (done: number, total: number) => void;
}

function pickMimeType(): { mimeType: string; ext: string } {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      return { mimeType: m, ext: 'webm' };
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
  const snap = await html2canvas(mapEl, {
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  });
  if (canvas.width !== snap.width || canvas.height !== snap.height) {
    canvas.width = snap.width;
    canvas.height = snap.height;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(snap, 0, 0);
}

/**
 * Har bir yil uchun xarita kadrini olib, ularni WebM videoga birlashtiradi.
 * Natijada Blob qaytadi — brauzerda darhol yuklab olish mumkin.
 */
export async function recordAnimation({
  mapEl,
  years,
  onYearChange,
  holdMs = 1500,
  fps = 30,
  onProgress,
}: RecordOptions): Promise<{ blob: Blob; ext: string }> {
  if (years.length === 0) throw new Error('Yillar ro\'yxati bo\'sh');

  // Birinchi yil bilan dimensiya aniqlash
  await onYearChange(years[0]);
  await waitMs(holdMs);

  const canvas = document.createElement('canvas');
  canvas.width = mapEl.clientWidth;
  canvas.height = mapEl.clientHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D kontekst olib bo\'lmadi');

  await captureFrame(mapEl, canvas, ctx);

  const { mimeType, ext } = pickMimeType();
  const stream = canvas.captureStream(fps);
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
    await waitMs(holdMs * 0.5); // Render kutish
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
