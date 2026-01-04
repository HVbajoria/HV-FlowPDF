import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Hash, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { addPageNumbers } from '../../../lib/pdf-processing';

export const PageNumberNode = memo(({ id, data }: { id: string, data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleAddNumbers = async () => {
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

      // Parse skip pages string to array
      let skipPages: number[] = [];
      if (data.skipPages) {
        skipPages = data.skipPages.split(',').map((p: string) => parseInt(p.trim())).filter((n: number) => !isNaN(n));
      }

      const newPdfBuffer = await addPageNumbers(
        files[sourceNode.data.fileId].data, 
        {
            position: data.position || 'bottom-center',
            startFromPage: data.startFromPage ? parseInt(data.startFromPage) : undefined,
            endAtPage: data.endAtPage ? parseInt(data.endAtPage) : undefined,
            skipPages: skipPages,
            startNumber: data.startNumber ? parseInt(data.startNumber) : 1,
            format: data.format || '1'
        }
      );

      const newFileId = `numbered-${Date.now()}`;
      addFile({
        id: newFileId,
        name: 'numbered.pdf',
        data: newPdfBuffer,
      });

      updateNodeData(id, { ...data, fileId: newFileId, fileName: 'numbered.pdf' });
    } catch (error) {
      console.error("Add page numbers failed:", error);
      alert("Failed to add page numbers.");
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
          <div className="p-2 bg-green-500/10 rounded-md">
            <Hash className="w-4 h-4 text-green-600" />
          </div>
          Add Page Numbers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</Label>
              <Select 
                value={data.position || 'bottom-center'} 
                onValueChange={(val) => handleUpdate('position', val)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</Label>
              <Select 
                value={['1', '1 / n', 'Page 1', 'Page 1 of n'].includes(data.format || '1') ? (data.format || '1') : 'custom'} 
                onValueChange={(val) => {
                    if (val === 'custom') handleUpdate('format', '{n}');
                    else handleUpdate('format', val);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="1 / n">1 / n</SelectItem>
                  <SelectItem value="Page 1">Page 1</SelectItem>
                  <SelectItem value="Page 1 of n">Page 1 of n</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>

        <Button 
            className="w-full" 
            onClick={handleAddNumbers} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Processing...' : <><Play className="w-4 h-4 mr-2" /> Add Page Numbers</>}
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

PageNumberNode.displayName = 'PageNumberNode';