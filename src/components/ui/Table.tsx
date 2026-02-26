"use client";

import { useMemo, useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    width?: string;
    hidden?: boolean;
    filterable?: boolean;
    filterPlaceholder?: string;
    align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: (row: T, index: number) => React.ReactNode;
    enableFilters?: boolean;
    striped?: boolean;
    hover?: boolean;
    readOnly?: boolean;
}

export const Table = <T extends unknown>({
    data,
    columns,
    actions,
    enableFilters = false,
    striped = true,
    hover = true,
    readOnly,
    keyField = 'id' as keyof T
}: TableProps<T> & { keyField?: keyof T }) => {
    const { user } = useAuth();
    const isReadOnly = readOnly !== undefined ? readOnly : (user?.role === 'gerente' || user?.role === 'gerencia');
    const visibleColumns = columns.filter(col => !col.hidden);

    const [filters, setFilters] = useState<Record<number, string>>({});
    const [debouncedFilters, setDebouncedFilters] = useState<Record<number, string>>({});

    useEffect(() => {
        const id = setTimeout(() => setDebouncedFilters(filters), 250);
        return () => clearTimeout(id);
    }, [filters]);

    const filteredData = useMemo(() => {
        if (!enableFilters) return data;

        return data.filter(row => {
            return visibleColumns.every((col, idx) => {
                if (!col.filterable) return true;
                const f = (debouncedFilters[idx] || '').trim().toLowerCase();
                if (!f) return true;
                if (typeof col.accessor === 'function') return true;
                const cell = String((row[col.accessor] ?? '') as unknown).toLowerCase();
                return cell.includes(f);
            });
        });
    }, [data, visibleColumns, debouncedFilters, enableFilters]);

    const getAlignClass = (align?: 'left' | 'center' | 'right') => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[800px] text-sm border-collapse">
                    <thead>
                        <tr className="bg-secondary/30 backdrop-blur-sm">
                            {visibleColumns.map((col, index) => (
                                <th
                                    key={index}
                                    style={{ width: col.width }}
                                    className={`px-6 py-5 font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] border-b border-border ${getAlignClass(col.align)}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {actions && !isReadOnly && <th className="px-6 py-5 font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] text-right border-b border-border">Acciones</th>}
                        </tr>

                        {enableFilters && (
                            <tr className="bg-card border-b border-border">
                                {visibleColumns.map((col, index) => (
                                    <th key={index} className="px-4 py-3">
                                        {col.filterable ? (
                                            <input
                                                type="text"
                                                value={filters[index] || ''}
                                                placeholder={col.filterPlaceholder || `Filtrar...`}
                                                onChange={(e) => setFilters(prev => ({ ...prev, [index]: e.target.value }))}
                                                className="w-full h-9 px-4 rounded-xl bg-secondary border border-transparent text-[11px] font-bold text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-card transition-all"
                                            />
                                        ) : null}
                                    </th>
                                ))}
                                {actions && !isReadOnly && <th className="px-4 py-3"></th>}
                            </tr>
                        )}
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, rowIndex) => {
                                const rowKey = String(row[keyField] || rowIndex);
                                return (
                                    <tr
                                        key={rowKey}
                                        className={`group transition-all duration-200 outline-none focus-within:bg-blue-500/5 ${striped && rowIndex % 2 === 1 ? 'bg-secondary/10' : 'bg-card'
                                            } ${hover ? 'hover:bg-blue-500/5' : ''}`}
                                    >
                                        {visibleColumns.map((col, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className={`px-6 py-4 text-foreground/80 font-semibold text-[13px] ${getAlignClass(col.align)}`}
                                            >
                                                {typeof col.accessor === 'function'
                                                    ? col.accessor(row)
                                                    : (row[col.accessor] as React.ReactNode)}
                                            </td>
                                        ))}
                                        {actions && !isReadOnly && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    {actions(row, rowIndex)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length + (actions && !isReadOnly ? 1 : 0)} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-4 bg-secondary/50 rounded-full">
                                            <Activity size={32} className="text-slate-500/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-foreground font-black text-sm uppercase tracking-widest">Sin resultados</p>
                                            <p className="text-slate-500 text-xs font-bold">No se encontró información para mostrar en esta vista.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >
        </div >
    );
};
