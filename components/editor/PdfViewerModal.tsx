import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

const PdfPreview = lazy(() => import('./PdfPreview').then(mod => ({ default: mod.PdfPreview })));

interface FileViewerModalProps {
  fileId: string;
  open: boolean;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ fileId, open, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [totalPages, setTotalPages] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Use callback ref to ensure we attach listener when element is mounted
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    setContentElement(node);
  }, []);

  const file = useFlowStore((state) => state.files[fileId]);
  
  // Reset pan and scale when opening a new file
  useEffect(() => {
      setPanOffset({ x: 0, y: 0 });
      setScale(1.0);
      setCurrentPage(1);
  }, [fileId, open]);

  if (!file) return null;

  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.previewUrl || file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Handle mouse wheel zoom with native event listener
  useEffect(() => {
    if (!contentElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY) * 0.25;
        setScale(prev => Math.min(Math.max(prev + delta, 0.25), 4));
      }
    };

    contentElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      contentElement.removeEventListener('wheel', handleWheel);
    };
  }, [contentElement]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { 
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => setIsPanning(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <div className="flex items-center justify-between p-4 border-b bg-background z-10">
            <DialogTitle className="truncate pr-4">{file.name}</DialogTitle>
             <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                     <X className="w-4 h-4" />
                 </Button>
             </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-center gap-4 py-2 border-b bg-muted/40 text-sm">
          {isPdf && (
            <>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="w-24 text-center tabular-nums">
                    {currentPage} / {totalPages}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-4 w-px bg-border mx-2" />
            </>
          )}
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} disabled={scale <= 0.25}>
                <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="w-16 text-center tabular-nums">
                {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} disabled={scale >= 4}>
                <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-hidden bg-muted/20 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
            {/* Background Pattern for transparency */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }} 
            />

            <div
                style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
                minWidth: '100%',
                padding: '2rem',
                }}
            >
                <div 
                    className="shadow-xl bg-white transition-transform duration-100 ease-out"
                    style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
                >
                {isPdf ? (
                    <Suspense fallback={<div className="p-10 text-muted-foreground">Loading PDF...</div>}>
                        <PdfPreview 
                            fileData={file.data} 
                            pageNumber={currentPage} 
                            scale={1.5} // Render at high quality base, scale via transform
                            onLoadSuccess={(numPages) => setTotalPages(numPages)}
                        />
                    </Suspense>
                ) : isImage && file.previewUrl ? (
                    <img 
                        src={file.previewUrl} 
                        alt={file.name}
                        draggable={false}
                        className="max-w-none block"
                    />
                ) : (
                    <div className="p-10 text-muted-foreground">Preview not available</div>
                )}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const PdfViewerModal = FileViewerModal;