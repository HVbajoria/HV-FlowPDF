import React, { memo, useState, useEffect, useMemo } from 'react';
import { Handle, Position, useReactFlow, useNodeId, useStore } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Merge, Play, Plus } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { mergePdfs } from '../../../lib/pdf-processing';
import { cn } from '../../../lib/utils';

// Custom Handle component for consistent styling
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

export const MergeNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();
  
  // Dynamic inputs state
  const edges = useStore((s) => s.edges);
  const connectedEdges = useMemo(() => edges.filter(e => e.target === nodeId), [edges, nodeId]);

  // Calculate number of inputs needed
  // We always want at least 2, and always one free slot if the last one is taken
  const inputCount = useMemo(() => {
      const connectedHandles = new Set(connectedEdges.map(e => e.targetHandle));
      let maxIndex = 1; // Start with at least index 1 (2 inputs: 0 and 1)
      
      connectedEdges.forEach(e => {
          if (e.targetHandle && e.targetHandle.startsWith('input-')) {
              const index = parseInt(e.targetHandle.replace('input-', ''));
              if (!isNaN(index) && index > maxIndex) {
                  maxIndex = index;
              }
          }
      });
      
      // If the last one is connected, add one more
      if (connectedHandles.has(`input-${maxIndex}`)) {
          return maxIndex + 2; // +1 for next index, +1 for length
      }
      
      return maxIndex + 1;
  }, [connectedEdges]);

  const handleMerge = async () => {
    if (!nodeId) return;
    setIsProcessing(true);
    try {
      const currentEdges = getEdges().filter(edge => edge.target === nodeId);
      const inputFiles: ArrayBuffer[] = [];

      // Sort by handle index
      const sortedEdges = currentEdges.sort((a, b) => {
          const aIdx = parseInt(a.targetHandle?.replace('input-', '') || '0');
          const bIdx = parseInt(b.targetHandle?.replace('input-', '') || '0');
          return aIdx - bIdx;
      });

      for (const edge of sortedEdges) {
        const sourceNode = getNodes().find(n => n.id === edge.source);
        if (sourceNode?.data) {
            if (sourceNode.data.fileIds && Array.isArray(sourceNode.data.fileIds)) {
                // Handle multiple files from one node (e.g. Split All)
                sourceNode.data.fileIds.forEach((fid: string) => {
                    if (files[fid]) {
                        inputFiles.push(files[fid].data);
                    }
                });
            } else if (sourceNode.data.fileId && files[sourceNode.data.fileId]) {
                inputFiles.push(files[sourceNode.data.fileId].data);
            }
        }
      }

      if (inputFiles.length < 2) {
        alert("Please connect at least two PDF inputs.");
        setIsProcessing(false);
        return;
      }

      const mergedPdfBuffer = await mergePdfs(inputFiles);
      
      const newFileId = `merged-${Date.now()}`;
      addFile({
        id: newFileId,
        name: 'merged.pdf',
        data: mergedPdfBuffer,
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName: 'merged.pdf' });
    } catch (error) {
      console.error("Merge failed:", error);
      alert("Merge failed. See console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-blue-500/10 rounded-md">
            <Merge className="w-4 h-4 text-blue-600" />
          </div>
          Merge PDFs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        {/* Dynamic Inputs */}
        <div className="flex flex-col gap-3">
            {Array.from({ length: inputCount }).map((_, i) => (
                <LabeledHandle 
                    key={`input-${i}`}
                    type="target" 
                    position={Position.Left} 
                    id={`input-${i}`} 
                    label={`Input ${i + 1}`}
                    // Pull container to the left edge to align handle with border
                    containerClassName="-ml-5 pl-5" 
                />
            ))}
        </div>

        <div className="pt-2 border-t border-border/50">
            <Button 
                size="sm" 
                className="w-full" 
                onClick={handleMerge} 
                disabled={isProcessing}
                variant={isProcessing ? "secondary" : "default"}
            >
                {isProcessing ? 'Merging...' : <><Play className="w-4 h-4 mr-2" /> Run Merge</>}
            </Button>
        </div>

        {/* Output */}
        <div className="flex justify-end">
             <LabeledHandle 
                type="source" 
                position={Position.Right} 
                label="Merged PDF"
                // Pull container to the right edge
                containerClassName="-mr-5 pr-5"
            />
        </div>

        {data.fileName && (
             <div className="flex items-center justify-end mt-2">
                <span className="text-xs text-green-600 truncate max-w-[150px]" title={data.fileName}>
                    {data.fileName}
                </span>
             </div>
        )}
      </CardContent>
    </Card>
  );
});

MergeNode.displayName = 'MergeNode';