"use client";

import React from 'react';
import { Viaje } from '@/types';
import RegistroViaje from '@/components/viajes/RegistroViaje';
import RegistroGasto from '@/components/viajes/RegistroGasto';
import { Badge } from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { Truck, Navigation, Calendar, Activity, History as HistoryIcon } from 'lucide-react';

interface ConductorViajesViewProps {
    idConductor: number;
    activeViaje: Viaje | null;
    history: Viaje[];
    onUpdate: () => void;
}

export const ConductorViajesView: React.FC<ConductorViajesViewProps> = ({
    idConductor,
    activeViaje,
    history,
    onUpdate
}) => {
    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <Navigation size={12} strokeWidth={3} />
                        Terminal Móvil
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Panel del <span className="text-blue-500 font-medium">Conductor</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Gestiona tus rutas activas, registra gastos operativos y consulta tu historial.
                    </p>
                </div>
            </div>

            {/* Quick Metrics for Driver */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Viajes Realizados"
                    value={history.length}
                    icon={Calendar}
                    color="primary"
                />
                <StatCard
                    label="Estado de Enlace"
                    value="Activo"
                    icon={Activity}
                    color="success"
                />
                <StatCard
                    label="Gastos Reportados"
                    value={`S/ ${history.reduce((sum, v) => sum + (v.gastos?.reduce((s, g) => s + g.monto, 0) || 0), 0).toFixed(2)}`}
                    icon={Truck}
                    color="info"
                />
                <StatCard
                    label="Rendimiento"
                    value="98"
                    unit="%"
                    icon={Activity}
                    color="warning"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Operational Flow */}
                <div className="xl:col-span-8 space-y-8">
                    {activeViaje ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-fit">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Viaje en Curso</span>
                            </div>
                            <RegistroGasto viaje={activeViaje} onUpdate={onUpdate} />
                        </div>
                    ) : (
                        <RegistroViaje idConductor={idConductor} onViajeIniciado={onUpdate} />
                    )}
                </div>

                {/* History Sidebar/Section */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <HistoryIcon size={14} strokeWidth={3} /> Historial Reciente
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {history.slice(0, 5).map((row, i) => (
                            <div key={i} className="p-5 bg-card border border-border rounded-2xl shadow-sm hover:border-blue-500/50 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(row.fecha_salida).toLocaleDateString()}</p>
                                        <p className="font-bold text-foreground group-hover:text-blue-500 transition-colors uppercase tracking-tight">{row.origen} → {row.destino}</p>
                                    </div>
                                    <Badge variant={row.estado === 'en_ruta' ? 'success' : 'info'}>
                                        {row.estado === 'en_ruta' ? 'Ruta' : 'Fin'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Vehículo</p>
                                        <p className="text-xs font-black text-foreground/80">{row.vehiculo?.placa || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Gasto</p>
                                        <p className="text-xs font-black text-blue-500">S/. {row.gastos?.reduce((sum, g) => sum + g.monto, 0).toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
