import React, { memo, useState, useEffect } from 'react';
import { Position, useReactFlow, useNodeId, useStore, Node } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { FileType, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { updateMetadata, readMetadata } from '../../../lib/pdf-processing';

export const MetadataNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();
  const edges = useStore((s) => s.edges);
  const nodeInternals = useStore((s) => s.nodeInternals);
  const nodes = Array.from(nodeInternals.values()) as Node[];
  
  const edge = edges.find(e => e.target === nodeId);
  const sourceNode = edge ? nodes.find(n => n.id === edge.source) : null;
  const fileId = sourceNode?.data?.fileId;

  useEffect(() => {
      const fetchMetadata = async () => {
          if (fileId && files[fileId] && nodeId) {
              if (data.loadedFileId !== fileId) {
                  try {
                      const metadata = await readMetadata(files[fileId].data);
                      updateNodeData(nodeId, {
                          ...data,
                          ...metadata,
                          loadedFileId: fileId
                      });
                  } catch (e) {
                      console.error("Failed to read metadata", e);
                  }
              }
          } else if (!fileId && data.loadedFileId && nodeId) {
              // Disconnected: Clear metadata
              updateNodeData(nodeId, {
                  ...data,
                  title: '',
                  author: '',
                  subject: '',
                  keywords: '',
                  creator: '',
                  producer: '',
                  loadedFileId: null,
                  fileName: null
              });
          }
      };
      
      fetchMetadata();
  }, [fileId, files, nodeId, data.loadedFileId, updateNodeData]);

  const handleApply = async () => {
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
      const keywords = data.keywords ? data.keywords.split(',').map((k: string) => k.trim()) : undefined;

      const newPdfBuffer = await updateMetadata(file.data, {
          title: data.title,
          author: data.author,
          subject: data.subject,
          keywords: keywords,
          creator: data.creator,
          producer: data.producer
      });

      const newFileId = `meta-${Date.now()}`;
      const fileName = `meta-${file.name}`;

      addFile({
        id: newFileId,
        name: fileName,
        data: newPdfBuffer,
        previewUrl: URL.createObjectURL(new Blob([newPdfBuffer], { type: 'application/pdf' }))
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });
    } catch (error) {
      console.error("Metadata update failed:", error);
      alert("Metadata update failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-purple-500/10 rounded-md">
            <FileType className="w-4 h-4 text-purple-600" />
          </div>
          Metadata Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="space-y-2 text-xs">
            {['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer'].map(key => {
                const val = data[key.toLowerCase()];
                if (!val) return null;
                return (
                    <div key={key} className="flex gap-2 items-center group relative">
                        <span className="font-semibold min-w-[60px] text-[10px] uppercase text-muted-foreground">{key}:</span>
                        <span className="truncate text-foreground flex-1 cursor-help">{val}</span>
                        {/* Custom Tooltip */}
                        <div className="hidden group-hover:block absolute left-10 bottom-full mb-2 w-[200px] bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-lg border z-50 break-words whitespace-normal pointer-events-none">
                            <span className="font-semibold block mb-1 text-[10px] uppercase text-muted-foreground">{key}</span>
                            {val}
                        </div>
                    </div>
                );
            })}
            {!data.title && !data.author && !data.subject && !data.keywords && !data.creator && !data.producer && (
                <p className="text-xs text-muted-foreground italic text-center py-2">No metadata found. Edit properties in the panel.</p>
            )}
        </div>
        <Button 
            className="w-full" 
            onClick={handleApply} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Applying...' : <><Play className="w-4 h-4 mr-2" /> Apply Metadata</>}
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

MetadataNode.displayName = 'MetadataNode';