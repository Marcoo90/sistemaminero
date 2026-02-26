"use client";

import React from 'react';
import { Personal, Asistencia } from '@/types';
import { Sun, Moon } from 'lucide-react';

interface AttendanceGridProps {
    month: number;
    year: number;
    personal: Personal[];
    asistencias: Asistencia[];
    onToggleShift: (personId: number, date: string, shift: 'dia' | 'noche') => void;
    onUpdateStatus: (personId: number, date: string, status: Asistencia['estado']) => void;
    readOnly?: boolean;
}

export default function AttendanceGrid({ month, year, personal, asistencias, onToggleShift, onUpdateStatus, readOnly = false }: AttendanceGridProps) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getDayName = (day: number) => {
        const date = new Date(year, month, day);
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
    };

    const getAsistencia = (personId: number, day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return asistencias.find(a => a.id_personal === personId && a.fecha === dateStr);
    };

    const getSummary = (personId: number) => {
        const personAsis = asistencias.filter(a => a.id_personal === personId);
        return {
            // Worked Days: Calendar days with shifts or status 'presente' or 'tardanza' (NOT 'falta')
            trabajos: personAsis.filter(a => {
                if (a.estado === 'falta') return false;
                return a.turno_dia || a.turno_noche || a.estado === 'presente' || a.estado === 'tardanza';
            }).length,
            faltas: personAsis.filter(a => a.estado === 'falta').length,
            tardanzas: personAsis.filter(a => a.estado === 'tardanza').length,
            justificadas: personAsis.filter(a => a.estado === 'justificada').length,
        };
    };

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden" style={{ maxWidth: 'calc(100vw - var(--sidebar-width, 260px) - 6rem)' }}>
            <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full border-collapse border-spacing-0 min-w-max">
                    <thead>
                        <tr className="bg-background tracking-wider font-extrabold uppercase text-[10px] text-slate-500">
                            <th className="px-6 py-4 text-left sticky left-0 bg-background z-20 border-b border-border min-w-[200px]">Colaborador / Cargo</th>
                            {daysArray.map(day => (
                                <th key={day} className="px-2 py-3 text-center border-l border-border border-b border-border min-w-[50px]">
                                    <div className="text-[9px] text-slate-500">{getDayName(day)}</div>
                                    <div className="text-xs font-black text-foreground">{day}</div>
                                </th>
                            ))}
                            <th className="px-3 py-3 border-l-2 border-blue-500/20 border-b border-border text-emerald-500 w-[40px] text-center font-black">T</th>
                            <th className="px-3 py-3 border-l border-border border-b border-border text-red-500 w-[40px] text-center font-black">F</th>
                            <th className="px-3 py-3 border-l border-border border-b border-border text-amber-500 w-[40px] text-center font-black">Tar</th>
                            <th className="px-3 py-3 border-l border-border border-b border-border text-sky-500 w-[40px] text-center font-black">J</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {personal.map(person => {
                            const summary = getSummary(person.id_personal);
                            return (
                                <tr key={person.id_personal} className="hover:bg-blue-500/5 transition-colors group">
                                    <td className="px-6 py-4 sticky left-0 bg-card group-hover:bg-slate-900/60 z-10 font-bold border-b border-border white-space-nowrap shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                                        <div className="text-sm text-foreground tracking-tight">{person.nombres}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">{person.cargo}</div>
                                    </td>
                                    {daysArray.map(day => {
                                        const asis = getAsistencia(person.id_personal, day);
                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                        return (
                                            <td key={day} className="px-1 py-3 text-center border-l border-border border-b border-border">
                                                <div className="flex flex-col gap-1.5 items-center">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => !readOnly && onToggleShift(person.id_personal, dateStr, 'dia')}
                                                            title="Turno Día"
                                                            disabled={readOnly}
                                                            className={`p-1.5 rounded-lg transition-all ${asis?.turno_dia ? 'bg-orange-500/20 text-orange-500 scale-110 shadow-sm' : 'text-slate-800 dark:text-slate-700 hover:text-orange-500'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            <Sun size={12} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => !readOnly && onToggleShift(person.id_personal, dateStr, 'noche')}
                                                            title="Turno Noche"
                                                            disabled={readOnly}
                                                            className={`p-1.5 rounded-lg transition-all ${asis?.turno_noche ? 'bg-indigo-500/20 text-indigo-400 scale-110 shadow-sm' : 'text-slate-800 dark:text-slate-700 hover:text-indigo-400'} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            <Moon size={12} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={asis?.estado || ''}
                                                        onChange={(e) => !readOnly && onUpdateStatus(person.id_personal, dateStr, e.target.value as any)}
                                                        disabled={readOnly}
                                                        className={`bg-transparent border-none text-slate-500 font-bold text-[9px] w-full text-center hover:text-foreground transition-colors appearance-none ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        <option value="" className="bg-card">-</option>
                                                        <option value="presente" className="bg-card">P</option>
                                                        <option value="falta" className="bg-card">F</option>
                                                        <option value="tardanza" className="bg-card">T</option>
                                                        <option value="justificada" className="bg-card">J</option>
                                                        <option value="permiso" className="bg-card">PE</option>
                                                        <option value="descanso" className="bg-card">DE</option>
                                                    </select>
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-2 py-4 text-center border-l-2 border-blue-500/10 border-b border-border text-emerald-500 font-black text-xs">{summary.trabajos}</td>
                                    <td className="px-2 py-4 text-center border-l border-border border-b border-border text-red-500 font-black text-xs">{summary.faltas}</td>
                                    <td className="px-2 py-4 text-center border-l border-border border-b border-border text-amber-500 font-black text-xs">{summary.tardanzas}</td>
                                    <td className="px-2 py-4 text-center border-l border-border border-b border-border text-sky-500 font-black text-xs">{summary.justificadas}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
