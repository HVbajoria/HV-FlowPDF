import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export type PDFFile = {
  id: string;
  name: string;
  data: ArrayBuffer;
  previewUrl?: string;
};

type FlowState = {
  nodes: any[];
  edges: any[];
  files: Record<string, PDFFile>;
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onConnect: (connection: any) => void;
  addFile: (file: PDFFile) => void;
  addNode: (node: any) => void;
  updateNodeData: (nodeId: string, data: any) => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  files: {},
  onNodesChange: (changes: any[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: any[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: any) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  addFile: (file: PDFFile) => {
    set((state) => ({
      files: { ...state.files, [file.id]: file },
    }));
  },
  addNode: (node: any) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },
  updateNodeData: (nodeId: string, data: any) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data };
        }
        return node;
      }),
    }));
  },
}));