import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { SeasonalTheme, themes, getAvailableThemes } from '../themes';

interface ThemeSelectorProps {
  currentTheme: SeasonalTheme;
  onThemeChange: (theme: SeasonalTheme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableThemes = getAvailableThemes();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg hover:bg-white/50 transition-all"
        title="Cambia tema"
      >
        <span className="text-base">{themes[currentTheme].emoji}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay per chiudere */}
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setIsOpen(false)}
            onTouchEnd={(e) => { e.preventDefault(); setIsOpen(false); }}
          />

          {/* Dropdown */}
          <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[160px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">Tema</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            {availableThemes.map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 flex items-center gap-3 transition-colors
                  ${currentTheme === theme.id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'}
                `}
              >
                <span className="text-xl">{theme.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                {currentTheme === theme.id && (
                  <Check size={16} className="ml-auto text-green-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSelector;
