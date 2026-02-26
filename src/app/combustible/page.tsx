"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Combustible, Vehiculo } from '@/types';
import { getFuelLogs, getVehiculosAll, addFuelLog } from '@/services/vehiculoService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import FuelForm from '@/components/combustible/FuelForm';
import { Plus, Fuel as FuelIcon, FileDown, Activity } from 'lucide-react';
import { exportCombustibleToExcel } from '@/utils/excelUtils';
import Modal from '@/components/ui/Modal';
import StatCard from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function CombustiblePage() {
    const [logs, setLogs] = useState<Combustible[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const pathname = usePathname();
    const router = useRouter();
    const { canEdit, hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lData, vData] = await Promise.all([
                getFuelLogs(),
                getVehiculosAll()
            ]);
            setLogs(lData);
            setVehiculos(vData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Omit<Combustible, 'id_combustible'>) => {
        await addFuelLog(data);
        setView('list');
        fetchData();
    };

    const getVehiculoInfo = (id: number) => {
        const v = vehiculos.find(item => item.id_vehiculo === id);
        return v ? `${v.codigo_vehiculo} (${v.placa})` : 'Desconocido';
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <FuelIcon size={12} strokeWidth={3} />
                        Gestión Energética
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Control de <span className="text-blue-500 font-medium">Combustible</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Monitoreo de consumos, eficiencia por unidad y trazabilidad de vales en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        icon={FileDown}
                        onClick={() => exportCombustibleToExcel(logs, vehiculos)}
                        className="font-black uppercase tracking-widest text-[10px] px-6 text-slate-500 hover:text-blue-600 hover:bg-blue-600/10"
                    >
                        Exportar Reporte
                    </Button>
                    {canEdit(pathname) && (
                        <Button
                            onClick={() => setView('form')}
                            icon={Plus}
                            className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-6"
                        >
                            Registrar Carga
                        </Button>
                    )}
                </div>
            </div>

            {/* Performance Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Consumo Acumulado"
                    value={logs.reduce((acc, curr) => acc + curr.litros, 0).toLocaleString()}
                    unit="L"
                    icon={FuelIcon}
                    color="primary"
                />
                <StatCard
                    label="Costo Operativo"
                    value={`S/ ${logs.reduce((acc, curr) => acc + curr.costo_total, 0).toLocaleString()}`}
                    icon={Plus}
                    color="danger"
                />
                <StatCard
                    label="Eficiencia Media"
                    value="0.342"
                    unit="L/KM"
                    icon={Activity}
                    color="success"
                />
                <StatCard
                    label="Vales Activos"
                    value={logs.length}
                    icon={Plus}
                    color="info"
                />
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Advanced List View */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Bitácora de Cargas...</p>
                    </div>
                ) : (
                    <Table
                        data={logs}
                        keyField="id_combustible"
                        readOnly={!canEdit(pathname)}
                        columns={[
                            {
                                header: 'Fecha / Hora',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="font-bold text-foreground">{row.fecha}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Registro Minero</p>
                                </div>,
                                width: '140px'
                            },
                            {
                                header: 'Unidad de Transporte',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="font-bold text-foreground">{getVehiculoInfo(row.id_vehiculo)}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{row.conductor}</p>
                                </div>
                            },
                            {
                                header: 'Métricas',
                                accessor: (row: any) => <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Recorrido</p>
                                        <p className="font-bold text-foreground">{row.km_horometro - row.km_anterior} KM</p>
                                    </div>
                                    <div className="pl-4 border-l border-border">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Carga</p>
                                        <p className="font-black text-blue-500">{row.litros} L</p>
                                    </div>
                                </div>
                            },
                            {
                                header: 'Eficiencia',
                                accessor: (row: any) => {
                                    const dist = row.km_horometro - row.km_anterior;
                                    const consumption = dist > 0 ? (row.litros / dist) : 0;
                                    return (
                                        <div className="flex flex-col items-end">
                                            <span className="text-base font-black text-foreground">{consumption.toFixed(3)}</span>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">L/KM</span>
                                        </div>
                                    );
                                },
                                align: 'right',
                                width: '120px'
                            },
                            {
                                header: 'Costo Final',
                                accessor: (row: any) => <span className="text-sm font-black text-foreground">S/ {row.costo_total.toFixed(2)}</span>,
                                align: 'right',
                                width: '140px'
                            }
                        ]}
                        hover
                    />
                )}
            </div>

            <Modal open={view === 'form'} title="Registrar Carga de Combustible" onClose={() => setView('list')}>
                <div className="p-8">
                    <FuelForm onSave={handleSave} onCancel={() => setView('list')} />
                </div>
            </Modal>
        </div>
    );
}
