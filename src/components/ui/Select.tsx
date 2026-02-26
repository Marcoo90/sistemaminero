"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    helperText?: string;
    options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    helperText,
    fullWidth = false,
    options,
    className = '',
    id,
    ...props
}) => {
    const reactId = React.useId();
    const selectId = id || props.name || reactId;

    return (
        <div className={`${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-slate-500 mb-1.5 pl-0.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative group">
                <select
                    id={selectId}
                    className={`
                        w-full h-10 py-2 pl-3.5 pr-10 rounded-md text-sm
                        bg-card border border-border text-foreground
                        focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5
                        disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary/30
                        appearance-none cursor-pointer
                        transition-all duration-200
                        ${error ? 'border-red-500 focus:ring-red-500/5 focus:border-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                >
                    <option value="" className="bg-card text-slate-500">Seleccione una opción</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={18}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors"
                />
            </div>
            {error && (
                <p className="mt-1.5 text-xs text-red-500 font-medium pl-1 flex items-center gap-1">
                    <span className="text-lg">⚠</span>{error}
                </p>
            )}
            {helperText && !error && <p className="mt-1.5 text-xs text-slate-500 pl-1">{helperText}</p>}
        </div>
    );
};
