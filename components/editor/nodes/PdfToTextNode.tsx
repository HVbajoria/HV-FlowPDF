import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileText, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { extractText } from '../../../lib/pdf-processing';

export const PdfToTextNode = memo(({ data }: { data: any }) => {
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
      const text = await extractText(file.data);
      const blob = new Blob([text], { type: 'text/plain' });
      const arrayBuffer = await blob.arrayBuffer();
      
      const newFileId = `pdf2txt-${Date.now()}`;
      const fileName = `${file.name.replace('.pdf', '')}.txt`;

      addFile({
        id: newFileId,
        name: fileName,
        data: arrayBuffer,
        previewUrl: URL.createObjectURL(blob) 
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });
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
          <div className="p-2 bg-blue-500/10 rounded-md">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          PDF to Text
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Extracts text from all pages.</p>
        <Button 
            className="w-full" 
            onClick={handleConvert} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Extracting...' : <><Play className="w-4 h-4 mr-2" /> Extract Text</>}
        </Button>
        {data.fileName && (
            <div className="pt-2 border-t border-border/50">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]" title={data.fileName}>{data.fileName}</span>
             </div>
            </div>
        )}
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
      <CustomHandle type="source" position={Position.Right}  />
    </Card>
  );
});

PdfToTextNode.displayName = 'PdfToTextNode';