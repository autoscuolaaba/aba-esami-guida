import React, { useMemo } from 'react';
import { SeasonalTheme } from '../themes';

interface ThemeDecorationsProps {
  theme: SeasonalTheme;
}

// Generate random positions once to avoid re-rendering issues
const generatePositions = (count: number) => {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
    size: 10 + Math.random() * 15
  }));
};

const ThemeDecorations: React.FC<ThemeDecorationsProps> = ({ theme }) => {
  // Memoize random positions to prevent re-generation on each render
  const snowflakePositions = useMemo(() => generatePositions(20), []);
  const petalPositions = useMemo(() => generatePositions(15), []);
  const batPositions = useMemo(() => [0, 1, 2, 3, 4].map(i => ({
    left: 10 + i * 20,
    top: 10 + Math.random() * 20,
    delay: i * 0.5
  })), []);

  switch (theme) {
    case 'christmas':
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Fiocchi di neve */}
          {snowflakePositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-white/60 animate-fall"
              style={{
                left: `${pos.left}%`,
                animationDelay: `${pos.delay}s`,
                animationDuration: `${pos.duration}s`,
                fontSize: `${pos.size}px`
              }}
            >
              ❄
            </div>
          ))}
          {/* Lucine in alto */}
          <div className="absolute top-0 left-0 right-0 h-2 flex">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 animate-twinkle"
                style={{
                  backgroundColor: ['#ff0000', '#00ff00', '#ffff00', '#0000ff'][i % 4],
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'summer':
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Sole in alto a destra */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30 blur-xl" />
          {/* Onde in basso */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-200/30 to-transparent" />
        </div>
      );

    case 'halloween':
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Pipistrelli */}
          {batPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-float-bat"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${pos.delay}s`
              }}
            >
              🦇
            </div>
          ))}
          {/* Nebbia in basso */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/20 to-transparent" />
        </div>
      );

    case 'spring':
      return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          {/* Petali */}
          {petalPositions.map((pos, i) => (
            <div
              key={i}
              className="absolute animate-fall-slow"
              style={{
                left: `${pos.left}%`,
                animationDelay: `${pos.delay * 1.6}s`,
                animationDuration: `${8 + pos.duration}s`,
              }}
            >
              🌸
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};

export default ThemeDecorations;
