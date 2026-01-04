import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { ImagePlus, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { addImageToPdf } from '../../../lib/pdf-processing';
import { cn } from '../../../lib/utils';

const LabeledHandle = ({ type, position, id, label, className, containerClassName }: any) => (
  <div className={cn("relative flex items-center", type === 'target' ? "flex-row" : "flex-row-reverse", containerClassName)}>
    <CustomHandle 
        type={type} 
        position={position} 
        id={id} 
        className={cn("border-2 border-background transition-colors", className)} 
    />
    <span className={cn("text-xs text-muted-foreground mx-2", type === 'target' ? "text-left" : "text-right")}>
        {label}
    </span>
  </div>
);

export const AddImageNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleAddImage = async () => {
    if (!nodeId) return;
    setIsProcessing(true);
    try {
      const edges = getEdges().filter(e => e.target === nodeId);
      const pdfEdge = edges.find(e => e.targetHandle === 'input-pdf');
      const imageEdge = edges.find(e => e.targetHandle === 'input-image');

      if (!pdfEdge || !imageEdge) {
        alert("Please connect both a PDF and an Image.");
        setIsProcessing(false);
        return;
      }

      const pdfNode = getNodes().find(n => n.id === pdfEdge.source);
      const imageNode = getNodes().find(n => n.id === imageEdge.source);

      if (!pdfNode?.data?.fileId || !files[pdfNode.data.fileId]) {
        alert("PDF input missing.");
        setIsProcessing(false);
        return;
      }
      if (!imageNode?.data?.fileId || !files[imageNode.data.fileId]) {
        alert("Image input missing.");
        setIsProcessing(false);
        return;
      }

      const pdfFile = files[pdfNode.data.fileId];
      const imageFile = files[imageNode.data.fileId];

      // Detect image type
      const isPng = imageFile.name.toLowerCase().endsWith('.png');
      const isJpg = imageFile.name.toLowerCase().endsWith('.jpg') || imageFile.name.toLowerCase().endsWith('.jpeg');

      if (!isPng && !isJpg) {
          alert("Image must be PNG or JPG.");
          setIsProcessing(false);
          return;
      }

      const newPdfBuffer = await addImageToPdf(
          pdfFile.data,
          imageFile.data,
          isPng ? 'png' : 'jpg',
          {
              pageNumber: parseInt(data.pageNumber || '1'),
              x: parseInt(data.x || '0'),
              y: parseInt(data.y || '0'),
              scale: parseFloat(data.scale || '1'),
              width: data.width ? parseInt(data.width) : undefined,
              height: data.height ? parseInt(data.height) : undefined,
          }
      );

      const newFileId = `addimg-${Date.now()}`;
      const fileName = `img-${pdfFile.name}`;

      addFile({
        id: newFileId,
        name: fileName,
        data: newPdfBuffer,
        previewUrl: URL.createObjectURL(new Blob([newPdfBuffer], { type: 'application/pdf' }))
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });
    } catch (error) {
      console.error("Add Image failed:", error);
      alert("Add Image failed. Check inputs.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-orange-500/10 rounded-md">
            <ImagePlus className="w-4 h-4 text-orange-600" />
          </div>
          Add Image to PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="flex flex-col gap-3">
             <LabeledHandle 
                type="target" 
                position={Position.Left} 
                id="input-pdf" 
                label="PDF Input"
                containerClassName="-ml-5 pl-5" 
            />
             <LabeledHandle 
                type="target" 
                position={Position.Left} 
                id="input-image" 
                label="Image Input"
                containerClassName="-ml-5 pl-5" 
            />
        </div>
        <p className="text-xs text-muted-foreground">Configure position in properties.</p>
        <Button 
            className="w-full" 
            onClick={handleAddImage} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Processing...' : <><Play className="w-4 h-4 mr-2" /> Add Image</>}
        </Button>
        <div className="flex justify-end">
             <LabeledHandle 
                type="source" 
                position={Position.Right} 
                label="Output PDF"
                containerClassName="-mr-5 pr-5"
            />
        </div>
        {data.fileName && (
            <div className="pt-2 border-t border-border/50">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]" title={data.fileName}>{data.fileName}</span>
             </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
});

AddImageNode.displayName = 'AddImageNode';