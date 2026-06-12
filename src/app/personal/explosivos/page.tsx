"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Zap, Plus, Trash2, User, Calendar, AlertTriangle, ClipboardList, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { getSalidasExplosivosAll, deleteSalidaExplosivos } from '@/services/explosivosService';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import StatsGrid from '@/components/layout/StatsGrid';
import SalidaExplosivosForm from '@/components/personal/SalidaExplosivosForm';

export default function ExplosivosPage() {
    const [loading, setLoading] = useState(true);
    const [salidas, setSalidas] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { canEdit, hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) router.push('/');
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getSalidasExplosivosAll();
            setSalidas(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este registro de salida de explosivos? Esta acción es irreversible.')) return;
        try {
            await deleteSalidaExplosivos(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Error al eliminar');
        }
    };

    const handleSaved = () => {
        setView('list');
        fetchData();
    };

    // ── Stats ────────────────────────────────────────────────────────────────
    const totalHoy = salidas.filter(s => {
        const fecha = s.fecha?.split(',')[0];
        const hoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return fecha === hoy;
    }).length;

    const totalMañana = salidas.filter(s => s.turno === 'mañana').length;
    const totalNoche = salidas.filter(s => s.turno === 'noche').length;

    // ── Form View ─────────────────────────────────────────────────────────────
    if (view === 'form') {
        return (
            <div key="explosivos-form-container" className="space-y-10 animate-fade-in">
                <PageHeader
                    title="Nueva Salida de Explosivos"
                    description="Registro de asignación y descuento de inventario de explosivos."
                    icon={Zap}
                    breadcrumbs={[
                        { label: 'Personal', href: '/personal' },
                        { label: 'Explosivos', href: '/personal/explosivos' },
                        { label: 'Nueva Salida' },
                    ]}
                />
                <div className="max-w-4xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        <SalidaExplosivosForm
                            onSave={handleSaved}
                            onCancel={() => setView('list')}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── List View ─────────────────────────────────────────────────────────────
    return (
        <div key="explosivos-list-container" className="space-y-10 animate-fade-in">
            <PageHeader
                title="Salida de Explosivos"
                description="Control de asignación de explosivos a trabajadores. Cada salida genera un movimiento de inventario trazable."
                icon={Zap}
                breadcrumbs={[
                    { label: 'Personal', href: '/personal' },
                    { label: 'Salida de Explosivos' },
                ]}
                action={
                    !isReadOnly ? (
                        <Button
                            icon={Plus}
                            onClick={() => setView('form')}
                            className="font-black uppercase tracking-widest text-[10px] bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        >
                            Nueva Salida
                        </Button>
                    ) : undefined
                }
            />

            <StatsGrid
                stats={[
                    {
                        label: 'Registros Hoy',
                        value: totalHoy,
                        icon: Calendar,
                        color: 'primary',
                    },
                    {
                        label: 'Turno Mañana',
                        value: totalMañana,
                        icon: Zap,
                        color: 'warning',
                    },
                    {
                        label: 'Turno Noche',
                        value: totalNoche,
                        icon: Zap,
                        color: 'info',
                    },
                    {
                        label: 'Total Registros',
                        value: salidas.length,
                        icon: ClipboardList,
                        color: 'success',
                    },
                ]}
                columns={4}
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-orange-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">
                            Cargando registros...
                        </p>
                    </div>
                ) : salidas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="p-4 rounded-2xl bg-orange-500/10">
                            <Zap size={32} className="text-orange-400" />
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Sin registros de salida</p>
                        {!isReadOnly && (
                            <Button
                                icon={Plus}
                                onClick={() => setView('form')}
                                className="font-black uppercase tracking-widest text-[10px] bg-orange-500 hover:bg-orange-600 text-white mt-2"
                            >
                                Registrar Primera Salida
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table
                        data={salidas}
                        keyField="id_salida_exp"
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'Fecha / Turno',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground text-sm">{row.fecha?.split(',')[0]}</p>
                                        <Badge variant={row.turno === 'mañana' ? 'warning' : 'info'}>
                                            {row.turno === 'mañana' ? '☀ Mañana' : '🌙 Noche'}
                                        </Badge>
                                    </div>
                                ),
                                width: '140px',
                            },
                            {
                                header: 'Trabajador',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.personal?.nombres || '—'}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                                            {row.personal?.area?.nombre_area || row.zona_area}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                header: 'Operación',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-foreground">{row.tipo_labor}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.zona_area}</p>
                                    </div>
                                ),
                            },
                            {
                                header: 'Hora Disparo',
                                accessor: (row) => (
                                    <span className="font-mono font-bold text-sm text-foreground">
                                        {row.hora_disparo || '—'}
                                    </span>
                                ),
                                align: 'center',
                                width: '110px',
                            },
                            {
                                header: 'Insumos',
                                accessor: (row) => (
                                    <div className="flex flex-wrap gap-1">
                                        {(row.detalles || []).map((d: any, i: number) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-orange-100 text-orange-700 border border-orange-200"
                                            >
                                                {d.variante || d.tipo_insumo.replace(/_/g, ' ')} × {d.cantidad}
                                            </span>
                                        ))}
                                        {(!row.detalles || row.detalles.length === 0) && (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                        actions={(row) => (
                            <div className="flex gap-1 justify-end">
                                {!isReadOnly && (
                                    <button
                                        onClick={() => handleDelete(row.id_salida_exp)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        )}
                        hover
                    />
                )}
            </DataSection>
        </div>
    );
}
