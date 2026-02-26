"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Asistencia, Personal } from '@/types';
import { getAsistenciasByMonth, upsertAsistencia } from '@/services/asistenciaService';
import { getPersonalAll } from '@/services/personalService';
import { Button } from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import AttendanceGrid from '@/components/asistencia/AttendanceGrid';
import { ChevronLeft, ChevronRight, Sun, Moon, FileDown, Users, Calendar } from 'lucide-react';
import { exportAsistenciaToExcel } from '@/utils/excelUtils';
import { useAuth } from '@/context/AuthContext';

export default function AsistenciasPage() {
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(0); // 0 = Jan
    const [year] = useState(2026);
    const pathname = usePathname();
    const router = useRouter();
    const { canEdit, hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    useEffect(() => {
        fetchData();
    }, [month]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, aData] = await Promise.all([
                getPersonalAll(),
                getAsistenciasByMonth(month, year)
            ]);
            setPersonal(pData);
            setAsistencias(aData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleShift = async (personId: number, date: string, shift: 'dia' | 'noche') => {
        const existing = asistencias.find(a => a.id_personal === personId && a.fecha === date);
        const newData = {
            id_personal: personId,
            fecha: date,
            turno_dia: existing ? (shift === 'dia' ? !existing.turno_dia : existing.turno_dia) : (shift === 'dia'),
            turno_noche: existing ? (shift === 'noche' ? !existing.turno_noche : existing.turno_noche) : (shift === 'noche'),
            estado: existing?.estado || 'presente' as const
        };

        const updatedRecord = await upsertAsistencia(newData);
        updateLocalState(updatedRecord);
    };

    const handleUpdateStatus = async (personId: number, date: string, status: Asistencia['estado']) => {
        const existing = asistencias.find(a => a.id_personal === personId && a.fecha === date);
        const newData: Omit<Asistencia, 'id_asistencia'> = {
            id_personal: personId,
            fecha: date,
            turno_dia: existing?.turno_dia || false,
            turno_noche: existing?.turno_noche || false,
            estado: status
        };

        const updatedRecord = await upsertAsistencia(newData);
        updateLocalState(updatedRecord);
    };

    const updateLocalState = (record: Asistencia) => {
        setAsistencias(prev => {
            const idx = prev.findIndex(a => a.id_personal === record.id_personal && a.fecha === record.fecha);
            if (idx > -1) {
                const refreshed = [...prev];
                refreshed[idx] = record;
                return refreshed;
            } else {
                return [...prev, record];
            }
        });
    };

    const nextMonth = () => setMonth(m => (m + 1) % 12);
    const prevMonth = () => setMonth(m => (m - 1 + 12) % 12);

    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <Users size={12} strokeWidth={3} />
                        Control de Capital Humano
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Planilla de <span className="text-blue-500 font-medium">Asistencias</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Gestión mensual de turnos y registros de personal operativo - Año {year}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
                    <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                        <ChevronLeft size={18} strokeWidth={3} />
                    </button>
                    <div className="min-w-[120px] text-center font-black text-foreground tracking-tighter uppercase text-xs">
                        {meses[month]}
                    </div>
                    <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                        <ChevronRight size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Attendance Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Personal Total"
                    value={personal.length}
                    icon={Users}
                    color="primary"
                />
                <StatCard
                    label="Días Laborables"
                    value="30"
                    icon={Calendar}
                    color="info"
                />
                <StatCard
                    label="Turnos Dia"
                    value={asistencias.filter(a => a.turno_dia).length}
                    icon={Sun}
                    color="success"
                />
                <StatCard
                    label="Turnos Noche"
                    value={asistencias.filter(a => a.turno_noche).length}
                    icon={Moon}
                    color="warning"
                />
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Visual Legend & Utility Bar */}
                <div className="flex flex-wrap items-center gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                            <Sun size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turno Día</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-800 rounded-lg text-slate-400">
                            <Moon size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turno Noche</span>
                    </div>
                    <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Falta</span>
                        </div>
                    </div>

                    <div className="ml-auto">
                        <Button
                            variant="primary"
                            icon={FileDown}
                            onClick={() => exportAsistenciaToExcel(month, year, personal, asistencias)}
                            className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 px-8"
                        >
                            Exportar Planilla
                        </Button>
                    </div>
                </div>

                {/* The Attendance Matrix */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-slate-800 rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Generando Malla de Control...</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <AttendanceGrid
                            month={month}
                            year={year}
                            personal={personal}
                            asistencias={asistencias}
                            onToggleShift={isReadOnly ? () => { } : handleToggleShift}
                            onUpdateStatus={isReadOnly ? () => { } : handleUpdateStatus}
                            readOnly={isReadOnly}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
