import React from 'react';

interface WhatsAppHeaderProps {
  children?: React.ReactNode;
}

const WhatsAppHeader: React.FC<WhatsAppHeaderProps> = ({ children }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-2 safe-area-top transition-all">
      <div className="max-w-md mx-auto">
        {/* Top row: Logo and Title */}
        <div className="flex items-center gap-4">
          {/* Logo ABA - Left */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-3xl font-black tracking-tighter text-red-600 leading-none" style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}>ABA</span>
            <span className="text-[0.65rem] font-light tracking-[0.18rem] text-gray-800 leading-none">AUTOSCUOLE</span>
          </div>

          {/* Title - Right */}
          <h1 className="text-xl font-bold text-gray-900">Prenota Esami Guida</h1>
        </div>

        {/* Additional content (utility buttons) */}
        {children && (
          <div className="mt-2 flex justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppHeader;
