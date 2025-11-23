
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

export type Theme = 'light' | 'dark' | 'midnight';

interface ConfigContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// CSS Variable mappings for themes to override Tailwind config
const themes = {
  light: {
    '--primary-50': '#eff6ff',
    '--primary-100': '#dbeafe',
    '--primary-500': '#3b82f6',
    '--primary-600': '#2563eb',
    '--primary-700': '#1d4ed8',
    '--primary-900': '#1e3a8a',
    '--bg-main': '#f8fafc', // slate-50
    '--bg-secondary': '#f1f5f9', // slate-100
    '--bg-card': '#ffffff', // white
    '--border-color': '#e2e8f0', // slate-200
    '--text-main': '#334155', // slate-700
    '--text-strong': '#0f172a', // slate-900
    '--text-muted': '#64748b', // slate-500
    '--text-inverted': '#ffffff',
  },
  dark: {
    '--primary-50': '#1e293b',
    '--primary-100': '#334155',
    '--primary-500': '#60a5fa',
    '--primary-600': '#3b82f6',
    '--primary-700': '#2563eb',
    '--primary-900': '#1d4ed8',
    '--bg-main': '#0f172a', // slate-900
    '--bg-secondary': '#1e293b', // slate-800
    '--bg-card': '#1e293b', // slate-800
    '--border-color': '#334155', // slate-700
    '--text-main': '#cbd5e1', // slate-300
    '--text-strong': '#f8fafc', // slate-50
    '--text-muted': '#94a3b8', // slate-400
    '--text-inverted': '#0f172a',
  },
  midnight: {
    '--primary-50': '#0f172a',
    '--primary-100': '#1e293b',
    '--primary-500': '#10b981', // Emerald
    '--primary-600': '#059669',
    '--primary-700': '#047857',
    '--primary-900': '#064e3b',
    '--bg-main': '#020617', // slate-950
    '--bg-secondary': '#0f172a', // slate-900
    '--bg-card': '#111827', // gray-900
    '--border-color': '#1e293b', // slate-800
    '--text-main': '#e2e8f0', // slate-200
    '--text-strong': '#f8fafc', // slate-50
    '--text-muted': '#64748b', // slate-500
    '--text-inverted': '#020617',
  }
};

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = document.documentElement;
    const themeVars = themes[theme];
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  const t = (key: keyof typeof translations['en']) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <ConfigContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};
