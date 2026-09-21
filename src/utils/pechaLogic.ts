import { PDFDocument, rgb } from 'pdf-lib';
import {
  PaperSizeKey,
  OrientationMode,
  PartCount,
  OversizedIssue,
  PrintSheetPlan,
  PrintItemPlan,
} from '../types';

// 1 mm = 72 / 25.4 pt
export const MM_PT = 72 / 25.4;

export const PAPER_SIZES: Record<PaperSizeKey, { wMm: number; hMm: number; label: string }> = {
  A4: { wMm: 210, hMm: 297, label: 'A4' },
  A3: { wMm: 297, hMm: 420, label: 'A3' },
  B4: { wMm: 250, hMm: 353, label: 'B4' },
};

/**
 * Calculates sheet dimensions in points based on paper size and orientation.
 */
export function getSheetDimensions(
  paperSize: PaperSizeKey,
  orientation: OrientationMode,
  firstPageAspect = 1.4
): { width: number; height: number; isLandscape: boolean } {
  const spec = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const minMm = Math.min(spec.wMm, spec.hMm);
  const maxMm = Math.max(spec.wMm, spec.hMm);

  let isLandscape = false;
  if (orientation === 'landscape') {
    isLandscape = true;
  } else if (orientation === 'portrait') {
    isLandscape = false;
  } else {
    // Auto: If pecha page is wider than standard portrait sheet aspect ratio,
    // or aspect ratio > 1.8, landscape or portrait matching.
    // For Pecha manuscripts, they are wide and short (e.g. 210mm x 70mm).
    // In portrait A4, width 210 fits standard pechas stacked vertically.
    // If firstPageAspect is very wide (> 2.5), landscape gives wider room.
    isLandscape = firstPageAspect > 2.2;
  }

  const wMm = isLandscape ? maxMm : minMm;
  const hMm = isLandscape ? minMm : maxMm;

  return {
    width: wMm * MM_PT,
    height: hMm * MM_PT,
    isLandscape,
  };
}

/**
 * Builds the duplex imposition order array for N parts.
 * Front positions follow standard left-to-right alignment;
 * Back positions are reversed right-to-left for physical duplex alignment.
 */
export function buildOrder(numPages: number, parts: PartCount): (number | null)[] {
  if (numPages <= 0) return [];

  // Duplex pairs: (0, 1), (2, 3), (4, 5)...
  const totalPairs = Math.ceil(numPages / 2);

  // Sheets needed per part
  const sheetsCount = Math.ceil(totalPairs / parts);

  const order: (number | null)[] = [];

  for (let s = 0; s < sheetsCount; s++) {
    // Front side (parts columns, left to right)
    for (let c = 0; c < parts; c++) {
      const pairIndex = c * sheetsCount + s;
      const frontPage = pairIndex * 2;
      if (frontPage < numPages) {
        order.push(frontPage);
      } else {
        order.push(null); // Automatic blank
      }
    }

    // Back side (parts columns, reversed right to left so backs align with fronts)
    for (let c = 0; c < parts; c++) {
      const frontCol = parts - 1 - c;
      const pairIndex = frontCol * sheetsCount + s;
      const backPage = pairIndex * 2 + 1;
      if (backPage < numPages) {
        order.push(backPage);
      } else {
        order.push(null); // Automatic blank
      }
    }
  }

  return order;
}

/**
 * Creates a new aligned PDF with pages in the calculated order.
 */
export async function buildAlignedPdf(
  pdfBytes: ArrayBuffer,
  order: (number | null)[]
): Promise<PDFDocument> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();

  // Get default dimensions from page 0
  const firstPage = srcDoc.getPage(0);
  const defaultWidth = firstPage ? firstPage.getWidth() : 600;
  const defaultHeight = firstPage ? firstPage.getHeight() : 200;

  for (const pageIdx of order) {
    if (pageIdx === null) {
      // Insert blank page matching dimensions
      newDoc.addPage([defaultWidth, defaultHeight]);
    } else {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [pageIdx]);
      newDoc.addPage(copiedPage);
    }
  }

  return newDoc;
}

/**
 * Checks if any page in the PDF exceeds the sheet dimensions.
 */
export async function findOversizedPage(
  pdfDoc: any,
  paperSize: PaperSizeKey,
  orientation: OrientationMode
): Promise<OversizedIssue | null> {
  if (!pdfDoc || !pdfDoc.numPages) return null;

  // Determine sheet dimensions from first page aspect
  const p1 = await pdfDoc.getPage(1);
  const vp1 = p1.getViewport({ scale: 1.0 });
  const firstAspect = vp1.width / vp1.height;
  const sheet = getSheetDimensions(paperSize, orientation, firstAspect);

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale: 1.0 });
    const pw = vp.width;
    const ph = vp.height;

    // Tolerance of 1 point
    if (pw > sheet.width + 1 || ph > sheet.height + 1) {
      return {
        page: i,
        pageW: pw,
        pageH: ph,
        pageWmm: pw / MM_PT,
        pageHmm: ph / MM_PT,
        sheetName: paperSize,
        sheetW: sheet.width,
        sheetH: sheet.height,
        sheetWmm: sheet.width / MM_PT,
        sheetHmm: sheet.height / MM_PT,
      };
    }
  }

  return null;
}

