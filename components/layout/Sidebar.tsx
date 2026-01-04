import React from 'react';
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileInput, Scissors, Merge, FileOutput, Layers, Image as ImageIcon, RotateCw, Trash2, Hash, Stamp, Eye, Lock } from 'lucide-react';

const NODE_TYPES = [
  { type: 'genericInput', label: 'File Input', icon: FileInput },
  { type: 'genericOutput', label: 'File Output', icon: FileOutput },
  { type: 'preview', label: 'Preview', icon: Eye },
  { type: 'merge', label: 'Merge PDFs', icon: Merge },
  { type: 'split', label: 'Split PDF', icon: Scissors },
  { type: 'rotate', label: 'Rotate Pages', icon: RotateCw },
  { type: 'removePages', label: 'Remove Pages', icon: Trash2 },
  { type: 'pageNumbers', label: 'Page Numbers', icon: Hash },
  { type: 'watermark', label: 'Watermark', icon: Stamp },
  { type: 'secure', label: 'Protect PDF', icon: Lock },
  { type: 'imageToPdf', label: 'Image to PDF', icon: FileInput },
  { type: 'pdfToImage', label: 'PDF to Image', icon: ImageIcon },
  { type: 'pdfToText', label: 'PDF to Text', icon: FileInput },
  { type: 'metadata', label: 'Metadata', icon: FileInput },
  { type: 'addImage', label: 'Add Image', icon: ImageIcon },
  { type: 'flatten', label: 'Flatten PDF', icon: FileInput },
  { type: 'removeBlankPages', label: 'Remove Blank Pages', icon: FileInput },
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Nodes</h2>
        <p className="text-xs text-muted-foreground">Drag nodes to the canvas</p>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 grid grid-cols-2 gap-3">
          {NODE_TYPES.map((node) => (
            <div
              key={node.type}
              className="flex flex-col items-center justify-center p-3 border rounded-md cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors bg-card shadow-sm"
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
            >
              <node.icon className="w-6 h-6 mb-2 text-primary" />
              <span className="text-xs font-medium text-center leading-tight">{node.label}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}