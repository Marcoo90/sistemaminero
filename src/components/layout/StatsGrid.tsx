"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  unit?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  clickable?: boolean;
  onStatClick?: (stat: StatItem) => void;
}

const colorConfig = {
  primary: 'bg-blue-600/10 text-blue-500 border-blue-500/20',
  success: 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-600/10 text-amber-500 border-amber-500/20',
  danger: 'bg-red-600/10 text-red-500 border-red-500/20',
  info: 'bg-sky-600/10 text-sky-500 border-sky-500/20',
};

export function StatsGrid({
  stats,
  columns = 4,
  clickable = false,
  onStatClick
}: StatsGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 md:gap-8`}>
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          onClick={() => clickable && onStatClick?.(stat)}
          className={`p-8 rounded-2xl border border-border bg-card transition-all shadow-sm ${clickable ? 'cursor-pointer hover:shadow-md hover:border-blue-500/50 hover:-translate-y-1' : ''
            }`}
        >
          {/* Top Section - Icon & Label */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
            {stat.icon && (
              <div className={`p-2.5 rounded-xl border ${colorConfig[stat.color || 'primary']}`}>
                <stat.icon size={18} strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Value Section */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="text-sm font-bold text-slate-500">
                  {stat.unit}
                </span>
              )}
            </div>

            {/* Trend */}
            {stat.trend && (
              <div className={`text-xs font-bold flex items-center gap-1.5 ${stat.trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}>
                <div className={`p-0.5 rounded-full ${stat.trend.isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <span>{stat.trend.isPositive ? '↑' : '↓'}</span>
                </div>
                <span>{stat.trend.value}% {stat.trend.label}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

export default StatsGrid;
