"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  breadcrumbs
}: PageHeaderProps) {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'gerente' || user?.role === 'gerencia';

  return (
    <div className="bg-card rounded-3xl p-6 md:p-8 mb-6 md:mb-8 border border-border shadow-sm">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-zinc-300">/</span>}
              <span className={crumb.href ? 'text-orange-500 cursor-pointer hover:underline font-medium' : 'text-zinc-400 font-medium'}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          {Icon && (
            <div className="p-3 md:p-4 bg-orange-50 rounded-2xl flex-shrink-0">
              <Icon className="text-orange-500" size={28} strokeWidth={2} />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-slate-500 font-medium mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {action && !isReadOnly && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
