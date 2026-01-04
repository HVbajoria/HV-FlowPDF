import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { FileOutput, Download } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { pdfToImages } from '../../../lib/pdf-processing';
import JSZip from 'jszip';

const FILE_TYPES = [
  { value: 'auto', label: 'Auto-detect', extensions: [] },
  { value: 'pdf', label: 'PDF', extensions: ['.pdf'] },
  { value: 'image', label: 'Image', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
  { value: 'text', label: 'Text', extensions: ['.txt'] },
];

export const OutputNode = memo(({ data }: { data: any }) => {
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const files = useFlowStore((state) => state.files);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const [fileType, setFileType] = useState(data.fileType || 'auto');
  const [outputFileName, setOutputFileName] = useState(data.outputFileName || '');

  const handleFileTypeChange = (value: string) => {
    setFileType(value);
    if (nodeId) {
      updateNodeData(nodeId, { ...data, fileType: value });
    }
  };

  const handleOutputFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOutputFileName(value);
    if (nodeId) {
      updateNodeData(nodeId, { ...data, outputFileName: value });
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (!nodeId) return;

    // Find source node
    const edge = getEdges().find(e => e.target === nodeId);
    if (!edge) {
        alert("No input connected");
        return;
    }

    const sourceNode = getNodes().find(n => n.id === edge.source);
    if (!sourceNode?.data) {
        alert("No file data to download");
        return;
    }

    // Collect files
    const filesToProcess: { name: string, data: ArrayBuffer }[] = [];
    
    if (sourceNode.data.fileIds && Array.isArray(sourceNode.data.fileIds)) {
        sourceNode.data.fileIds.forEach((fid: string) => {
            if (files[fid]) filesToProcess.push(files[fid]);
        });
    } else if (sourceNode.data.fileId && files[sourceNode.data.fileId]) {
        filesToProcess.push(files[sourceNode.data.fileId]);
    }

    if (filesToProcess.length === 0) {
        alert("No file data to download");
        return;
    }

    // Process
    if (fileType === 'image') {
        // Convert PDFs to images
        const allImages: Blob[] = [];
        for (const file of filesToProcess) {
            if (file.name.toLowerCase().endsWith('.pdf')) {
                try {
                    const images = await pdfToImages(file.data);
                    allImages.push(...images);
                } catch (e) {
                    console.error("Conversion failed", e);
                    alert("Failed to convert PDF to image");
                }
            } else {
                // Already image?
                allImages.push(new Blob([file.data]));
            }
        }
        
        if (data.imageExportMode === 'single_image' && allImages.length > 0) {
            // Stitch images
            const loadedImages = await Promise.all(allImages.map(blob => {
                return new Promise<HTMLImageElement>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.src = URL.createObjectURL(blob);
                });
            }));
            
            const totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);
            const maxWidth = Math.max(...loadedImages.map(img => img.width));
            
            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                let y = 0;
                for (const img of loadedImages) {
                    ctx.drawImage(img, 0, y);
                    y += img.height;
                }
                canvas.toBlob((blob) => {
                    if (blob) downloadBlob(blob, (outputFileName || 'output') + '.png');
                }, 'image/png');
            }
        } else if (data.imageExportMode === 'zip' && allImages.length > 0) {
             const zip = new JSZip();
             allImages.forEach((blob, i) => {
                 zip.file(`${outputFileName || 'output'}-${i + 1}.png`, blob);
             });
             const content = await zip.generateAsync({ type: "blob" });
             downloadBlob(content, (outputFileName || 'output') + '.zip');
        } else {
            // Download individually
            allImages.forEach((blob, i) => {
                downloadBlob(blob, `${outputFileName || 'output'}-${i + 1}.png`);
            });
        }
    } else {
        // PDF or Auto
        filesToProcess.forEach((file, i) => {
             let type = 'application/octet-stream';
             if (file.name.endsWith('.pdf')) type = 'application/pdf';
             else if (file.name.endsWith('.txt')) type = 'text/plain';

             const blob = new Blob([file.data], { type });
             const name = filesToProcess.length > 1 ? `${outputFileName || 'output'}-${i+1}${file.name.substring(file.name.lastIndexOf('.'))}` : (outputFileName || file.name);
             
             downloadBlob(blob, name);
        });
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-green-500/10 rounded-md">
            <FileOutput className="w-4 h-4 text-green-600" />
          </div>
          File Output
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">File Name (Optional)</Label>
            <Input 
                value={outputFileName} 
                onChange={handleOutputFileNameChange} 
                placeholder="e.g. my-document.pdf"
                className="h-9"
            />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output Format</Label>
          <Select value={fileType} onValueChange={handleFileTypeChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {fileType === 'auto' ? 'Will use source file format' : `Download as ${FILE_TYPES.find(t => t.value === fileType)?.label}`}
        </p>
        <Button size="sm" className="w-full" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </CardContent>
      <CustomHandle type="target" position={Position.Left} />
    </Card>
  );
});

OutputNode.displayName = 'OutputNode';