declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

/**
 * Ensures PDF.js is loaded from the window object or dynamically injects it.
 */
async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if (window.pdfjsLib) {
    if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return window.pdfjsLib;
  }

  // Fallback: wait for script or load dynamically
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="pdf.min.js"]');
    if (existing) {
      existing.addEventListener('load', () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Loads a PDF document using PDF.js from a File, ArrayBuffer, or Blob.
 */
export async function loadPdfDocument(source: File | ArrayBuffer | Uint8Array | Blob): Promise<any> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js library is not available');

  let data: ArrayBuffer;
  if (source instanceof File || source instanceof Blob) {
    data = await source.arrayBuffer();
  } else if (source instanceof Uint8Array) {
    data = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer;
  } else {
    data = source;
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true,
  });

  return loadingTask.promise;
}

/**
 * Renders a specific page (0-based index) to a high-quality image data URL.
 */
export async function renderPdfPageToDataUrl(
  pdfDoc: any,
  pageIndex: number,
  scale = 0.6
): Promise<string> {
  const pageNumber = pageIndex + 1;
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create canvas 2d context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Background white fill
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Renders a sheet preview page (1-based sheet number) to image data URL.
 */
export async function renderPrintSheetPreview(
  pdfDoc: any,
  sheetPageNum: number,
  scale = 0.5
): Promise<string> {
  const page = await pdfDoc.getPage(sheetPageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create canvas 2d context');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Background white fill
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}
