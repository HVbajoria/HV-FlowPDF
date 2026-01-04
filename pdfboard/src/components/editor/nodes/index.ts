import { PdfInputNode } from './PdfInputNode';
import { PdfOutputNode } from './PdfOutputNode';
import { MergeNode } from './MergeNode';
import { SplitNode } from './SplitNode';
import { ImageInputNode } from './ImageInputNode';
import { ImageToPdfNode } from './ImageToPdfNode';
import { PdfToImageNode } from './PdfToImageNode';
import { InputNode } from './InputNode';
import { OutputNode } from './OutputNode';
import { RotateNode } from './RotateNode';
import { RemovePagesNode } from './RemovePagesNode';
import { PageNumberNode } from './PageNumberNode';
import { WatermarkNode } from './WatermarkNode';
import { PreviewNode } from './PreviewNode';
import { PdfToTextNode } from './PdfToTextNode';
import { MetadataNode } from './MetadataNode';
import { AddImageNode } from './AddImageNode';
import { FlattenNode } from './FlattenNode';
import { RemoveBlankPagesNode } from './RemoveBlankPagesNode';
import { SecureNode } from './SecureNode';

export const nodeTypes = {
  // New unified nodes
  genericInput: InputNode,
  genericOutput: OutputNode,
  
  // Feature nodes
  rotate: RotateNode,
  removePages: RemovePagesNode,
  pageNumbers: PageNumberNode,
  watermark: WatermarkNode,
  preview: PreviewNode,
  metadata: MetadataNode,
  addImage: AddImageNode,
  flatten: FlattenNode,
  removeBlankPages: RemoveBlankPagesNode,
  secure: SecureNode,

  // Legacy nodes (keep for backwards compatibility)
  pdfInput: PdfInputNode,
  pdfOutput: PdfOutputNode,
  merge: MergeNode,
  split: SplitNode,
  imageInput: ImageInputNode,
  imageToPdf: ImageToPdfNode,
  pdfToImage: PdfToImageNode,
  pdfToText: PdfToTextNode,
};