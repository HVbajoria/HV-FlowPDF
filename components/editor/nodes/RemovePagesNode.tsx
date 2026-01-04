import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Trash2, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { removePages } from '../../../lib/pdf-processing';

export const RemovePagesNode = memo(({ id, data }: { id: string, data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleUpdate = (key: string, value: any) => {
    updateNodeData(id, { ...data, [key]: value });
  };

  const handleRemove = async () => {
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

      const range = data.pageRange || "";
      if (!range.trim()) {
        alert("Please specify pages to remove");
        setIsProcessing(false);
        return;
      }

      // Parse page range
      const indices = new Set<number>();
      const parts = range.split(',').map((p: string) => p.trim());
      
      for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map((n: string) => parseInt(n));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) indices.add(i - 1);
            }
        } else {
            const page = parseInt(part);
            if (!isNaN(page)) indices.add(page - 1);
        }
      }

      const sortedIndices = Array.from(indices).sort((a, b) => a - b);
      const newPdfBuffer = await removePages(files[sourceNode.data.fileId].data, sortedIndices);

      const newFileId = `removed-${Date.now()}`;
      addFile({
        id: newFileId,
        name: 'processed.pdf',
        data: newPdfBuffer,
      });

      updateNodeData(id, { ...data, fileId: newFileId, fileName: 'processed.pdf' });
    } catch (error) {
      console.error("Remove pages failed:", error);
      alert("Failed to remove pages.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-red-500/10 rounded-md">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          Remove Pages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`range-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages to Remove</Label>
          <Input 
            id={`range-${id}`} 
            value={data.pageRange || ''} 
            onChange={(e) => handleUpdate('pageRange', e.target.value)} 
            placeholder="e.g. 1, 3-5"
            className="h-9"
          />
        </div>

        <Button 
            className="w-full" 
            onClick={handleRemove} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Processing...' : <><Play className="w-4 h-4 mr-2" /> Remove Pages</>}
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

RemovePagesNode.displayName = 'RemovePagesNode';