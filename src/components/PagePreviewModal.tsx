import React, { useEffect } from 'react';
import { X, ZoomOut } from 'lucide-react';

interface PagePreviewModalProps {
  isOpen: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  isOpen,
  src,
  alt,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return (
    <div
      id="pagePreviewModal"
      aria-hidden={!isOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onDoubleClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        type="button"
        title="Close Preview (ESC)"
        className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition z-50 shadow-lg cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Stage */}
      <div
        id="pagePreviewStage"
        onClick={onClose}
        className="max-w-[94vw] max-h-[90vh] flex items-center justify-center cursor-zoom-out"
      >
        <img
          id="pagePreviewImage"
          src={src}
          alt={alt || 'Enlarged preview'}
          className="max-w-[94vw] max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-700/80 bg-white"
        />
      </div>

      {/* Floating Hint */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-medium text-slate-300 pointer-events-none shadow-md">
        <ZoomOut className="w-3 h-3 text-slate-400" />
        <span>Click anywhere or press ESC to close</span>
      </div>
    </div>
  );
};
