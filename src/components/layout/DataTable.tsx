"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  color?: (value: any) => 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  striped?: boolean;
  loading?: boolean;
  empty?: React.ReactNode;
  loader?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  hover?: boolean;
  readOnly?: boolean;
}

const colorClasses = {
  success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
  warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
  info: 'bg-sky-500/10 text-sky-500 border border-sky-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
  primary: 'bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  actions,
  striped = true,
  loading = false,
  empty,
  loader,
  pagination,
  hover = false,
  readOnly
}: DataTableProps<T>) {
  const { user } = useAuth();
  const isReadOnly = readOnly !== undefined ? readOnly : (user?.role === 'gerente' || user?.role === 'gerencia');
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-background/50">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-${col.align || 'left'} border-b border-border`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  role={col.sortable ? 'button' : undefined}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortConfig?.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && !isReadOnly && <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right border-b border-border">Acciones</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/20">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions && !isReadOnly ? 1 : 0)} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-border rounded-full border-t-blue-500 animate-spin"></div>
                    <span className="text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-widest">Procesando registros...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions && !isReadOnly ? 1 : 0)} className="px-6 py-20">
                  <div className="text-center">
                    {empty || (
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-slate-500 font-bold tracking-tight uppercase text-[10px] tracking-widest">No se encontraron datos</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={String(row[keyField])}
                  className={`group transition-all duration-200 ${hover ? 'hover:bg-blue-500/5' : 'hover:bg-slate-500/5'} ${striped && idx % 2 === 1 ? 'bg-slate-500/[0.02]' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 text-sm text-foreground/80 font-medium text-${col.align || 'left'}`}
                    >
                      {col.render ? (
                        <div className={col.color && typeof col.color === 'function' ? colorClasses[col.color(row[col.key])] : ''}>
                          {col.render(row[col.key], row)}
                        </div>
                      ) : col.color && typeof col.color === 'function' ? (
                        <span className={colorClasses[col.color(row[col.key])]}>
                          {row[col.key]}
                        </span>
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {actions && !isReadOnly && (
                    <td className="px-6 py-4 text-right opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-end gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-6 py-5 bg-card rounded-2xl border border-border shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Página <span className="text-foreground mx-1">{pagination.page}</span> de <span className="text-foreground mx-1">{Math.ceil(pagination.total / pagination.pageSize)}</span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="bg-secondary/50 border-transparent disabled:opacity-30"
            />
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="bg-secondary/50 border-transparent disabled:opacity-30"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export type { Column };
export default DataTable;
