import React from 'react';

interface CardProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    variant?: 'default' | 'premium' | 'gradient-border' | 'elevated';
    hover?: boolean;
    interactive?: boolean;
    onClick?: () => void;
}

export function Card({
    children,
    style,
    className = '',
    variant = 'default',
    hover = false,
    interactive = false,
    onClick
}: CardProps) {
    const variants = {
        default: 'bg-card border border-border shadow-sm rounded-xl',
        premium: 'bg-card border border-blue-500/20 shadow-sm rounded-xl transition-all hover:bg-slate-900/40',
        'gradient-border': 'bg-card border border-blue-500/30 shadow-sm rounded-xl',
        elevated: 'bg-card border border-border shadow-md rounded-xl'
    };

    const hoverClass = hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300' : 'transition-all duration-300';
    const interactiveClass = interactive ? 'cursor-pointer active:scale-[0.99] transition-transform' : '';

    return (
        <div
            className={`${variants[variant]} ${hoverClass} ${interactiveClass} ${className}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mb-6 pb-4 border-b border-border ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <h2 className={`text-lg font-bold text-foreground tracking-tight ${className}`}>
            {children}
        </h2>
    );
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={`text-sm text-slate-400 mt-1 ${className}`}>
            {children}
        </p>
    );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mt-6 pt-4 border-t border-border flex justify-between items-center ${className}`}>
            {children}
        </div>
    );
}
