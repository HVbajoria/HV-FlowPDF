import React, { memo, useState } from 'react';
import { Handle, Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Image as ImageIcon, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { renderPageToImage } from '../../../lib/pdf-render';

export const PdfToImageNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageNumber, setPageNumber] = useState("1");
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
      const pageNum = parseInt(pageNumber);
      
      if (isNaN(pageNum) || pageNum < 1) {
          alert("Invalid page number");
          setIsProcessing(false);
          return;
      }

      const { blob } = await renderPageToImage(file.data, pageNum);
      const arrayBuffer = await blob.arrayBuffer();
      
      const newFileId = `pdf2img-${Date.now()}`;
      const fileName = `${file.name}-page${pageNum}.png`;

      addFile({
        id: newFileId,
        name: fileName,
        data: arrayBuffer,
        previewUrl: URL.createObjectURL(blob)
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Conversion failed. Check page number.");
    } finally {
      setIsProcessing(false);
    }
  };

  const file = useFlowStore((state) => data.fileId ? state.files[data.fileId] : null);

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-pink-500/10 rounded-md">
            <ImageIcon className="w-4 h-4 text-pink-600" />
          </div>
          PDF to Image
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`page-${nodeId}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page Number</Label>
          <Input 
            id={`page-${nodeId}`} 
            value={pageNumber} 
            onChange={(e) => setPageNumber(e.target.value)} 
            type="number"
            min="1"
            className="h-9"
          />
        </div>

        <Button 
            className="w-full" 
            onClick={handleConvert} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Converting...' : <><Play className="w-4 h-4 mr-2" /> Convert Page</>}
        </Button>

        {data.fileName && (
            <div className="pt-2 border-t border-border/50">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]" title={data.fileName}>{data.fileName}</span>
             </div>
             {file?.previewUrl && (
                <div className="h-[160px] w-full overflow-hidden flex justify-center items-center bg-muted/30 rounded-lg border border-border/50">
                    <img src={file.previewUrl} alt="Output" className="h-full w-full object-contain p-2" />
                </div>
             )}
            </div>
        )}
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
      <CustomHandle type="source" position={Position.Right}  />
    </Card>
  );
});

PdfToImageNode.displayName = 'PdfToImageNode';