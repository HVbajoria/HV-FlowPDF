import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Connection,
  Node,
  useReactFlow,
  SelectionMode,
  useStore,
} from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import { nodeTypes } from './nodes/index';
import ContextMenu from './ContextMenu';

function NodeCanvasContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, addFile, updateNodeData } = useFlowStore();
  const { screenToFlowPosition } = useReactFlow();

  // Helper for distance
  function distToSegment(p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) {
      const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
      if (l2 === 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.sqrt((p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2);
  }

  const handleEdgeSplit = useCallback((node: any) => {
      const twoWayNodes = ['rotate', 'removePages', 'pageNumbers', 'watermark', 'split', 'pdfToImage', 'imageToPdf', 'removeBlankPages', 'flatten', 'secure'];
      if (!twoWayNodes.includes(node.type || '')) return;

      // Define node center and dimensions (approximate if not set)
      const nodeW = node.width || 350;
      const nodeH = node.height || 200;
      const nodeCenter = {
          x: node.position.x + nodeW / 2,
          y: node.position.y + nodeH / 2,
      };

      // Find intersecting edge
      const intersectingEdge = edges.find(edge => {
          // Skip if connected to this node
          if (edge.source === node.id || edge.target === node.id) return false;

          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);

          if (!sourceNode || !targetNode) return false;

          const sCenter = {
              x: sourceNode.position.x + (sourceNode.width || 350) / 2,
              y: sourceNode.position.y + (sourceNode.height || 200) / 2,
          };
          const tCenter = {
              x: targetNode.position.x + (targetNode.width || 350) / 2,
              y: targetNode.position.y + (targetNode.height || 200) / 2,
          };

          // Distance from nodeCenter to line segment (sCenter, tCenter)
          const dist = distToSegment(nodeCenter, sCenter, tCenter);
          
          // Threshold for intersection (e.g., 50px)
          return dist < 50;
      });

      if (intersectingEdge) {
          // Remove old edge
          onEdgesChange([{ type: 'remove', id: intersectingEdge.id }]);
          
          // Create new edges
          onConnect({ source: intersectingEdge.source, target: node.id, sourceHandle: intersectingEdge.sourceHandle || null, targetHandle: null });
          onConnect({ source: node.id, target: intersectingEdge.target, sourceHandle: null, targetHandle: intersectingEdge.targetHandle || null });
      }
  }, [edges, nodes, onEdgesChange, onConnect]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const position = reactFlowWrapper.current?.getBoundingClientRect();
      const x = event.clientX - (position?.left || 0);
      const y = event.clientY - (position?.top || 0);

      // Handle File Drop (supports multiple files)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const files = Array.from(event.dataTransfer.files) as File[];
        const baseTimestamp = Date.now();
        
        // Position files in a grid layout
        const gridSpacing = 50; // Space between nodes

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const timestamp = baseTimestamp + i;
          
          // Calculate grid position (2 columns)
          const col = i % 2;
          const row = Math.floor(i / 2);
          const offsetX = col * (350 + gridSpacing);
          const offsetY = row * (200 + gridSpacing);

          const dropPosition = screenToFlowPosition({
            x: event.clientX + offsetX,
            y: event.clientY + offsetY,
          });

          if (file.type === 'application/pdf') {
              const arrayBuffer = await file.arrayBuffer();
              const fileId = `file-${timestamp}`;
              const nodeId = `input-${timestamp}`;
              
              addFile({
                  id: fileId,
                  name: file.name,
                  data: arrayBuffer,
              });

              const newNode = {
                  id: nodeId,
                  type: 'genericInput',
                  position: dropPosition,
                  data: { label: 'File Input', fileId, fileName: file.name, fileType: 'pdf' },
              };
              
              addNode(newNode);
          } else if (file.type.startsWith('image/')) {
              const arrayBuffer = await file.arrayBuffer();
              const fileId = `file-${timestamp}`;
              const nodeId = `input-${timestamp}`;
              
              addFile({
                  id: fileId,
                  name: file.name,
                  data: arrayBuffer,
                  previewUrl: URL.createObjectURL(file)
              });

              const newNode = {
                  id: nodeId,
                  type: 'genericInput',
                  position: dropPosition,
                  data: { label: 'File Input', fileId, fileName: file.name, fileType: 'image' },
              };
              
              addNode(newNode);
          }
        }
        return;
      }

      // Handle Node Drop from Sidebar
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: flowPosition,
        data: { label: `${type} node` },
      };

      addNode(newNode);
      
      // Check for auto-connect (split edge)
      handleEdgeSplit(newNode);
    },
    [addNode, addFile, screenToFlowPosition, handleEdgeSplit]
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);
      
      if (!sourceNode || !targetNode) return false;

      const pdfSources = ['pdfInput', 'merge', 'split', 'imageToPdf', 'extract', 'genericInput', 'rotate', 'removePages', 'pageNumbers', 'watermark', 'preview', 'metadata', 'addImage', 'flatten', 'removeBlankPages', 'secure'];
      const pdfTargets = ['merge', 'split', 'pdfToImage', 'pdfOutput', 'extract', 'genericOutput', 'rotate', 'removePages', 'pageNumbers', 'watermark', 'preview', 'metadata', 'addImage', 'flatten', 'removeBlankPages', 'pdfToText', 'secure'];
      
      const imageSources = ['imageInput', 'pdfToImage', 'genericInput', 'preview'];
      const imageTargets = ['imageToPdf', 'pdfOutput', 'genericOutput', 'preview', 'addImage'];

      // Special check for AddImageNode handles
      if (targetNode.type === 'addImage') {
          let isPdfSource = pdfSources.includes(sourceNode.type || '');
          let isImageSource = imageSources.includes(sourceNode.type || '');
          
          // Refine for genericInput
          if (sourceNode.type === 'genericInput') {
             if (sourceNode.data?.fileType === 'pdf') {
                 isImageSource = false;
             } else if (sourceNode.data?.fileType === 'image') {
                 isPdfSource = false;
             }
          }

          if (connection.targetHandle === 'input-pdf') return isPdfSource;
          if (connection.targetHandle === 'input-image') return isImageSource;
      }

      const sourceIsPdf = pdfSources.includes(sourceNode.type || '');
      const targetIsPdf = pdfTargets.includes(targetNode.type || '');
      
      const sourceIsImage = imageSources.includes(sourceNode.type || '');
      const targetIsImage = imageTargets.includes(targetNode.type || '');

      if (sourceIsPdf && targetIsPdf) return true;
      if (sourceIsImage && targetIsImage) return true;
      
      // Special case for PDF to Text
      if (sourceNode.type === 'pdfToText' && ['genericOutput', 'preview'].includes(targetNode.type || '')) return true;

      return false;
    },
    [nodes]
  );

  const [menu, setMenu] = useState<{ id: string; type: 'node' | 'edge'; top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const pane = ref.current?.getBoundingClientRect();

      if (!pane) return;

      setMenu({
        id: node.id,
        type: 'node',
        top: event.clientY - pane.top,
        left: event.clientX - pane.left,
      });
    },
    [setMenu]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.preventDefault();
      const pane = ref.current?.getBoundingClientRect();

      if (!pane) return;

      setMenu({
        id: edge.id,
        type: 'edge',
        top: event.clientY - pane.top,
        left: event.clientX - pane.left,
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;

      // Check if outside (allow a small buffer of 50px)
      const buffer = 50;
      const isOutside = 
          event.clientX < pane.left - buffer || 
          event.clientX > pane.right + buffer || 
          event.clientY < pane.top - buffer || 
          event.clientY > pane.bottom + buffer;

      if (isOutside) {
          onNodesChange([{ type: 'remove', id: node.id }]);
          return;
      }
      
      // Check for edge split on drag stop
      handleEdgeSplit(node);
  }, [onNodesChange, handleEdgeSplit]);

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
      const currentEdges = edges;
      const newConnections: Connection[] = [];

      deletedNodes.forEach(node => {
          const incomingEdges = currentEdges.filter(e => e.target === node.id);
          const outgoingEdges = currentEdges.filter(e => e.source === node.id);

          incomingEdges.forEach(inEdge => {
              outgoingEdges.forEach(outEdge => {
                  const connection = {
                      source: inEdge.source,
                      target: outEdge.target,
                      sourceHandle: inEdge.sourceHandle || null,
                      targetHandle: outEdge.targetHandle || null
                  };
                  
                  const exists = currentEdges.some(e => 
                      e.source === connection.source && 
                      e.target === connection.target && 
                      e.sourceHandle === connection.sourceHandle && 
                      e.targetHandle === connection.targetHandle
                  );

                  const existsInBatch = newConnections.some(c => 
                      c.source === connection.source && 
                      c.target === connection.target && 
                      c.sourceHandle === connection.sourceHandle && 
                      c.targetHandle === connection.targetHandle
                  );

                  if (!exists && !existsInBatch) {
                      newConnections.push(connection);
                  }
              });
          });
      });

      if (newConnections.length > 0) {
          newConnections.forEach(conn => onConnect(conn));
      }
  }, [edges, onConnect]);

  const connectingNodeId = useRef<{ nodeId: string; handleType: string; handleId: string | null } | null>(null);
  
  const onConnectStart = useCallback((_: any, { nodeId, handleType, handleId }: { nodeId: string | null; handleType: string | null; handleId: string | null }) => {
    if (nodeId && handleType) {
        connectingNodeId.current = { nodeId, handleType, handleId };
    }
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingNodeId.current) return;

      const target = event.target;
      const nodeElement = target.closest('.react-flow__node');

      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-id');
        
        if (targetNodeId && targetNodeId !== connectingNodeId.current.nodeId) {
            const { nodeId: sourceNodeId, handleType: sourceType, handleId: sourceHandleId } = connectingNodeId.current;
            const targetType = sourceType === 'source' ? 'target' : 'source';
            
            const handles = nodeElement.querySelectorAll(`.react-flow__handle.${targetType}`);
            
            // Find the first valid handle
            for (let i = 0; i < handles.length; i++) {
                const handle = handles[i];
                let handleId = handle.getAttribute('data-handleid');
                if (handleId === '') handleId = null;

                const connection = {
                    source: sourceType === 'source' ? sourceNodeId : targetNodeId,
                    target: sourceType === 'source' ? targetNodeId : sourceNodeId,
                    sourceHandle: sourceType === 'source' ? sourceHandleId : handleId,
                    targetHandle: sourceType === 'source' ? handleId : sourceHandleId,
                };

                if (isValidConnection(connection)) {
                    const isTargetHandle = targetType === 'target';
                    const isOccupied = isTargetHandle && edges.some(e => 
                        e.target === connection.target && 
                        e.targetHandle === connection.targetHandle
                    );

                    if (!isOccupied) {
                        onConnect(connection);
                        break; 
                    }
                }
            }
        }
      }
      connectingNodeId.current = null;
    },
    [isValidConnection, onConnect, edges]
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        ref={ref}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
      </ReactFlow>
    </div>
  );
}

export function NodeCanvas() {
  return (
    <ReactFlowProvider>
      <NodeCanvasContent />
    </ReactFlowProvider>
  );
}