import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scissors,
  Compass,
} from 'lucide-react';
import {
  PaperSizeKey,
  OrientationMode,
  StatusState,
  OversizedIssue,
  PrintSheetPlan,
} from '../types';
import {
  findOversizedPage,
  makePlan,
  buildPrintPdf,
} from '../utils/pechaLogic';
import { loadPdfDocument, renderPrintSheetPreview } from '../utils/pdfHelper';

interface PrintingViewProps {
  onBack: () => void;
  onOpenZoom: (src: string, alt: string) => void;
}

interface SheetPreviewItem {
  sheetIndex: number;
  imgUrl: string;
  count: number;
  fittedCount: number;
}

export const PrintingView: React.FC<PrintingViewProps> = ({ onBack, onOpenZoom }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [paperSize, setPaperSize] = useState<PaperSizeKey>('A4');
  const [orientation, setOrientation] = useState<OrientationMode>('auto');
  const [status, setStatus] = useState<StatusState>({ text: '', type: '' });
  const [sheetPlan, setSheetPlan] = useState<PrintSheetPlan[]>([]);
  const [sheetPreviews, setSheetPreviews] = useState<SheetPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Proportional fit modal state
  const [fitIssue, setFitIssue] = useState<OversizedIssue | null>(null);
  const [isFitModalOpen, setIsFitModalOpen] = useState(false);
  const [fitApproved, setFitApproved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      setStatus({
        text: 'Please select a valid PDF file.',
        type: 'error',
      });
      return;
    }

    setFile(selectedFile);
    setSheetPreviews([]);
    setSheetPlan([]);
    setFitApproved(false);
    setIsLoading(true);
    setStatus({
      text: 'Loading PDF document...',
      type: 'loading',
    });

    try {
      const doc = await loadPdfDocument(selectedFile);
      setPdfDoc(doc);
      setStatus({
        text: `${doc.numPages} pages loaded. Choose paper size and click Preview Layout.`,
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setPdfDoc(null);
      setStatus({
        text: 'Could not read this PDF. Please choose another PDF file.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPreviews = () => {
    setFitApproved(false);
    setSheetPreviews([]);
    setSheetPlan([]);
  };

  const executePreview = async (approved: boolean) => {
    if (!pdfDoc || !file) {
      setStatus({ text: 'Please choose a PDF first.', type: 'error' });
      return;
    }

    setIsPreviewing(true);
    setSheetPreviews([]);
    setStatus({ text: 'Analyzing page dimensions against sheet boundaries...', type: 'loading' });

    try {
      const oversized = await findOversizedPage(pdfDoc, paperSize, orientation);
      if (oversized && !approved) {
        setFitIssue(oversized);
        setIsFitModalOpen(true);
        setStatus({
          text: 'The selected sheet is smaller than the original Pecha page. Please choose Fit to Selected Sheet or Cancel.',
          type: 'error',
        });
        setIsPreviewing(false);
        return;
      }

      setStatus({ text: 'Composing vertical sheets with 0 mm gap...', type: 'loading' });
      const planRes = await makePlan(pdfDoc, paperSize, orientation, approved);

      if (!planRes.ok || !planRes.plan.length) {
        throw new Error('Failed to generate sheet plan');
      }

      setSheetPlan(planRes.plan);

      const arrayBuffer = await file.arrayBuffer();
      const printDoc = await buildPrintPdf(arrayBuffer, planRes.plan);
      const printBytes = await printDoc.save({ useObjectStreams: false });

      // Render thumbnails for preview
      const previewPdfJs = await loadPdfDocument(
        new File([printBytes as any], 'preview.pdf', { type: 'application/pdf' })
      );

      const limit = Math.min(previewPdfJs.numPages, 12);
      const previews: SheetPreviewItem[] = [];

      for (let i = 0; i < limit; i++) {
        const img = await renderPrintSheetPreview(previewPdfJs, i + 1, 0.48);
        const count = planRes.plan[i]?.items?.length || 0;
        const fittedCount = planRes.plan[i]?.items?.filter((item) => item.scaled).length || 0;
        previews.push({
          sheetIndex: i,
          imgUrl: img,
          count,
          fittedCount,
        });
      }

      setSheetPreviews(previews);

      const totalFitted = planRes.plan.reduce(
        (acc, s) => acc + s.items.filter((item) => item.scaled).length,
        0
      );

      setStatus({
        text: `Preview ready: ${planRes.plan.length} sheet${
          planRes.plan.length === 1 ? '' : 's'
        } created.${
          totalFitted
            ? ` ${totalFitted} oversized page${
                totalFitted === 1 ? ' was' : 's were'
              } proportionally fitted to ${paperSize}.`
            : ''
        }`,
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setStatus({
        text: 'Could not create the printing layout preview. Please try again.',
        type: 'error',
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePreviewClick = () => {
    setFitApproved(false);
    executePreview(false);
  };

  const handleFitConfirm = async () => {
    setIsFitModalOpen(false);
    setFitApproved(true);
    await executePreview(true);
  };

  const handleFitCancel = () => {
    setIsFitModalOpen(false);
    setFitApproved(false);
    setSheetPreviews([]);
    setStatus({
      text: 'Cancelled. The original page was not resized and no printing PDF was created.',
      type: 'error',
    });
  };

  const handleDownload = async () => {
    if (!file || !pdfDoc) return;

    setIsDownloading(true);
    setStatus({ text: 'Generating production print-ready PDF...', type: 'loading' });

    try {
      const oversized = await findOversizedPage(pdfDoc, paperSize, orientation);
      if (oversized && !fitApproved) {
        setFitIssue(oversized);
        setIsFitModalOpen(true);
        setStatus({
          text: 'Please confirm whether to fit oversized pages to selected sheet.',
          type: 'error',
        });
        setIsDownloading(false);
        return;
      }

      const planRes = await makePlan(pdfDoc, paperSize, orientation, fitApproved);
      if (!planRes.ok || !planRes.plan.length) throw new Error('Could not calculate sheet plan');

      const arrayBuffer = await file.arrayBuffer();
      const printDoc = await buildPrintPdf(arrayBuffer, planRes.plan);
      const bytes = await printDoc.save({ useObjectStreams: false });

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = file.name.replace(/\.pdf$/i, '');
      a.href = url;
      a.download = `${baseName}_printing_${paperSize}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      const totalFitted = planRes.plan.reduce(
        (acc, s) => acc + s.items.filter((item) => item.scaled).length,
        0
      );

      setStatus({
        text: `Printing PDF downloaded successfully (${planRes.plan.length} sheets).${
          totalFitted ? ` ${totalFitted} pages proportionally fitted.` : ''
        }`,
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setStatus({
        text: 'Could not create the printing PDF. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const paperSizesList: { key: PaperSizeKey; label: string; dimensions: string }[] = [
    { key: 'A4', label: 'A4 Paper', dimensions: '210 × 297 mm' },
    { key: 'A3', label: 'A3 Paper', dimensions: '297 × 420 mm' },
    { key: 'B4', label: 'B4 Paper', dimensions: '250 × 353 mm' },
  ];

  return (
    <div className="py-6 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Title & Description */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Printing Layout
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sheet Press
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Stack and center complete Pecha pages vertically on printable sheets with 0 mm gap and cutting strokes.
          </p>
        </div>

        <button
          id="printBackBtn"
          onClick={onBack}
          type="button"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tools</span>
        </button>
      </div>

      {/* Main Upload Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl backdrop-blur-md mb-6">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition flex flex-col items-center justify-center ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-950/20'
              : 'border-slate-700/80 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-950/80'
          }`}
        >
          <input
            id="printPdfInput"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <span className="font-bold text-slate-100 text-base sm:text-lg block">
            {file ? file.name : 'Choose Pecha PDF'}
          </span>
          <span id="printFileName" className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md block">
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file`
              : 'Click to browse or drag and drop your PDF here'}
          </span>
        </div>

        {/* Controls (visible once file is chosen) */}
        {file && (
          <div id="printControls" className="mt-6 pt-6 border-t border-slate-800/80">
            {/* Paper Size & Orientation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Paper Format */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Paper Format
                </label>
                <div className="grid grid-cols-3 gap-2.5 print-options">
                  {paperSizesList.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      data-size={item.key}
                      onClick={() => {
                        setPaperSize(item.key);
                        resetPreviews();
                      }}
                      className={`print-size py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                        paperSize === item.key
                          ? 'active bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/20'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{item.key}</span>
                      <span
                        className={`text-[10px] font-normal ${
                          paperSize === item.key ? 'text-emerald-100' : 'text-slate-500'
                        }`}
                      >
                        {item.dimensions}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Orientation */}
              <div>
                <label
                  htmlFor="printOrientation"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2"
                >
                  Sheet Orientation
                </label>
                <div className="relative">
                  <select
                    id="printOrientation"
                    value={orientation}
                    onChange={(e) => {
                      setOrientation(e.target.value as OrientationMode);
                      resetPreviews();
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="auto">Auto (match Pecha page aspect ratio)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                  <Compass className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="printPreviewBtn"
                onClick={handlePreviewClick}
                disabled={!pdfDoc || isPreviewing}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Sheets...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Preview Layout</span>
                  </>
                )}
              </button>

              <button
                id="printDownloadBtn"
                onClick={handleDownload}
                disabled={!sheetPlan.length || isDownloading}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Print PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Message */}
            {status.text && (
              <div
                id="printStatus"
                className={`mt-4 p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  status.type === 'ok'
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                    : status.type === 'error'
                    ? 'bg-red-950/40 text-red-300 border-red-800/40'
                    : status.type === 'loading'
                    ? 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {status.type === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-400" />
                ) : status.type === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : status.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                ) : null}
                <span>{status.text}</span>
              </div>
            )}

            {/* Printing Layout Rules Notice */}
            <div className="mt-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Physical Press Specifications:</span>
              </div>
              <p>
                Pages are positioned vertically with <strong>0 mm margin</strong> and <strong>0 mm gap</strong>. The entire group of pages is vertically and horizontally centered on each sheet.
              </p>
              <p>
                A precise <strong>0.15 mm cutting stroke</strong> is automatically drawn around every Pecha page on sheet intervals <strong>1, 51, 101, 151, 201...</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Preview Grid */}
      {sheetPreviews.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Print Sheet Previews</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  {sheetPlan.length} Total Sheet{sheetPlan.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each sheet displays vertical Pecha placement centered with zero margins.
              </p>
            </div>
          </div>

          <div id="printPreview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sheetPreviews.map((sheet) => {
              const isCutMarkSheet = sheet.sheetIndex % 50 === 0;
              return (
                <div
                  key={sheet.sheetIndex}
                  onClick={() =>
                    onOpenZoom(
                      sheet.imgUrl,
                      `Sheet ${sheet.sheetIndex + 1} (${paperSize})`
                    )
                  }
                  className="group relative bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3 text-center transition cursor-zoom-in flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                      Sheet {sheet.sheetIndex + 1} of {sheetPlan.length}
                    </span>
                    {isCutMarkSheet && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Scissors className="w-2.5 h-2.5" />
                        <span>0.15mm Cut Stroke</span>
                      </span>
                    )}
                  </div>

                  <div className="w-full aspect-[4/3] bg-white rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-2 mb-2">
                    <img
                      src={sheet.imgUrl}
                      alt={`Sheet ${sheet.sheetIndex + 1}`}
                      className="max-h-full max-w-full object-contain shadow-sm"
                      loading="lazy"
                    />
                  </div>

                  <div className="text-left pt-1">
                    <div className="text-xs font-bold text-slate-200">
                      {paperSize} Sheet Layout
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {sheet.count} Pecha page{sheet.count === 1 ? '' : 's'} stacked vertically
                      {sheet.fittedCount > 0 && (
                        <span className="text-amber-400 block text-[10px]">
                          • Proportional scaling applied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {sheetPlan.length > 12 && (
            <div className="mt-5 p-3 rounded-xl bg-slate-950 text-center text-xs text-slate-400 border border-slate-800">
              Preview displays the first 12 sheets for rapid rendering. All {sheetPlan.length} sheets are included in the downloaded PDF.
            </div>
          )}
        </div>
      )}

      {/* Proportional Fit Warning Modal Dialog */}
      {isFitModalOpen && fitIssue && (
        <div
          id="printFitModal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div
            id="printFitDialog"
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 id="printFitTitle" className="text-lg font-bold text-slate-100 mb-2">
              Original Page Is Larger Than Selected Sheet
            </h3>

            <div
              id="printFitMessage"
              className="text-xs text-slate-300 space-y-2 mb-6 bg-slate-950/70 p-4 rounded-xl border border-slate-800"
            >
              <p>
                <strong className="text-amber-400">Original Page {fitIssue.page}</strong> exceeds the dimensions of the selected{' '}
                <strong>
                  {fitIssue.sheetName} ({fitIssue.sheetW > fitIssue.sheetH ? 'Landscape' : 'Portrait'})
                </strong>{' '}
                sheet.
              </p>
              <div className="font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div>Original page: {fitIssue.pageWmm.toFixed(1)} × {fitIssue.pageHmm.toFixed(1)} mm</div>
                <div>Selected sheet: {fitIssue.sheetWmm.toFixed(1)} × {fitIssue.sheetHmm.toFixed(1)} mm</div>
              </div>
              <p className="pt-2 text-slate-300">
                Do you want to <strong>proportionally fit</strong> this Pecha page to the selected sheet? Width and height will be scaled together without stretching.
              </p>
            </div>

            <div id="printFitButtons" className="grid grid-cols-2 gap-3">
              <button
                id="printFitCancel"
                type="button"
                onClick={handleFitCancel}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="printFitConfirm"
                type="button"
                onClick={handleFitConfirm}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                Fit to Selected Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