/**
 * Generates the vertical layout sheet plan.
 * Arranges pages vertically with 0 mm margins and 0 mm gaps,
 * centered as a group on each sheet.
 */
export async function makePlan(
  pdfDoc: any,
  paperSize: PaperSizeKey,
  orientation: OrientationMode,
  approved: boolean
): Promise<{ ok: boolean; plan: PrintSheetPlan[] }> {
  if (!pdfDoc || !pdfDoc.numPages) {
    return { ok: false, plan: [] };
  }

  const p1 = await pdfDoc.getPage(1);
  const vp1 = p1.getViewport({ scale: 1.0 });
  const firstAspect = vp1.width / vp1.height;
  const sheet = getSheetDimensions(paperSize, orientation, firstAspect);

  // Preload all page viewports
  interface PageMeta {
    origW: number;
    origH: number;
    renderW: number;
    renderH: number;
    scaled: boolean;
  }

  const pageMetas: PageMeta[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const vp = page.getViewport({ scale: 1.0 });
    const origW = vp.width;
    const origH = vp.height;

    let scale = 1.0;
    let scaled = false;

    if (origW > sheet.width || origH > sheet.height) {
      if (approved) {
        scale = Math.min(sheet.width / origW, sheet.height / origH);
        scaled = true;
      }
    }

    pageMetas.push({
      origW,
      origH,
      renderW: origW * scale,
      renderH: origH * scale,
      scaled,
    });
  }

  // Pack pages vertically on sheets (0 mm margin, 0 mm gap)
  const plans: PrintSheetPlan[] = [];
  let currentPageIdx = 0;
  let currentSheetIdx = 0;

  while (currentPageIdx < pageMetas.length) {
    const currentSheetItems: PrintItemPlan[] = [];
    let currentHeight = 0;

    while (currentPageIdx < pageMetas.length) {
      const meta = pageMetas[currentPageIdx];
      // Check if this page fits vertically on current sheet
      if (
        currentSheetItems.length > 0 &&
        currentHeight + meta.renderH > sheet.height
      ) {
        break; // Sheet full
      }

      currentSheetItems.push({
        pageIndex: currentPageIdx,
        origW: meta.origW,
        origH: meta.origH,
        renderW: meta.renderW,
        renderH: meta.renderH,
        x: 0, // Calculated after packing to center group
        y: 0,
        scaled: meta.scaled,
      });

      currentHeight += meta.renderH;
      currentPageIdx++;
    }

    // Now calculate centered positions for items on this sheet
    // Group is centered vertically: startY = (sheet.height - currentHeight) / 2
    // In PDF coordinate system, (0,0) is bottom-left.
    const startY = (sheet.height - currentHeight) / 2;
    let runningYFromTop = sheet.height - startY;

    for (const item of currentSheetItems) {
      // Top-to-bottom placement
      const top = runningYFromTop;
      const bottom = top - item.renderH;
      const x = (sheet.width - item.renderW) / 2; // Center horizontally

      item.x = x;
      item.y = bottom;

      runningYFromTop = bottom; // 0 mm gap between items
    }

    // Cutting strokes on sheet intervals: 1, 51, 101, 151... (0-indexed: % 50 === 0)
    const drawCutMarks = currentSheetIdx % 50 === 0;

    plans.push({
      sheetIndex: currentSheetIdx,
      width: sheet.width,
      height: sheet.height,
      items: currentSheetItems,
      drawCutMarks,
    });

    currentSheetIdx++;
  }

  return { ok: true, plan: plans };
}

/**
 * Builds the production printing PDF with vertical page stacking,
 * 0 mm gaps, centered groups, and 0.15 mm cutting strokes.
 */
export async function buildPrintPdf(
  pdfBytes: ArrayBuffer,
  plan: PrintSheetPlan[]
): Promise<PDFDocument> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const outDoc = await PDFDocument.create();

  // 0.15 mm cut stroke width in points
  const cutStrokeWidth = 0.15 * MM_PT; // ~0.425 pt
  const strokeColor = rgb(0.4, 0.4, 0.4);

  // Pre-embed all pages from srcDoc
  const totalPages = srcDoc.getPageCount();
  const pageIndicesToEmbed = Array.from({ length: totalPages }, (_, i) => i);
  const embeddedPages = await outDoc.embedPdf(srcDoc, pageIndicesToEmbed);

  for (const sheet of plan) {
    const page = outDoc.addPage([sheet.width, sheet.height]);

    for (const item of sheet.items) {
      const embedded = embeddedPages[item.pageIndex];
      if (embedded) {
        page.drawPage(embedded, {
          x: item.x,
          y: item.y,
          width: item.renderW,
          height: item.renderH,
        });

        // Draw 0.15 mm cutting stroke on designated intervals
        if (sheet.drawCutMarks) {
          page.drawRectangle({
            x: item.x,
            y: item.y,
            width: item.renderW,
            height: item.renderH,
            borderWidth: cutStrokeWidth,
            borderColor: strokeColor,
          });
        }
      }
    }
  }

  return outDoc;
}
