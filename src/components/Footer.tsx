import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/60 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center text-xs text-slate-500">
        {/* Preserved author attribution */}
        <span className="text-slate-400 font-medium">By མོས་གུས།</span>
      </div>
    </footer>
  );
};
