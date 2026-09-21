import React, { useState } from 'react';
import { ToolMode } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToolChoiceView } from './components/ToolChoiceView';
import { AlignmentView } from './components/AlignmentView';
import { PrintingView } from './components/PrintingView';
import { PagePreviewModal } from './components/PagePreviewModal';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ToolMode>('choice');
  const [zoomModal, setZoomModal] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
  }>({
    isOpen: false,
    src: '',
    alt: '',
  });

  const handleOpenZoom = (src: string, alt: string) => {
    setZoomModal({
      isOpen: true,
      src,
      alt,
    });
  };

  const handleCloseZoom = () => {
    setZoomModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 font-sans">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-40 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Navigation Bar */}
        <Header currentMode={currentMode} onSelectMode={setCurrentMode} />

        {/* Main Content Area */}
        <main className="flex-1">
          {currentMode === 'choice' && (
            <ToolChoiceView onSelectMode={setCurrentMode} />
          )}

          {currentMode === 'alignment' && (
            <AlignmentView
              onBack={() => setCurrentMode('choice')}
              onOpenZoom={handleOpenZoom}
            />
          )}

          {currentMode === 'printing' && (
            <PrintingView
              onBack={() => setCurrentMode('choice')}
              onOpenZoom={handleOpenZoom}
            />
          )}
        </main>

        {/* Studio Footer */}
        <Footer />
      </div>

      {/* Global Image Zoom Inspection Modal */}
      <PagePreviewModal
        isOpen={zoomModal.isOpen}
        src={zoomModal.src}
        alt={zoomModal.alt}
        onClose={handleCloseZoom}
      />
    </div>
  );
}
