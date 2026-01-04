import React, { memo } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileOutput, Download } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';

export const PdfOutputNode = memo(({ data }: { data: any }) => {
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const files = useFlowStore((state) => state.files);

  const handleDownload = () => {
    if (!nodeId) return;

    // Find source node
    const edge = getEdges().find(e => e.target === nodeId);
    if (!edge) {
        alert("No input connected");
        return;
    }

    const sourceNode = getNodes().find(n => n.id === edge.source);
    if (sourceNode?.data?.fileId && files[sourceNode.data.fileId]) {
        const file = files[sourceNode.data.fileId];
        
        // Detect type from name or default to octet-stream
        let type = 'application/octet-stream';
        if (file.name.endsWith('.pdf')) type = 'application/pdf';
        else if (file.name.endsWith('.png')) type = 'image/png';
        else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) type = 'image/jpeg';

        const blob = new Blob([file.data], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name || 'output';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        alert("No file data to download");
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-green-500/10 rounded-md">
            <FileOutput className="w-4 h-4 text-green-600" />
          </div>
          PDF Output
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Ready to download</p>
        <Button size="sm" className="w-full" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
    </Card>
  );
});

PdfOutputNode.displayName = 'PdfOutputNode';