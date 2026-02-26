"use client";

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline' | 'gradient';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    icon?: React.ElementType;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon: Icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 transition-all dark:bg-slate-800 dark:hover:bg-slate-700",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
        ghost: "text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors uppercase tracking-widest text-[10px] font-bold",
        outline: "border border-border bg-card text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        gradient: "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:opacity-90 transition-all"
    };

    const sizes = {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-5 py-2.5 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0 rounded-full"
    };

    return (
        <button
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : Icon ? (
                <Icon size={size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'lg' ? 22 : 20} className="-ml-0.5" />
            ) : null}
            {children}
        </button>
    );
};
