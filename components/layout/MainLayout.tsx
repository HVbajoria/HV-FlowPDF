import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable"
import { Sidebar } from './Sidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { NodeCanvas } from '../editor/NodeCanvas';

export function MainLayout() {
  return (
    <div className="h-screen w-full bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/20 border-r">
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={60} minSize={30}>
          <NodeCanvas />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/20 border-l">
          <PropertiesPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}