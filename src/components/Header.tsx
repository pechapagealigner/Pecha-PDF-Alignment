import React from 'react';
import { Layers, Printer, ShieldCheck, ArrowLeft } from 'lucide-react';
import { ToolMode } from '../types';
import { PECHA_LOGO_DATA_URL } from '../logo';

interface HeaderProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSelectMode }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo Area */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onSelectMode('choice')}
            className="group flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded-xl p-1 -m-1 transition"
            title="Return to Tool Selection"
          >
            {/* Pecha brand logo */}
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900/90 border border-slate-700/60 shadow-sm group-hover:border-amber-500/50 transition overflow-hidden">
              <img
                src={PECHA_LOGO_DATA_URL}
                alt="Pecha logo"
                className="h-9 w-9 object-contain rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base sm:text-lg tracking-tight font-sans">
                  Pecha Aligner
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tibetan Text Imposition &amp; Print Engine
              </p>
            </div>
          </button>
        </div>

        {/* Navigation & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentMode !== 'choice' && (
            <button
              onClick={() => onSelectMode('choice')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to</span> Tools
            </button>
          )}

          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
            <button
              onClick={() => onSelectMode('alignment')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition ${
                currentMode === 'alignment'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Alignment</span>
            </button>
            <button
              onClick={() => onSelectMode('printing')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition ${
                currentMode === 'printing'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printing Layout</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% In-Browser</span>
          </div>
        </div>
      </div>
    </header>
  );
};
