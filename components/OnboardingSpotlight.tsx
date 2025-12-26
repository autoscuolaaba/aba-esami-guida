import React, { useEffect, useState } from 'react';

interface SpotlightPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OnboardingSpotlightProps {
  targetSelector?: string;
  hint?: string;
  active: boolean;
}

const OnboardingSpotlight: React.FC<OnboardingSpotlightProps> = ({
  targetSelector,
  hint,
  active
}) => {
  const [position, setPosition] = useState<SpotlightPosition | null>(null);

  useEffect(() => {
    if (!active || !targetSelector) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2
        });
      }
    };

    updatePosition();

    // Update on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    // Also update periodically in case of layout changes
    const interval = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearInterval(interval);
    };
  }, [targetSelector, active]);

  if (!active || !position) return null;

  const radiusX = position.width / 2 + 20;
  const radiusY = position.height / 2 + 20;

  return (
    <div className="fixed inset-0 z-[98] pointer-events-none">
      {/* Dark overlay with spotlight hole */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={{
          maskImage: `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${position.x}px ${position.y}px, transparent 70%, black 100%)`,
          WebkitMaskImage: `radial-gradient(ellipse ${radiusX}px ${radiusY}px at ${position.x}px ${position.y}px, transparent 70%, black 100%)`
        }}
      />

      {/* Pulsing ring around target */}
      <div
        className="absolute border-2 border-blue-400 rounded-xl animate-pulse pointer-events-none"
        style={{
          left: position.x - radiusX + 10,
          top: position.y - radiusY + 10,
          width: (radiusX - 10) * 2,
          height: (radiusY - 10) * 2,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)'
        }}
      />

      {/* Hint tooltip */}
      {hint && (
        <div
          className="absolute bg-white rounded-xl px-4 py-2 shadow-xl max-w-[200px] pointer-events-none animate-bounce"
          style={{
            left: Math.min(position.x - 100, window.innerWidth - 220),
            top: position.y + radiusY + 15,
            transform: 'translateX(0)'
          }}
        >
          {/* Arrow pointing up */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"
          />
          <p className="text-sm font-medium text-gray-700 text-center">{hint}</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingSpotlight;
