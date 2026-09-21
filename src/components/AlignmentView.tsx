import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { PartCount, StatusState } from '../types';
import { buildOrder, buildAlignedPdf } from '../utils/pechaLogic';
import { loadPdfDocument, renderPdfPageToDataUrl } from '../utils/pdfHelper';

interface AlignmentViewProps {
  onBack: () => void;
  onOpenZoom: (src: string, alt: string) => void;
}

interface PreviewItem {
  index: number;
  originalIndex: number | null;
  imgUrl: string;
  altText: string;
}

export const AlignmentView: React.FC<AlignmentViewProps> = ({ onBack, onOpenZoom }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [parts, setParts] = useState<PartCount>(2);
  const [status, setStatus] = useState<StatusState>({
    text: '',
    type: '',
  });
  const [orderArray, setOrderArray] = useState<(number | null)[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    setPreviewItems([]);
    setOrderArray([]);
    setIsLoading(true);
    setStatus({
      text: 'Reading and parsing PDF structure...',
      type: 'loading',
    });

    try {
      const doc = await loadPdfDocument(selectedFile);
      setPdfDoc(doc);
      setStatus({
        text: `${doc.numPages} pages successfully loaded. Choose alignment parts (2 to 6) and click Preview.`,
        type: 'ok',
      });
    } catch (err: any) {
      console.error(err);
      setPdfDoc(null);
      setStatus({
        text: 'Could not parse this PDF. Please verify the file is not corrupted or password-protected.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartChange = (n: PartCount) => {
    setParts(n);
    setPreviewItems([]);
    setOrderArray([]);
  };

  const handleCreatePreview = async () => {
    if (!pdfDoc) {
      setStatus({
        text: 'Please upload a PDF document first.',
        type: 'error',
      });
      return;
    }

    setIsPreviewing(true);
    setPreviewItems([]);
    setStatus({
      text: 'Generating page imposition preview...',
      type: 'loading',
    });

    try {
      const reordered = buildOrder(pdfDoc.numPages, parts);
      setOrderArray(reordered);

      const items: PreviewItem[] = [];
      const blankSvg =
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#ffffff"/><rect x="4" y="4" width="592" height="392" fill="none" stroke="#cbd5e1" stroke-dasharray="8 6"/><text x="300" y="205" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="#94a3b8">BLANK POSITION</text></svg>`
        );

      for (let i = 0; i < reordered.length; i++) {
        const origIndex = reordered[i];
        if (origIndex === null) {
          items.push({
            index: i,
            originalIndex: null,
            imgUrl: blankSvg,
            altText: `Automatic Blank Position ${i + 1}`,
          });
        } else {
          const img = await renderPdfPageToDataUrl(pdfDoc, origIndex);
          items.push({
            index: i,
            originalIndex: origIndex,
            imgUrl: img,
            altText: `New Page ${i + 1} (Original ${origIndex + 1})`,
          });
        }
      }

      setPreviewItems(items);
      setStatus({
        text: `Preview ready (${items.length} total output slots generated). You can now download the aligned PDF.`,
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setStatus({
        text: 'Failed to generate preview. Please try again.',
        type: 'error',
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !orderArray.length) return;

    setIsDownloading(true);
    setStatus({
      text: 'Building high-precision aligned PDF...',
      type: 'loading',
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDocBuilt = await buildAlignedPdf(arrayBuffer, orderArray);
      const bytes = await pdfDocBuilt.save({ useObjectStreams: false });

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = file.name.replace(/\.pdf$/i, '');
      a.href = url;
      a.download = `${baseName}_aligned_${parts}_parts.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setStatus({
        text: 'Aligned PDF successfully downloaded to your device.',
        type: 'ok',
      });
    } catch (err) {
      console.error(err);
      setStatus({
        text: 'Could not create the download file. Please try again.',
        type: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const partOptions: PartCount[] = [2, 3, 4, 5, 6];

  return (
    <div className="py-6 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Title & Description */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Pecha PDF Alignment
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Duplex Imposition
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Divide consecutive Pecha blocks into duplex page-pairs with alternating front/back positioning.
          </p>
        </div>

        <button
          id="alignmentBackBtn"
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
          id="dropZone"
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
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-700/80 hover:border-blue-500/60 bg-slate-950/50 hover:bg-slate-950/80'
          }`}
        >
          <input
            id="pdfInput"
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

          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <span className="font-bold text-slate-100 text-base sm:text-lg block">
            {file ? file.name : 'Choose Pecha PDF'}
          </span>
          <span id="fileName" className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md block">
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file`
              : 'Click to browse or drag and drop your PDF here'}
          </span>
        </div>

        {/* Controls (visible once file is chosen) */}
        {file && (
          <div id="controls" className="mt-6 pt-6 border-t border-slate-800/80">
            {/* Alignment Parts Selection */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                Select Consecutive Alignment Parts
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {partOptions.map((n) => (
                  <button
                    key={n}
                    id={
                      n === 2
                        ? 'twoBtn'
                        : n === 3
                        ? 'threeBtn'
                        : n === 4
                        ? 'fourBtn'
                        : n === 5
                        ? 'fiveBtn'
                        : 'sixBtn'
                    }
                    type="button"
                    onClick={() => handlePartChange(n)}
                    className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                      parts === n
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/20'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{n} Parts</span>
                    <span
                      className={`text-[10px] font-normal ${
                        parts === n ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {n === 2
                        ? 'Standard Duplex'
                        : n === 3
                        ? '3 Columns'
                        : n === 4
                        ? '4 Columns'
                        : n === 5
                        ? '5 Columns'
                        : '6 Columns'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="previewBtn"
                onClick={handleCreatePreview}
                disabled={!pdfDoc || isPreviewing}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Preview...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Preview Alignment</span>
                  </>
                )}
              </button>

              <button
                id="downloadBtn"
                onClick={handleDownload}
                disabled={!orderArray.length || isDownloading}
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Aligned PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Message Indicator */}
            {status.text && (
              <div
                id="status"
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

            {/* Mathematical Alignment Rule Notice */}
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
              <strong className="text-slate-300 font-semibold">Imposition Architecture:</strong> Pages are partitioned into consecutive parts while strictly maintaining duplex page-pairs (1/2, 3/4, 5/6...). Front positions follow standard left-to-right alignment; back positions are reversed right-to-left for precise physical alignment after cutting. Automatic blank positions are calculated only when a physical sheet slot remains unused.
            </p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewItems.length > 0 && (
        <div id="previewCard" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Imposition Sequence Preview</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {previewItems.length} Total Slots
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any page thumbnail to inspect in full resolution.
              </p>
            </div>
          </div>

          {/* Sequential Order Trail */}
          <div className="mb-5 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto">
            <span className="text-amber-400 font-bold mr-2">New Sequence:</span>
            <span id="orderText">
              {orderArray
                .map((idx) => (idx === null ? 'BLANK' : `${idx + 1}`))
                .join(' → ')}
            </span>
          </div>

          {/* Grid of Pages */}
          <div id="preview" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {previewItems.map((item) => (
              <div
                key={item.index}
                onClick={() => onOpenZoom(item.imgUrl, item.altText)}
                className="group relative bg-slate-950 border border-slate-800 hover:border-blue-500/60 rounded-xl p-2 text-center transition cursor-zoom-in flex flex-col justify-between"
              >
                {/* Page Number Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-white text-[10px] font-bold z-10 shadow">
                  #{item.index + 1}
                </div>

                {/* Inspect hover icon */}
                <div className="absolute top-3 right-3 p-1 rounded-md bg-slate-900/80 text-slate-400 opacity-0 group-hover:opacity-100 transition z-10">
                  <Maximize2 className="w-3 h-3" />
                </div>

                {/* Thumbnail */}
                <div className="w-full aspect-[16/10] bg-white rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center mb-2">
                  <img
                    src={item.imgUrl}
                    alt={item.altText}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Page Labels */}
                <div className="pt-1">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    New Page {item.index + 1}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {item.originalIndex === null ? (
                      <span className="text-amber-400/90 font-medium">Automatic Blank</span>
                    ) : (
                      `Original Page ${item.originalIndex + 1}`
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
