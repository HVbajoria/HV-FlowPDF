import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { RotateCw, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { rotatePages } from '../../../lib/pdf-processing';

export const RotateNode = memo(({ id, data }: { id: string, data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleRotate = async () => {
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

      // Parse page range
      let indices: number[] | undefined = undefined;
      const range = data.pageRange || "";
      if (range.trim()) {
        const parsedIndices = new Set<number>();
        const parts = range.split(',').map((p: string) => p.trim());
        
        for (const part of parts) {
          if (part.includes('-')) {
              const [start, end] = part.split('-').map((n: string) => parseInt(n));
              if (!isNaN(start) && !isNaN(end)) {
                  for (let i = start; i <= end; i++) parsedIndices.add(i - 1);
              }
          } else {
              const page = parseInt(part);
              if (!isNaN(page)) parsedIndices.add(page - 1);
          }
        }
        indices = Array.from(parsedIndices).sort((a, b) => a - b);
      }

      const degrees = parseInt(data.rotation || "90");
      const rotatedPdfBuffer = await rotatePages(files[sourceNode.data.fileId].data, degrees, indices);

      const newFileId = `rotated-${Date.now()}`;
      addFile({
        id: newFileId,
        name: 'rotated.pdf',
        data: rotatedPdfBuffer,
      });

      updateNodeData(id, { ...data, fileId: newFileId, fileName: 'rotated.pdf' });
    } catch (error) {
      console.error("Rotation failed:", error);
      alert("Rotation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = (key: string, value: any) => {
    updateNodeData(id, { ...data, [key]: value });
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-yellow-500/10 rounded-md">
            <RotateCw className="w-4 h-4 text-yellow-600" />
          </div>
          Rotate Pages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rotation</Label>
          <Select value={data.rotation || '90'} onValueChange={(val) => handleUpdate('rotation', val)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select rotation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90° Clockwise</SelectItem>
              <SelectItem value="180">180°</SelectItem>
              <SelectItem value="270">90° Counter-Clockwise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`range-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page Range (Optional)</Label>
          <Input 
            id={`range-${id}`} 
            value={data.pageRange || ''} 
            onChange={(e) => handleUpdate('pageRange', e.target.value)} 
            placeholder="e.g. 1, 3-5 (Leave empty for all)"
            className="h-9"
          />
        </div>

        <Button 
            className="w-full" 
            onClick={handleRotate} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Rotating...' : <><Play className="w-4 h-4 mr-2" /> Rotate Pages</>}
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

RotateNode.displayName = 'RotateNode';