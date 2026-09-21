import React from 'react';
import { Layers, Printer, CheckCircle2, ArrowRight } from 'lucide-react';
import { ToolMode } from '../types';

interface ToolChoiceViewProps {
  onSelectMode: (mode: ToolMode) => void;
}

export const ToolChoiceView: React.FC<ToolChoiceViewProps> = ({ onSelectMode }) => {
  return (
    <div className="py-8 sm:py-12">
      {/* Workspace Headline */}
      <div className="text-center max-w-2xl mx-auto mb-10 px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-100 tracking-tight">
          Select Your PDF Workflow
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
          Prepare, impose, and format traditional Tibetan Pecha manuscripts with mathematical precision. 
          Everything processes locally in your browser for absolute data confidentiality.
        </p>
      </div>

      {/* Main Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {/* Tool 1: Page Alignment */}
        <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition" />
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                Duplex Imposition
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-6 group-hover:text-blue-300 transition">
              Page Alignment
            </h2>

            <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Supports 2, 3, 4, 5, and 6 consecutive parts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Automatic blank slot placement for physical sheets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Interactive high-resolution preview with zoom inspection</span>
              </li>
            </ul>
          </div>

          <button
            id="openAlignment"
            onClick={() => onSelectMode('alignment')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            <span>Open Page Alignment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tool 2: Printing Layout */}
        <div className="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 shadow-xl hover:shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition" />
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Sheet Press Layout
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-6 group-hover:text-emerald-300 transition">
              Printing Layout
            </h2>

            <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standard paper formats: A4, A3, and B4 sheets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>0.15 mm cutting strokes on sheets 1, 51, 101, 151...</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Smart proportional scaling detection with dialog confirmation</span>
              </li>
            </ul>
          </div>

          <button
            id="openPrinting"
            onClick={() => onSelectMode('printing')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/25 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <span>Open Printing Layout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
