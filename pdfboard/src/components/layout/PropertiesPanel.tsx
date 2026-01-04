import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFlowStore } from '@/store/flowStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NODE_LABELS: Record<string, string> = {
  genericInput: 'File Input',
  genericOutput: 'File Output',
  preview: 'Preview',
  merge: 'Merge PDFs',
  split: 'Split PDF',
  rotate: 'Rotate Pages',
  removePages: 'Remove Pages',
  pageNumbers: 'Page Numbers',
  watermark: 'Watermark',
  imageToPdf: 'Image to PDF',
  pdfToImage: 'PDF to Image',
  pdfToText: 'PDF to Text',
  metadata: 'Metadata Editor',
  addImage: 'Add Image to PDF',
  flatten: 'Flatten PDF',
  removeBlankPages: 'Remove Blank Pages',
  secure: 'Protect PDF',
};

const CheckboxRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
    <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
    </div>
);

export function PropertiesPanel() {
  const nodes = useFlowStore((state) => state.nodes);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const selectedNode = nodes.find((n) => n.selected);

  const handleUpdate = (key: string, value: any) => {
    if (selectedNode) {
      updateNodeData(selectedNode.id, { ...selectedNode.data, [key]: value });
    }
  };

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <p>Select a node to view and edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-muted/10">
        <h2 className="text-lg font-semibold">
            {NODE_LABELS[selectedNode.type || ''] || selectedNode.data.label || 'Node Properties'}
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4 min-h-0">
        <div className="grid gap-6">
          {/* Specific Node Properties */}
          {selectedNode.type === 'pageNumbers' && (
             <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</Label>
                <div className="grid gap-2">
                    <Label>Position</Label>
                    <Select 
                        value={selectedNode.data.position || 'bottom-center'} 
                        onValueChange={(val) => handleUpdate('position', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bottom-center">Bottom Center</SelectItem>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="top-center">Top Center</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Format</Label>
                    <Select 
                        value={['1', '1 / n', 'Page 1', 'Page 1 of n'].includes(selectedNode.data.format || '1') ? (selectedNode.data.format || '1') : 'custom'} 
                        onValueChange={(val) => {
                            if (val === 'custom') handleUpdate('format', '{n}');
                            else handleUpdate('format', val);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="1 / n">1 / n</SelectItem>
                            <SelectItem value="Page 1">Page 1</SelectItem>
                            <SelectItem value="Page 1 of n">Page 1 of n</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                    {(!['1', '1 / n', 'Page 1', 'Page 1 of n'].includes(selectedNode.data.format || '1')) && (
                        <div className="mt-1">
                            <Input 
                                value={selectedNode.data.format || '{n}'}
                                onChange={(e) => handleUpdate('format', e.target.value)}
                                placeholder="e.g. Page {n} of {total}"
                                className="h-8 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Use {'{n}'} for page number, {'{total}'} for count.</p>
                        </div>
                    )}
                </div>
                <div className="grid gap-2">
                    <Label>Start Number</Label>
                    <Input 
                        type="number" 
                        value={selectedNode.data.startNumber || 1} 
                        onChange={(e) => handleUpdate('startNumber', e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                        <Label>Start Page</Label>
                        <Input 
                            type="number" 
                            placeholder="1"
                            value={selectedNode.data.startFromPage || ''} 
                            onChange={(e) => handleUpdate('startFromPage', e.target.value)} 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>End Page</Label>
                        <Input 
                            type="number" 
                            placeholder="Last"
                            value={selectedNode.data.endAtPage || ''} 
                            onChange={(e) => handleUpdate('endAtPage', e.target.value)} 
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Skip Pages</Label>
                    <Input 
                        placeholder="e.g. 1, 3, 5"
                        value={selectedNode.data.skipPages || ''} 
                        onChange={(e) => handleUpdate('skipPages', e.target.value)} 
                    />
                    <p className="text-[10px] text-muted-foreground">Comma separated list of page numbers to skip.</p>
                </div>
             </div>
          )}
          {selectedNode.type === 'rotate' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</Label>
                <div className="grid gap-2">
                    <Label>Rotation</Label>
                    <Select 
                        value={selectedNode.data.rotation || '90'} 
                        onValueChange={(val) => handleUpdate('rotation', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select rotation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="90">90° Clockwise</SelectItem>
                            <SelectItem value="180">180°</SelectItem>
                            <SelectItem value="270">90° Counter-Clockwise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Page Range</Label>
                    <Input 
                        placeholder="e.g. 1, 3-5 (Leave empty for all)"
                        value={selectedNode.data.pageRange || ''} 
                        onChange={(e) => handleUpdate('pageRange', e.target.value)} 
                    />
                </div>
              </div>
          )}
          {selectedNode.type === 'genericOutput' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</Label>
                <div className="grid gap-2">
                    <Label>Output Format</Label>
                    <Select 
                        value={selectedNode.data.fileType || 'auto'} 
                        onValueChange={(val) => handleUpdate('fileType', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Auto Detect</SelectItem>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="image">Image (ZIP/PNG)</SelectItem>
                            <SelectItem value="text">Text File</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {selectedNode.data.fileType === 'image' && (
                    <div className="grid gap-2">
                        <Label>Image Export Mode</Label>
                        <Select 
                            value={selectedNode.data.imageExportMode || 'single_image'} 
                            onValueChange={(val) => handleUpdate('imageExportMode', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="single_image">Single Long Image</SelectItem>
                                <SelectItem value="zip">Multiple Images (ZIP)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid gap-2">
                    <Label>Output Filename</Label>
                    <Input 
                        placeholder="e.g. output.pdf"
                        value={selectedNode.data.outputFileName || ''} 
                        onChange={(e) => handleUpdate('outputFileName', e.target.value)} 
                    />
                </div>
              </div>
          )}
          {selectedNode.type === 'split' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuration</Label>
                <div className="grid gap-2">
                    <Label>Split Mode</Label>
                    <Select 
                        value={selectedNode.data.splitMode || 'range'} 
                        onValueChange={(val) => handleUpdate('splitMode', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="range">Extract Range</SelectItem>
                            <SelectItem value="extract_all">Extract All Pages (Separate Files)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {(!selectedNode.data.splitMode || selectedNode.data.splitMode === 'range') && (
                    <div className="grid gap-2">
                        <Label>Page Range</Label>
                        <Input 
                            placeholder="e.g. 1, 3-5"
                            value={selectedNode.data.pageRange || ''} 
                            onChange={(e) => handleUpdate('pageRange', e.target.value)} 
                        />
                        <p className="text-[10px] text-muted-foreground">Comma separated list of page numbers or ranges to extract.</p>
                    </div>
                )}
              </div>
          )}
          {selectedNode.type === 'metadata' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Metadata</Label>
                <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input 
                        value={selectedNode.data.title || ''} 
                        onChange={(e) => handleUpdate('title', e.target.value)} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Author</Label>
                    <Input 
                        value={selectedNode.data.author || ''} 
                        onChange={(e) => handleUpdate('author', e.target.value)} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Input 
                        value={selectedNode.data.subject || ''} 
                        onChange={(e) => handleUpdate('subject', e.target.value)} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Keywords</Label>
                    <Input 
                        value={selectedNode.data.keywords || ''} 
                        onChange={(e) => handleUpdate('keywords', e.target.value)} 
                        placeholder="Comma separated"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Creator</Label>
                    <Input 
                        value={selectedNode.data.creator || ''} 
                        onChange={(e) => handleUpdate('creator', e.target.value)} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Producer</Label>
                    <Input 
                        value={selectedNode.data.producer || ''} 
                        onChange={(e) => handleUpdate('producer', e.target.value)} 
                    />
                </div>
              </div>
          )}
          {selectedNode.type === 'addImage' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Image Placement</Label>
                <div className="grid gap-2">
                    <Label>Page Number</Label>
                    <Input 
                        type="number"
                        value={selectedNode.data.pageNumber || '1'} 
                        onChange={(e) => handleUpdate('pageNumber', e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                        <Label>X Position</Label>
                        <Input 
                            type="number"
                            value={selectedNode.data.x || '0'} 
                            onChange={(e) => handleUpdate('x', e.target.value)} 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Y Position</Label>
                        <Input 
                            type="number"
                            value={selectedNode.data.y || '0'} 
                            onChange={(e) => handleUpdate('y', e.target.value)} 
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Scale</Label>
                    <Input 
                        type="number"
                        step="0.1"
                        value={selectedNode.data.scale || '1'} 
                        onChange={(e) => handleUpdate('scale', e.target.value)} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                        <Label>Width (Optional)</Label>
                        <Input 
                            type="number"
                            value={selectedNode.data.width || ''} 
                            onChange={(e) => handleUpdate('width', e.target.value)} 
                            placeholder="Auto"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Height (Optional)</Label>
                        <Input 
                            type="number"
                            value={selectedNode.data.height || ''} 
                            onChange={(e) => handleUpdate('height', e.target.value)} 
                            placeholder="Auto"
                        />
                    </div>
                </div>
              </div>
          )}
          {selectedNode.type === 'secure' && (
              <div className="grid gap-4">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Passwords</Label>
                <div className="grid gap-2">
                    <Label>User Password</Label>
                    <Input 
                        type="password"
                        value={selectedNode.data.userPassword || ''} 
                        onChange={(e) => handleUpdate('userPassword', e.target.value)} 
                        placeholder="Required to open"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Owner Password</Label>
                    <Input 
                        type="password"
                        value={selectedNode.data.ownerPassword || ''} 
                        onChange={(e) => handleUpdate('ownerPassword', e.target.value)} 
                        placeholder="Required to change permissions"
                    />
                </div>

                <div className="h-px bg-border my-2" />
                
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Permissions</Label>
                
                <div className="grid gap-2">
                    <Label>Printing</Label>
                    <Select 
                        value={selectedNode.data.allowPrinting || 'highResolution'} 
                        onValueChange={(val) => handleUpdate('allowPrinting', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Printing" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="highResolution">High Resolution</SelectItem>
                            <SelectItem value="lowResolution">Low Resolution</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <CheckboxRow 
                    label="Allow Modifying" 
                    checked={selectedNode.data.allowModifying !== false} 
                    onChange={(val) => handleUpdate('allowModifying', val)} 
                />
                <CheckboxRow 
                    label="Allow Copying" 
                    checked={selectedNode.data.allowCopying !== false} 
                    onChange={(val) => handleUpdate('allowCopying', val)} 
                />
                <CheckboxRow 
                    label="Allow Annotating" 
                    checked={selectedNode.data.allowAnnotating !== false} 
                    onChange={(val) => handleUpdate('allowAnnotating', val)} 
                />
                 <CheckboxRow 
                    label="Allow Form Filling" 
                    checked={selectedNode.data.allowFillingForms !== false} 
                    onChange={(val) => handleUpdate('allowFillingForms', val)} 
                />
              </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}