import React, { useEffect, useRef, useState } from 'react';

interface PdfPreviewProps {
  fileData: ArrayBuffer;
  pageNumber?: number;
  scale?: number;
  onLoadSuccess?: (numPages: number) => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ 
  fileData, 
  pageNumber = 1, 
  scale = 1.0,
  onLoadSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: any = null;

    const renderPdf = async () => {
      if (!fileData) return;
      
      // Wait for next tick to ensure canvas is mounted
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (cancelled || !canvasRef.current) return;

      try {
        // Dynamic import to avoid SSR/Module init issues
        const pdfjsModule = await import('pdfjs-dist');
        
        // Robustly handle ESM default export vs named exports
        const pdfjs = (pdfjsModule as any).default || pdfjsModule;
        const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions || (pdfjsModule as any).GlobalWorkerOptions;
        const getDocument = pdfjs.getDocument || (pdfjsModule as any).getDocument;

        // Force set the worker source to the classic script version from cdnjs
        // This fixes "SyntaxError: import declarations..." which happens with .mjs workers in some envs
        if (GlobalWorkerOptions) {
            GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        if (!getDocument) {
            throw new Error('PDF.js getDocument function not found in import');
        }

        // Copy the ArrayBuffer to prevent detached buffer errors
        const dataCopy = fileData.slice(0);
        const loadingTask = getDocument({ data: dataCopy });
        const pdf = await loadingTask.promise;
        
        if (cancelled) return;

        // Call onLoadSuccess with total pages
        if (onLoadSuccess) {
          onLoadSuccess(pdf.numPages);
        }

        if (pageNumber > pdf.numPages) {
          setError(`Page ${pageNumber} out of bounds (max ${pdf.numPages})`);
          return;
        }

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        renderTask = page.render(renderContext as any);
        await renderTask.promise;
        
        if (!cancelled) {
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error rendering PDF:', err);
          setError(`Failed to render PDF: ${err.message || err}`);
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      if (renderTask && renderTask.cancel) {
        renderTask.cancel();
      }
    };
  }, [fileData, pageNumber, scale, onLoadSuccess]);

  if (error) {
    return <div className="text-red-500 text-xs p-2">{error}</div>;
  }

  return <canvas ref={canvasRef} className="max-w-full h-auto" style={{ display: 'block' }} />;
};