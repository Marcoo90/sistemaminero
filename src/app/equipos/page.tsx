"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Equipo, Area } from '@/types';
import { getEquiposAll, createEquipo, updateEquipo, deleteEquipo } from '@/services/equipoService';
import { getAreasAll } from '@/services/personalService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import EquipoForm from '@/components/equipos/EquipoForm';
import { Plus, Edit, Trash2, Wrench, Activity } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function EquiposPage() {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
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
            const [eData, aData] = await Promise.all([
                getEquiposAll(),
                getAreasAll()
            ]);
            setEquipos(eData);
            setAreas(aData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingId(null);
        setView('form');
    };

    const handleEdit = (id: number) => {
        setEditingId(id);
        setView('form');
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este equipo?')) {
            await deleteEquipo(id);
            fetchData();
        }
    };

    const handleSave = async (data: Omit<Equipo, 'id_equipo'>) => {
        if (editingId) {
            await updateEquipo(editingId, data);
        } else {
            await createEquipo(data);
        }
        setView('list');
        fetchData();
    };

    const getAreaName = (id: number) => areas.find(a => a.id_area === id)?.nombre_area || 'Desconocido';

    const initialData = editingId ? equipos.find(e => e.id_equipo === editingId) : undefined;

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Equipos Mineros"
                description="Inventario y gestión técnica de maquinaria pesada y activos críticos."
                icon={Activity}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Equipos' }
                ]}
                action={
                    canEdit(pathname) && (
                        <Button onClick={handleCreate} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                            Registrar Equipo
                        </Button>
                    )
                }
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando flota pesada...</p>
                    </div>
                ) : (
                    <Table
                        data={equipos}
                        keyField="id_equipo"
                        readOnly={!canEdit(pathname)}
                        columns={[
                            {
                                header: 'Identificación',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="text-foreground font-bold uppercase">{row.codigo_equipo}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.tipo_equipo}</p>
                                    </div>
                                ),
                                width: '160px'
                            },
                            {
                                header: 'Equipo / Modelo',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.marca}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{row.modelo}</p>
                                    </div>
                                )
                            },
                            { header: 'Área', accessor: (row) => <span className="text-slate-500 font-medium">{getAreaName(row.id_area)}</span> },
                            {
                                header: 'Horómetro',
                                accessor: (row) => (
                                    <div className="flex flex-col">
                                        <span className="font-black text-foreground">{row.horometro} h</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Acumulado</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Mantenimiento',
                                accessor: (row) => {
                                    const diff = row.horometro_mantenimiento - row.horometro;
                                    return (
                                        <div className="flex flex-col">
                                            <span className={`font-black ${diff < 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {diff > 0 ? `${diff} h` : 'VENCIDO'}
                                            </span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Restante</span>
                                        </div>
                                    );
                                },
                                width: '120px'
                            },
                            {
                                header: 'Estado', accessor: (row) => (
                                    <Badge variant={row.estado === 'operativo' ? 'success' : row.estado === 'mantenimiento' ? 'warning' : 'danger'}>
                                        {row.estado}
                                    </Badge>
                                ),
                                width: '120px',
                                align: 'center'
                            },
                            {
                                header: 'Registro',
                                accessor: (row: any) => (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500">{row.fecha_registro?.split(',')[0]}</span>
                                        <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{row.fecha_registro?.split(',')[1]}</span>
                                    </div>
                                ),
                                width: '120px'
                            },
                        ]}
                        actions={(row) => (
                            <div className="flex gap-1 justify-end">
                                <button onClick={() => handleEdit(row.id_equipo)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all" title="Mantenimiento">
                                    <Wrench size={16} />
                                </button>
                                <button onClick={() => handleDelete(row.id_equipo)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        hover
                    />
                )}
            </DataSection>

            <Modal open={view === 'form'} title={editingId ? 'Actualizar Equipo' : 'Registrar Nuevo Equipo'} onClose={() => setView('list')}>
                <div className="p-8">
                    <EquipoForm
                        initialData={initialData}
                        onSave={handleSave}
                        onCancel={() => setView('list')}
                    />
                </div>
            </Modal>
        </div>
    );
}
