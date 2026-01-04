import React, { memo, useState, useEffect, Suspense, lazy } from 'react';
import { Position, useReactFlow, useStore, Node } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Eye, Layers, Maximize2 } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';

const PdfPreview = lazy(() => import('../PdfPreview').then(mod => ({ default: mod.PdfPreview })));
const FileViewerModal = lazy(() => import('../PdfViewerModal').then(mod => ({ default: mod.PdfViewerModal })));

export const PreviewNode = memo(({ id, data }: { id: string, data: any }) => {
  const { files } = useFlowStore();
  const [showViewer, setShowViewer] = useState(false);
  
  // Subscribe to store to be reactive to upstream changes
  const edges = useStore((s) => s.edges);
  const nodeInternals = useStore((s) => s.nodeInternals);
  const nodes = Array.from(nodeInternals.values()) as Node[];
  
  const edge = edges.find(e => e.target === id);
  const sourceNode = edge ? nodes.find(n => n.id === edge.source) : null;
  
  const fileId = sourceNode?.data?.fileId;
  const fileIds = sourceNode?.data?.fileIds;

  // Use first file for preview if multiple
  const primaryFileId = fileId || (fileIds && fileIds.length > 0 ? fileIds[0] : null);
  const file = primaryFileId ? files[primaryFileId] : null;

  const isMultiple = fileIds && fileIds.length > 1;
  const isPdf = file?.name.toLowerCase().endsWith('.pdf');
  const isImage = file?.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

  // Create preview URL for images if not present
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
      if (isImage && file?.data) {
          const url = URL.createObjectURL(new Blob([file.data]));
          setPreviewUrl(url);
          return () => URL.revokeObjectURL(url);
      } else if (file?.previewUrl) {
          setPreviewUrl(file.previewUrl);
      } else {
          setPreviewUrl(null);
      }
  }, [file, isImage]);

  return (
    <>
      <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="px-5 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          {file ? (
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground truncate max-w-[200px]" title={file.name}>{file.name}</div>
                    {isMultiple && (
                        <div className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                            <Layers className="w-3 h-3" />
                            <span>+{fileIds.length - 1}</span>
                        </div>
                    )}
                </div>

                {(isPdf || isImage) ? (
                  <div 
                    className="group relative h-[240px] w-full overflow-hidden flex justify-center items-center bg-muted/40 rounded-lg border border-border transition-all hover:border-blue-500/50"
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 z-10 pointer-events-none">
                       <div className="bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                           <Maximize2 className="w-4 h-4 text-foreground" />
                       </div>
                    </div>
                    
                    <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer"
                        onClick={() => setShowViewer(true)}
                    >
                        {isPdf ? (
                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <Suspense fallback={<div className="text-xs text-muted-foreground">Loading...</div>}>
                                <PdfPreview fileData={file.data} scale={0.4} />
                            </Suspense>
                        </div>
                        ) : isImage && previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-2" />
                        ) : null}
                    </div>
                  </div>
                ) : (
                    <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground bg-muted/30 rounded-lg">
                        No preview available
                    </div>
                )}
             </div>
          ) : (
             <div className="h-[100px] flex items-center justify-center text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                Connect a file to preview
             </div>
          )}
        </CardContent>
        <CustomHandle type="target" position={Position.Left} />
      </Card>
      
      {fileId && (isPdf || isImage) && showViewer && (
        <Suspense fallback={null}>
            <FileViewerModal 
            fileId={fileId} 
            open={showViewer} 
            onClose={() => setShowViewer(false)} 
            />
        </Suspense>
      )}
    </>
  );
});

PreviewNode.displayName = 'PreviewNode';