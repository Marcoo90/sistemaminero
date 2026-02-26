"use client";

import React from 'react';

interface BadgeProps {
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    size = 'md',
    children,
    className = ''
}) => {
    const variants = {
        default: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        primary: 'bg-blue-600/10 text-blue-600 border-blue-600/20 shadow-sm shadow-blue-900/5',
        secondary: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
        success: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20 shadow-sm shadow-emerald-900/5',
        warning: 'bg-amber-600/10 text-amber-600 border-amber-600/20 shadow-sm shadow-amber-900/5',
        danger: 'bg-red-600/10 text-red-600 border-red-600/20 shadow-sm shadow-red-900/5',
        info: 'bg-sky-600/10 text-sky-600 border-sky-600/20 shadow-sm shadow-sky-900/5'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-[9px] font-black leading-none uppercase tracking-widest',
        md: 'px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em]',
        lg: 'px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em]'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 ${variants[variant]} ${sizes[size]} transition-all ${className} rounded-full border`}>
            {children}
        </span>
    );
};
