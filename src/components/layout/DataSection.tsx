"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DataGridProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className = ''
}: DataGridProps) {
  return (
    <div className={`bg-card rounded-3xl p-6 md:p-8 border border-border shadow-sm ${className}`}>
      {/* Header */}
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="flex items-start gap-4 flex-1">
            {Icon && (
              <div className="p-2.5 bg-blue-600/10 rounded-xl flex-shrink-0">
                <Icon className="text-blue-500" size={20} strokeWidth={2.5} />
              </div>
            )}
            <div className="flex-1">
              {title && (
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default DataSection;
