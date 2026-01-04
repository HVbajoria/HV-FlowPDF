import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';

export async function addPageNumbers(
  pdfBuffer: ArrayBuffer,
  options: {
    position: 'bottom-center' | 'bottom-right' | 'top-center' | 'top-right',
    startFromPage?: number,
    endAtPage?: number,
    skipPages?: number[],
    startNumber?: number,
    format?: '1' | '1 / n' | 'Page 1' | 'Page 1 of n'
  }
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const pageCount = pdf.getPageCount();
  const startPageIdx = (options.startFromPage || 1) - 1;
  const endPageIdx = (options.endAtPage || pageCount) - 1;
  const skipSet = new Set(options.skipPages || []);

  let currentNumber = options.startNumber || 1;

  pages.forEach((page, idx) => {
    if (idx < startPageIdx || idx > endPageIdx || skipSet.has(idx + 1)) {
      return;
    }

    const { width, height } = page.getSize();
    const fontSize = 12;
    let text = options.format || '{n}';
    
    if (text === '1') text = '{n}';
    else if (text === '1 / n') text = '{n} / {total}';
    else if (text === 'Page 1') text = 'Page {n}';
    else if (text === 'Page 1 of n') text = 'Page {n} of {total}';

    text = text.replace(/\{n\}/g, `${currentNumber}`).replace(/\{total\}/g, `${pageCount}`);

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let x = 0;
    let y = 30;

    switch (options.position) {
      case 'bottom-center':
        x = (width - textWidth) / 2;
        break;
      case 'bottom-right':
        x = width - textWidth - 30;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - 30 - fontSize;
        break;
      case 'top-right':
        x = width - textWidth - 30;
        y = height - 30 - fontSize;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    currentNumber++;
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function addWatermark(pdfBuffer: ArrayBuffer, text: string): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = 50;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.5,
      rotate: degrees(45),
    });
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<ArrayBuffer> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return mergedPdfBytes.buffer as ArrayBuffer;
}

export async function splitPdf(pdfBuffer: ArrayBuffer): Promise<ArrayBuffer[]> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const numberOfPages = pdf.getPageCount();
  const splitPdfs: ArrayBuffer[] = [];

  for (let i = 0; i < numberOfPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);
    const newPdfBytes = await newPdf.save();
    splitPdfs.push(newPdfBytes.buffer as ArrayBuffer);
  }

  return splitPdfs;
}

