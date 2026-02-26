"use client";

import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    trendLabel?: string;
    unit?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
    onClick?: () => void;
}

export default function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color = 'primary',
    unit,
    className = '',
    onClick
}: StatCardProps) {
    const colorClasses = {
        primary: 'bg-blue-600/10 text-blue-500 border-blue-500/20',
        success: 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20',
        warning: 'bg-amber-600/10 text-amber-500 border-amber-500/20',
        danger: 'bg-red-600/10 text-red-500 border-red-500/20',
        info: 'bg-sky-600/10 text-sky-500 border-sky-500/20'
    };

    const isPositiveTrend = (trend ?? 0) >= 0;

    return (
        <Card variant="default" className={`relative overflow-hidden group border-border hover:border-blue-500/50 transition-all duration-300 rounded-2xl p-0 ${className}`} onClick={onClick}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-xl ${colorClasses[color]} shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${isPositiveTrend
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                            {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(trend ?? 0)}%
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{value}</span>
                        {unit && <span className="text-sm font-bold text-slate-500">{unit}</span>}
                    </div>
                </div>
            </div>

            {/* Subtle bottom indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-20 group-hover:opacity-40 transition-opacity ${color === 'primary' ? 'bg-blue-600' :
                color === 'success' ? 'bg-emerald-600' :
                    color === 'warning' ? 'bg-amber-500' :
                        color === 'danger' ? 'bg-red-600' : 'bg-blue-400'
                }`} />
        </Card>
    );
}
