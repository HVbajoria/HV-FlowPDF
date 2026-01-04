import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Scissors, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { extractPages, splitPdf } from '../../../lib/pdf-processing';

export const SplitNode = memo(({ id, data }: { id: string, data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleUpdate = (key: string, value: any) => {
    updateNodeData(id, { ...data, [key]: value });
  };

  const handleSplit = async () => {
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

      const mode = data.splitMode || 'range';
      
      if (mode === 'extract_all') {
          const splitBuffers = await splitPdf(files[sourceNode.data.fileId].data);
          const newFileIds: string[] = [];
          
          splitBuffers.forEach((buffer, index) => {
              const newId = `split-${Date.now()}-${index}`;
              addFile({
                  id: newId,
                  name: `page-${index + 1}.pdf`,
                  data: buffer
              });
              newFileIds.push(newId);
          });
          
          updateNodeData(id, { 
              ...data, 
              fileIds: newFileIds, 
              fileId: newFileIds[0], // Keep first file as primary for compatibility
              fileName: `${splitBuffers.length} files extracted` 
          });
      } else {
          const range = data.pageRange || "1";
          const indices = new Set<number>();
          const parts = range.split(',').map((p: string) => p.trim());
          
          for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map((n: string) => parseInt(n));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) indices.add(i - 1); // 0-indexed
                }
            } else {
                const page = parseInt(part);
                if (!isNaN(page)) indices.add(page - 1);
            }
          }

          const sortedIndices = Array.from(indices).sort((a, b) => a - b);
          const extractedPdfBuffer = await extractPages(files[sourceNode.data.fileId].data, sortedIndices);

          const newFileId = `split-${Date.now()}`;
          addFile({
            id: newFileId,
            name: 'extracted.pdf',
            data: extractedPdfBuffer,
          });

          updateNodeData(id, { 
              ...data, 
              fileId: newFileId, 
              fileIds: [newFileId], 
              fileName: 'extracted.pdf' 
          });
      }
    } catch (error) {
      console.error("Split failed:", error);
      alert("Split failed. Check page range.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-orange-500/10 rounded-md">
            <Scissors className="w-4 h-4 text-orange-600" />
          </div>
          Split PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        {(!data.splitMode || data.splitMode === 'range') ? (
            <div className="space-y-2">
            <Label htmlFor={`range-${id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Page Range</Label>
            <Input 
                id={`range-${id}`} 
                value={data.pageRange || ''} 
                onChange={(e) => handleUpdate('pageRange', e.target.value)} 
                placeholder="e.g. 1, 3-5"
                className="h-9"
            />
            </div>
        ) : (
            <div className="text-sm text-muted-foreground italic">
                Splitting all pages into separate files.
            </div>
        )}

        <Button 
            className="w-full" 
            onClick={handleSplit} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Processing...' : <><Play className="w-4 h-4 mr-2" /> {data.splitMode === 'extract_all' ? 'Split All' : 'Extract Pages'}</>}
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

SplitNode.displayName = 'SplitNode';