export async function extractPages(pdfBuffer: ArrayBuffer, pageIndices: number[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter(i => i >= 0 && i < pdf.getPageCount());
  
  if (validIndices.length > 0) {
    const copiedPages = await newPdf.copyPages(pdf, validIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
  }

  const newPdfBytes = await newPdf.save();
  return newPdfBytes.buffer as ArrayBuffer;
}

export async function imageToPdf(imageBuffer: ArrayBuffer, imageName: string): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  
  let image;
  if (imageName.toLowerCase().endsWith('.png')) {
    image = await pdf.embedPng(imageBuffer);
  } else {
    image = await pdf.embedJpg(imageBuffer);
  }

  const { width, height } = image.scale(1);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  let scale = 1;
  if (width > pageWidth || height > pageHeight) {
    scale = Math.min(pageWidth / width, pageHeight / height);
  }

  page.drawImage(image, {
    x: (pageWidth - width * scale) / 2,
    y: (pageHeight - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function rotatePages(pdfBuffer: ArrayBuffer, rotationDegrees: number, pageIndices?: number[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const pages = pdf.getPages();
  const indicesToRotate = pageIndices || pages.map((_, i) => i);

  indicesToRotate.forEach(index => {
    if (index >= 0 && index < pages.length) {
      const page = pages[index];
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationDegrees));
    }
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function removePages(pdfBuffer: ArrayBuffer, pageIndices: number[]): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const sortedIndices = [...pageIndices].sort((a, b) => b - a);
  const pageCount = pdf.getPageCount();

  sortedIndices.forEach(index => {
    if (index >= 0 && index < pageCount) {
      pdf.removePage(index);
    }
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function pdfToImages(pdfBuffer: ArrayBuffer, scale = 2): Promise<Blob[]> {
  if (typeof window === 'undefined') return [];
  
  // Dynamic import
  const pdfjsModule = await import('pdfjs-dist');
  const pdfjs = (pdfjsModule as any).default || pdfjsModule;
  const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions || (pdfjsModule as any).GlobalWorkerOptions;
  const getDocument = pdfjs.getDocument || (pdfjsModule as any).getDocument;

  // Force classic worker
  if (GlobalWorkerOptions) {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const dataCopy = pdfBuffer.slice(0);
  const loadingTask = getDocument({ data: dataCopy });
  const pdf = await loadingTask.promise;

  const images: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport } as any).promise;
    
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (blob) images.push(blob);
  }

  return images;
}

export async function extractText(pdfBuffer: ArrayBuffer): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  const pdfjsModule = await import('pdfjs-dist');
  const pdfjs = (pdfjsModule as any).default || pdfjsModule;
  const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions || (pdfjsModule as any).GlobalWorkerOptions;
  const getDocument = pdfjs.getDocument || (pdfjsModule as any).getDocument;

  if (GlobalWorkerOptions) {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const dataCopy = pdfBuffer.slice(0);
  const loadingTask = getDocument({ data: dataCopy });
  const pdf = await loadingTask.promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return fullText;
}

export async function updateMetadata(
  pdfBuffer: ArrayBuffer,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  }
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);

  if (metadata.title !== undefined) pdf.setTitle(metadata.title);
  if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) pdf.setKeywords(metadata.keywords);
  if (metadata.creator !== undefined) pdf.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdf.setProducer(metadata.producer);

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function addImageToPdf(
  pdfBuffer: ArrayBuffer,
  imageBuffer: ArrayBuffer,
  imageType: 'png' | 'jpg' | 'jpeg',
  options: {
    pageNumber: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    scale?: number;
  }
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const pageIndex = options.pageNumber - 1;

  if (pageIndex < 0 || pageIndex >= pdf.getPageCount()) {
    throw new Error(`Page number ${options.pageNumber} is out of range.`);
  }

  const page = pdf.getPage(pageIndex);
  let image;
  
  if (imageType === 'png') {
    image = await pdf.embedPng(imageBuffer);
  } else {
    image = await pdf.embedJpg(imageBuffer);
  }

  let { width, height } = image.scale(options.scale || 1);
  if (options.width) width = options.width;
  if (options.height) height = options.height;

  page.drawImage(image, {
    x: options.x,
    y: options.y,
    width,
    height,
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}

export async function removeBlankPages(pdfBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof window === 'undefined') return pdfBuffer;
  
  const pdfjsModule = await import('pdfjs-dist');
  const pdfjs = (pdfjsModule as any).default || pdfjsModule;
  const GlobalWorkerOptions = pdfjs.GlobalWorkerOptions || (pdfjsModule as any).GlobalWorkerOptions;
  const getDocument = pdfjs.getDocument || (pdfjsModule as any).getDocument;
  const OPS = pdfjs.OPS || (pdfjsModule as any).OPS;

  if (GlobalWorkerOptions) {
    GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const dataCopy = pdfBuffer.slice(0);
  const loadingTask = getDocument({ data: dataCopy });
  const pdf = await loadingTask.promise;
  const pagesToKeep: number[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join('').trim();
    
    // Check for images
    const ops = await page.getOperatorList();
    let hasImages = false;
    if (OPS) {
      for (let j = 0; j < ops.fnArray.length; j++) {
        if (ops.fnArray[j] === OPS.paintImageXObject || 
            ops.fnArray[j] === OPS.paintInlineImageXObject) {
          hasImages = true;
          break;
        }
      }
    }

    if (text.length > 0 || hasImages) {
      pagesToKeep.push(i - 1);
    }
  }

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();

  if (pagesToKeep.length > 0) {
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
    copiedPages.forEach(page => newPdf.addPage(page));
  } else {
    // If all pages are blank, return original
    return pdfBuffer;
  }

  const newPdfBytes = await newPdf.save();
  return newPdfBytes.buffer as ArrayBuffer;
}

export async function readMetadata(pdfBuffer: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
  };
}

export async function encryptPdf(
  pdfBuffer: ArrayBuffer,
  options: {
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: 'highResolution' | 'lowResolution';
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    }
  }
): Promise<ArrayBuffer> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const { userPassword, ownerPassword, permissions } = options;

  (pdf as any).encrypt({
    userPassword: userPassword || '',
    ownerPassword: ownerPassword || userPassword || '',
    permissions: permissions || {},
  });

  const pdfBytes = await pdf.save();
  return pdfBytes.buffer as ArrayBuffer;
}