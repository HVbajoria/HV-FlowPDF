import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Stamp, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { addWatermark } from '../../../lib/pdf-processing';

export const WatermarkNode = memo(({ id, data }: { id: string, data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleUpdate = (key: string, value: any) => {
    updateNodeData(id, { ...data, [key]: value });
  };

  const handleAddWatermark = async () => {
    setIsProcessing(true);
    try {
      const edge = getEdges().find(e => e.target === id);
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

      const text = data.watermarkText || "CONFIDENTIAL";
      if (!text.trim()) {
        alert("Please enter watermark text");
        setIsProcessing(false);
        return;
      }

      const newPdfBuffer = await addWatermark(files[sourceNode.data.fileId].data, text);

      const newFileId = `watermarked-${Date.now()}`;
      addFile({
        id: newFileId,
        name: 'watermarked.pdf',
        data: newPdfBuffer,
      });

      updateNodeData(id, { ...data, fileId: newFileId, fileName: 'watermarked.pdf' });
    } catch (error) {
      console.error("Watermark failed:", error);
      alert("Failed to add watermark.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-purple-500/10 rounded-md">
            <Stamp className="w-4 h-4 text-purple-600" />
          </div>
          Add Watermark
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`text-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Watermark Text</Label>
          <Input 
            id={`text-${id}`} 
            value={data.watermarkText || ''} 
            onChange={(e) => handleUpdate('watermarkText', e.target.value)} 
            placeholder="e.g. CONFIDENTIAL"
            className="h-9"
          />
        </div>

        <Button 
            className="w-full" 
            onClick={handleAddWatermark} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Processing...' : <><Play className="w-4 h-4 mr-2" /> Add Watermark</>}
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

WatermarkNode.displayName = 'WatermarkNode';