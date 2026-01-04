export async function renderPageToImage(pdfData: ArrayBuffer, pageNumber: number = 1, scale: number = 2): Promise<{ blob: Blob, width: number, height: number }> {
  if (typeof window === 'undefined') {
    throw new Error('renderPageToImage must be called in the browser');
  }

  // Dynamically import pdfjs-dist
  const pdfjsModule = await import('pdfjs-dist');
  const pdfjs = (pdfjsModule as any).default || pdfjsModule;
  const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions || (pdfjsModule as any).GlobalWorkerOptions;
  const getDocument = pdfjs.getDocument || (pdfjsModule as any).getDocument;

  // Force set the worker source to the classic script version
  if (GlobalWorkerOptions) {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  if (!getDocument) {
    throw new Error('PDF.js getDocument not found');
  }

  const loadingTask = getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Page ${pageNumber} out of bounds`);
  }

  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;
  
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({ blob, width: viewport.width, height: viewport.height });
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}