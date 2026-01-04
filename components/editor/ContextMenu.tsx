import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { Button } from "../ui/button";
import { Trash2, Copy } from 'lucide-react';
import { useFlowStore } from '../../store/flowStore';

interface ContextMenuProps {
  id: string;
  type: 'node' | 'edge';
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  onClick?: () => void;
}

export default function ContextMenu({
  id,
  type,
  top,
  left,
  right,
  bottom,
  onClick,
}: ContextMenuProps) {
  const { getNode, setNodes, setEdges } = useReactFlow();
  const { addNode } = useFlowStore();

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const position = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    const newNode = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position,
      selected: true,
      data: { ...node.data, label: `${node.data.label} Copy` },
    };

    addNode(newNode);
    onClick?.();
  }, [id, getNode, addNode, onClick]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    onClick?.();
  }, [id, setNodes, onClick]);

  const deleteEdge = useCallback(() => {
    setEdges((edges) => edges.filter((e) => e.id !== id));
    onClick?.();
  }, [id, setEdges, onClick]);

  if (type === 'edge') {
    return (
      <div
        style={{ top, left, right, bottom }}
        className="absolute z-50 bg-popover border rounded-md shadow-md p-1 flex flex-col gap-1 w-40"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start h-8 px-2 text-xs text-destructive hover:text-destructive" 
          onClick={deleteEdge}
        >
          <Trash2 className="w-3 h-3 mr-2" /> Delete Connection
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-50 bg-popover border rounded-md shadow-md p-1 flex flex-col gap-1 w-32"
    >
      <Button variant="ghost" size="sm" className="justify-start h-8 px-2 text-xs" onClick={duplicateNode}>
        <Copy className="w-3 h-3 mr-2" /> Duplicate
      </Button>
      <Button variant="ghost" size="sm" className="justify-start h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={deleteNode}>
        <Trash2 className="w-3 h-3 mr-2" /> Delete
      </Button>
    </div>
  );
}