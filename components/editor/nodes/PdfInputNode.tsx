import React, { memo, useCallback, useState, Suspense, lazy } from 'react';
import { Position } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { FileInput } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';

const PdfPreview = lazy(() => import('../PdfPreview').then(mod => ({ default: mod.PdfPreview })));
const PdfViewerModal = lazy(() => import('../PdfViewerModal').then(mod => ({ default: mod.PdfViewerModal })));

export const PdfInputNode = memo(({ id, data }: { id: string, data: any }) => {
  const addFile = useFlowStore((state) => state.addFile);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [showViewer, setShowViewer] = useState(false);

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const fileId = `${id}-file`;
      
      addFile({
        id: fileId,
        name: file.name,
        data: arrayBuffer,
      });
      
      updateNodeData(id, { ...data, fileId, fileName: file.name });
    }
  }, [addFile, updateNodeData, id, data]);

  return (
    <>
      <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="px-5 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="p-2 bg-primary/10 rounded-md">
              <FileInput className="w-4 h-4 text-primary" />
            </div>
            PDF Input
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`pdf-file-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File</Label>
            <Input 
              id={`pdf-file-${id}`} 
              type="file" 
              accept=".pdf" 
              onChange={onFileChange}
              className="h-9 file:text-primary file:font-medium"
            />
            
            {data.fileName && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Selected</span>
                  <span className="text-xs text-primary truncate max-w-[150px]" title={data.fileName}>
                    {data.fileName}
                  </span>
                </div>
                {data.fileId && (
                  <div 
                    className="h-[160px] w-full overflow-hidden flex justify-center items-center bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowViewer(true)}
                  >
                    <PdfPreviewWrapper fileId={data.fileId} />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CustomHandle type="source" position={Position.Right} />
      </Card>
      {data.fileId && showViewer && (
        <Suspense fallback={null}>
            <PdfViewerModal 
            fileId={data.fileId} 
            open={showViewer} 
            onClose={() => setShowViewer(false)} 
            />
        </Suspense>
      )}
    </>
  );
});

// Helper component to connect to store
const PdfPreviewWrapper = ({ fileId }: { fileId: string }) => {
  const file = useFlowStore((state) => state.files[fileId]);
  if (!file) return null;
  
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <Suspense fallback={<div>Loading...</div>}>
        <PdfPreview fileData={file.data} scale={0.3} />
      </Suspense>
    </div>
  );
};

PdfInputNode.displayName = 'PdfInputNode';