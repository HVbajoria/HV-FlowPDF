import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileType, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { imageToPdf } from '../../../lib/pdf-processing';
import { CustomHandle } from './CustomHandle';

export const ImageToPdfNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleConvert = async () => {
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
      const pdfBuffer = await imageToPdf(file.data, file.name);
      
      const newFileId = `img2pdf-${Date.now()}`;
      addFile({
        id: newFileId,
        name: `${file.name}.pdf`,
        data: pdfBuffer,
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName: `${file.name}.pdf` });
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Conversion failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-indigo-500/10 rounded-md">
            <FileType className="w-4 h-4 text-indigo-600" />
          </div>
          Image to PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Converts an image file to PDF.</p>
        <Button 
            className="w-full" 
            onClick={handleConvert} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Converting...' : <><Play className="w-4 h-4 mr-2" /> Convert</>}
        </Button>
        {data.fileName && (
             <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]">{data.fileName}</span>
             </div>
        )}
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
      <CustomHandle type="source" position={Position.Right}  />
    </Card>
  );
});

ImageToPdfNode.displayName = 'ImageToPdfNode';