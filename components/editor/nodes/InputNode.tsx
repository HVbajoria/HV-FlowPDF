import React, { memo, useCallback, useState, Suspense, lazy } from 'react';
import { Position } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { FileInput } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';

const PdfPreview = lazy(() => import('../PdfPreview').then(mod => ({ default: mod.PdfPreview })));
const FileViewerModal = lazy(() => import('../PdfViewerModal').then(mod => ({ default: mod.FileViewerModal })));

const FILE_TYPES = [
  { value: 'pdf', label: 'PDF', accept: '.pdf', mime: 'application/pdf' },
  { value: 'image', label: 'Image', accept: 'image/*', mime: 'image/' },
  { value: 'all', label: 'Any File', accept: '*', mime: '' },
];

export const InputNode = memo(({ id, data }: { id: string, data: any }) => {
  const addFile = useFlowStore((state) => state.addFile);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [showViewer, setShowViewer] = useState(false);
  const [fileType, setFileType] = useState(data.fileType || 'pdf');

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const fileId = `${id}-file`;
    
    const fileData: any = {
      id: fileId,
      name: file.name,
      data: arrayBuffer,
    };

    // Add preview URL for images
    if (file.type.startsWith('image/')) {
      fileData.previewUrl = URL.createObjectURL(file);
    }

    addFile(fileData);
    updateNodeData(id, { ...data, fileId, fileName: file.name, fileType });
  }, [addFile, updateNodeData, id, data, fileType]);

  const handleFileTypeChange = (value: string) => {
    setFileType(value);
    updateNodeData(id, { ...data, fileType: value });
  };

  const file = useFlowStore((state) => data.fileId ? state.files[data.fileId] : null);
  const selectedType = FILE_TYPES.find(t => t.value === fileType) || FILE_TYPES[0];
  const isPdf = file?.name.toLowerCase().endsWith('.pdf');
  const isImage = file?.previewUrl || file?.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

  return (
    <>
      <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="px-5 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <div className="p-2 bg-primary/10 rounded-md">
              <FileInput className="w-4 h-4 text-primary" />
            </div>
            File Input
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File Type</Label>
            <Select value={fileType} onValueChange={handleFileTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`file-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File</Label>
            <Input 
              id={`file-${id}`} 
              type="file" 
              accept={selectedType.accept} 
              onChange={onFileChange}
              className="h-9 file:text-primary file:font-medium"
            />
            
            {data.fileName && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Selected</span>
                  <span className="text-xs text-primary truncate max-w-[200px]" title={data.fileName}>
                    {data.fileName}
                  </span>
                </div>
                {(isPdf || isImage) && (
                  <div 
                    className="h-[160px] w-full overflow-hidden flex justify-center items-center bg-muted/30 rounded-lg border border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setShowViewer(true)}
                  >
                    {isPdf ? (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <Suspense fallback={<div>Loading...</div>}>
                            <PdfPreview fileData={file?.data!} scale={0.3} />
                        </Suspense>
                      </div>
                    ) : isImage && file?.previewUrl ? (
                      <img src={file.previewUrl} alt="Preview" className="h-full w-full object-contain p-2" />
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CustomHandle type="source" position={Position.Right} />
      </Card>
      {data.fileId && (isPdf || isImage) && showViewer && (
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

InputNode.displayName = 'InputNode';