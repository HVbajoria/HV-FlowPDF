import React, { memo, useCallback, useState, Suspense, lazy } from 'react';
import { Position } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Image as ImageIcon } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';

const FileViewerModal = lazy(() => import('../PdfViewerModal').then(mod => ({ default: mod.FileViewerModal })));

export const ImageInputNode = memo(({ id, data }: { id: string, data: any }) => {
  const addFile = useFlowStore((state) => state.addFile);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [showViewer, setShowViewer] = useState(false);

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const arrayBuffer = await file.arrayBuffer();
      const fileId = `${id}-file`;
      
      addFile({
        id: fileId,
        name: file.name,
        data: arrayBuffer,
        previewUrl: URL.createObjectURL(file)
      });
      
      updateNodeData(id, { ...data, fileId, fileName: file.name });
    }
  }, [addFile, updateNodeData, id, data]);

  const file = useFlowStore((state) => data.fileId ? state.files[data.fileId] : null);

  return (
    <>
      <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="px-5 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="p-2 bg-purple-500/10 rounded-md">
              <ImageIcon className="w-4 h-4 text-purple-600" />
            </div>
            Image Input
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`img-file-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File</Label>
            <Input 
              id={`img-file-${id}`} 
              type="file" 
              accept="image/*" 
              onChange={onFileChange}
              className="h-9 file:text-purple-600 file:font-medium"
            />
            
            {data.fileName && (
              <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Selected</span>
                      <span className="text-xs text-purple-600 truncate max-w-[150px]">{data.fileName}</span>
                  </div>
                  {file?.previewUrl && (
                      <div 
                        className="h-[160px] w-full overflow-hidden flex justify-center items-center bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setShowViewer(true)}
                      >
                          <img src={file.previewUrl} alt="Preview" className="h-full w-full object-contain p-2" />
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
          <FileViewerModal 
            fileId={data.fileId} 
            open={showViewer} 
            onClose={() => setShowViewer(false)} 
          />
        </Suspense>
      )}
    </>
  );
});

ImageInputNode.displayName = 'ImageInputNode';