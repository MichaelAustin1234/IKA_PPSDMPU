'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ika_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ika_theme', 'light');
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-xl transition-all duration-200 cursor-pointer opacity-70 ${
          showLabel
            ? 'px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            : 'p-2 rounded-xl text-slate-500 hover:bg-slate-100'
        } ${className}`}
        aria-label="Toggle Theme"
      >
        <Moon className="w-4 h-4 text-slate-400" />
        {showLabel && <span>Tema</span>}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl transition-all duration-200 cursor-pointer ${
        showLabel
          ? 'px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 shadow-2xs'
          : 'p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
      title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          {showLabel && <span>Mode Terang</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform hover:-rotate-12" />
          {showLabel && <span>Mode Gelap</span>}
        </>
      )}
    </button>
  );
}
