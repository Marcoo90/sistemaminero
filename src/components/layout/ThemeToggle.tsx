"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group overflow-hidden"
            aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
            <div className="relative w-5 h-5">
                <div className={`absolute inset-0 transition-transform duration-500 ease-spring ${theme === 'light' ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
                    <Sun size={20} strokeWidth={2.5} />
                </div>
                <div className={`absolute inset-0 transition-transform duration-500 ease-spring ${theme === 'dark' ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-8 opacity-0 rotate-12'}`}>
                    <Moon size={20} strokeWidth={2.5} />
                </div>
            </div>
        </button>
    );
}
