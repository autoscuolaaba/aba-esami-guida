import React from 'react';

export type SeasonalTheme = 'default' | 'christmas' | 'summer' | 'halloween' | 'spring';

export interface ThemeConfig {
  id: SeasonalTheme;
  name: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  availableMonths: number[]; // 0-11
}

export const themes: Record<SeasonalTheme, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Classico',
    emoji: '🎨',
    gradient: 'from-blue-50/50 to-transparent',
    accentColor: 'blue',
    availableMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  christmas: {
    id: 'christmas',
    name: 'Natale',
    emoji: '🎄',
    gradient: 'from-red-50/30 via-green-50/20 to-transparent',
    accentColor: 'red',
    availableMonths: [11, 0] // Dicembre, Gennaio
  },
  summer: {
    id: 'summer',
    name: 'Estate',
    emoji: '☀️',
    gradient: 'from-amber-50/40 via-orange-50/20 to-transparent',
    accentColor: 'amber',
    availableMonths: [5, 6, 7] // Giugno, Luglio, Agosto
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    gradient: 'from-orange-100/50 via-purple-50/30 to-transparent',
    accentColor: 'orange',
    availableMonths: [9] // Ottobre
  },
  spring: {
    id: 'spring',
    name: 'Primavera',
    emoji: '🌸',
    gradient: 'from-pink-50/40 via-green-50/20 to-transparent',
    accentColor: 'pink',
    availableMonths: [2, 3, 4] // Marzo, Aprile, Maggio
  }
};

export const getSeasonalTheme = (): SeasonalTheme => {
  const month = new Date().getMonth();

  for (const [themeId, config] of Object.entries(themes)) {
    if (themeId !== 'default' && config.availableMonths.includes(month)) {
      return themeId as SeasonalTheme;
    }
  }
  return 'default';
};

export const getAvailableThemes = (): ThemeConfig[] => {
  const currentMonth = new Date().getMonth();
  return Object.values(themes).filter(
    t => t.id === 'default' || t.availableMonths.includes(currentMonth)
  );
};
