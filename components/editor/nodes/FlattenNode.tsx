import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Layers, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { pdfToImages, imageToPdf, mergePdfs } from '../../../lib/pdf-processing';

export const FlattenNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleFlatten = async () => {
    if (!nodeId) return;
    setIsProcessing(true);
    try {
      const edge = getEdges().find(e => e.target === nodeId);
      if (!edge) {
        alert("No input connected");
        setIsProcessing(false);
        return;
      }

      const sourceNode = getNodes().find(n => n.id === edge.source);
      if (!sourceNode?.data?.fileId || !files[sourceNode.data.fileId]) {
        alert("No file data found");
        setIsProcessing(false);
        return;
      }

      const file = files[sourceNode.data.fileId];

      // 1. Convert PDF to Images
      const imageBlobs = await pdfToImages(file.data);

      // 2. Convert each Image back to PDF
      const pdfBuffers = await Promise.all(imageBlobs.map(async (blob) => {
          const buffer = await blob.arrayBuffer();
          return imageToPdf(buffer, 'page.png');
      }));

      // 3. Merge PDFs
      const flattenedPdfBuffer = await mergePdfs(pdfBuffers);

      const newFileId = `flat-${Date.now()}`;
      const fileName = `flat-${file.name}`;

      addFile({
        id: newFileId,
        name: fileName,
        data: flattenedPdfBuffer,
        previewUrl: URL.createObjectURL(new Blob([flattenedPdfBuffer], { type: 'application/pdf' }))
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });
    } catch (error) {
      console.error("Flatten failed:", error);
      alert("Flatten failed. See console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-stone-500/10 rounded-md">
            <Layers className="w-4 h-4 text-stone-600" />
          </div>
          Flatten PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Converts pages to images and back to PDF to remove editable elements.</p>
        <Button 
            className="w-full" 
            onClick={handleFlatten} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Flattening...' : <><Play className="w-4 h-4 mr-2" /> Flatten</>}
        </Button>
        {data.fileName && (
             <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]" title={data.fileName}>{data.fileName}</span>
             </div>
        )}
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
      <CustomHandle type="source" position={Position.Right}  />
    </Card>
  );
});

FlattenNode.displayName = 'FlattenNode';