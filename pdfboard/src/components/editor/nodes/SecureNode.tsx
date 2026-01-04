import React, { memo, useState } from 'react';
import { Position, useReactFlow, useNodeId } from 'reactflow';
import { CustomHandle } from './CustomHandle';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Lock, Play } from 'lucide-react';
import { useFlowStore } from '../../../store/flowStore';
import { encryptPdf } from '../../../lib/pdf-processing';

export const SecureNode = memo(({ data }: { data: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { getEdges, getNodes } = useReactFlow();
  const nodeId = useNodeId();
  const { files, addFile, updateNodeData } = useFlowStore();

  const handleProtect = async () => {
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
      if (!data.userPassword && !data.ownerPassword) {
        alert("Please set at least one password in properties.");
        setIsProcessing(false);
        return;
      }

      const newPdfBuffer = await encryptPdf(file.data, {
        userPassword: data.userPassword,
        ownerPassword: data.ownerPassword,
        permissions: {
          printing: data.allowPrinting === 'none' ? undefined : (data.allowPrinting || 'highResolution'),
          modifying: data.allowModifying !== false, // default true
          copying: data.allowCopying !== false, // default true
          annotating: data.allowAnnotating !== false,
          fillingForms: data.allowFillingForms !== false,
          contentAccessibility: data.allowAccessibility !== false,
          documentAssembly: data.allowAssembly !== false,
        }
      });

      const newFileId = `secure-${Date.now()}`;
      const fileName = `protected-${file.name}`;

      addFile({
        id: newFileId,
        name: fileName,
        data: newPdfBuffer,
      });

      updateNodeData(nodeId, { ...data, fileId: newFileId, fileName });

    } catch (error) {
      console.error("Encryption failed:", error);
      alert("Failed to protect PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-[350px] shadow-lg border-border/60 bg-card/95 backdrop-blur-sm relative">
      <CardHeader className="px-5 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
          <div className="p-2 bg-slate-500/10 rounded-md">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          Protect PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <p className="text-xs text-muted-foreground">Encrypts the PDF with a password. Configure in properties.</p>
        
        <div className="flex gap-2 text-xs">
            <div className={`px-2 py-1 rounded border ${data.userPassword ? 'bg-green-100 border-green-200 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                User PW: {data.userPassword ? 'Set' : 'None'}
            </div>
            <div className={`px-2 py-1 rounded border ${data.ownerPassword ? 'bg-green-100 border-green-200 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                Owner PW: {data.ownerPassword ? 'Set' : 'None'}
            </div>
        </div>

        <Button 
            className="w-full" 
            onClick={handleProtect} 
            disabled={isProcessing}
            variant={isProcessing ? "secondary" : "default"}
        >
            {isProcessing ? 'Encrypting...' : <><Play className="w-4 h-4 mr-2" /> Protect PDF</>}
        </Button>

        {data.fileName && (
             <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Output</span>
                <span className="text-xs text-green-600 truncate max-w-[120px]" title={data.fileName}>{data.fileName}</span>
             </div>
        )}
      </CardContent>
      <CustomHandle type="target" position={Position.Left}  />
      <CustomHandle type="source" position={Position.Right}  />
    </Card>
  );
});

SecureNode.displayName = 'SecureNode';