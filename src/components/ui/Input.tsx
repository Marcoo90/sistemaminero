"use client";

import React from 'react';


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    startIcon?: React.ElementType<{ size: number; className: string }>;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className, fullWidth, startIcon: StartIcon, ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label className="block text-sm font-medium text-slate-500 mb-1.5 pl-0.5">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative group">
                    {StartIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                            <StartIcon size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            flex h-10 w-full rounded-md border border-border bg-card px-3.5 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-blue-500/50 focus-visible:ring-4 focus-visible:ring-blue-500/5 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-900/50
                            text-foreground
                            transition-all duration-200
                            ${StartIcon ? 'pl-10' : ''}
                            ${error ? 'border-red-500 focus-visible:ring-red-500/5 focus-visible:border-red-500' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500 font-medium pl-1 flex items-center gap-1">
                    <span className="text-lg">⚠</span>{error}
                </p>}
                {helperText && !error && <p className="mt-1.5 text-xs text-muted-foreground pl-1">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
