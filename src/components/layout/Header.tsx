"use client";

import React, { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const [searchActive, setSearchActive] = useState(false);

    const date = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="bg-background/80 backdrop-blur-md px-3 md:px-8 h-16 md:h-20 flex justify-between items-center sticky top-0 z-40 border-b border-border/60 shadow-sm/5">
            <div className="flex items-center gap-4 md:gap-8">
                <div className="hidden md:flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        <span>Sistema</span>
                        <span>/</span>
                        <span className="text-blue-600">Control Panel</span>
                    </div>
                    <h1 className="text-xl font-black text-foreground tracking-tighter">
                        Dashboard <span className="text-slate-500 font-medium">V3</span>
                    </h1>
                </div>
                <div className="md:hidden">
                    <h1 className="text-base font-black text-foreground tracking-tighter">
                        Miner<span className="text-blue-600">App</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Global Productivity Tools */}
                <div className={`relative hidden lg:flex items-center transition-all ${searchActive ? 'w-96' : 'w-64'}`}>
                    <div className="absolute left-4 text-slate-500">
                        <Search size={16} strokeWidth={3} />
                    </div>
                    <input
                        aria-label="Buscar en el sistema"
                        placeholder="Buscar flota, personal o reportes..."
                        type="text"
                        onFocus={() => setSearchActive(true)}
                        onBlur={() => setSearchActive(false)}
                        className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-transparent rounded-2xl text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/10 focus:bg-card transition-all"
                    />
                    <div className="absolute right-3 px-1.5 py-0.5 rounded border border-border bg-card text-[9px] font-black text-slate-500 group-focus-within:hidden">
                        ⌘K
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 pl-3 md:pl-6 border-l border-border">
                    <ThemeToggle />
                    <button
                        className="relative p-2 md:p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-600/10 rounded-xl transition-all group"
                        aria-label="Notificaciones"
                    >
                        <Bell size={18} strokeWidth={2.5} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card shadow-sm animate-pulse"></span>
                    </button>

                    <button
                        className="lg:hidden p-2 md:p-2.5 text-slate-500 bg-secondary rounded-xl"
                        aria-label="Abrir menú"
                        onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
                    >
                        <Menu size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </header>
    );
}
