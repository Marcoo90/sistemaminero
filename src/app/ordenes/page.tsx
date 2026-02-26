"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Orden, Area } from '@/types';
import { getOrdenesAll, createOrden, updateOrden, deleteOrden } from '@/services/adminService';
import { getAreasAll } from '@/services/personalService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import OrdenForm from '@/components/admin/OrdenForm';
import { Plus, ShoppingCart, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';

export default function OrdenesPage() {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingOrden, setEditingOrden] = useState<Orden | undefined>(undefined);
    const pathname = usePathname();
    const router = useRouter();
    const { user, canEdit, hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [oData, aData] = await Promise.all([
                getOrdenesAll(),
                getAreasAll()
            ]);
            setOrdenes(oData);
            setAreas(aData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Omit<Orden, 'id_orden'>) => {
        if (editingOrden) {
            await updateOrden(editingOrden.id_orden, data);
        } else {
            await createOrden(data);
        }
        setEditingOrden(undefined);
        setView('list');
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar esta orden?')) {
            try {
                await deleteOrden(id);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('No se pudo eliminar la orden.');
            }
        }
    };

    const handleEdit = (orden: Orden) => {
        setEditingOrden(orden);
        setView('form');
    };

    const handleStatusChange = async (id: number, newStatus: Orden['estado']) => {
        try {
            await updateOrden(id, { estado: newStatus });
            setOrdenes(prev => prev.map(o => o.id_orden === id ? { ...o, estado: newStatus } : o));
        } catch (err) {
            console.error(err);
        }
    };

    const getAreaName = (id: number) => areas.find(a => a.id_area === id)?.nombre_area || 'Desconocido';

    if (view === 'form') {
        return <OrdenForm onSave={handleSave} onCancel={() => { setView('list'); setEditingOrden(undefined); }} initialData={editingOrden} />;
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Órdenes de Compra/Servicio"
                description="Gestión centralizada de pedidos, suministros y servicios externos."
                icon={ShoppingCart}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Órdenes' }
                ]}
                action={
                    !isReadOnly && (
                        <Button onClick={() => { setEditingOrden(undefined); setView('form'); }} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                            Nueva Orden
                        </Button>
                    )
                }
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando órdenes...</p>
                    </div>
                ) : (
                    <Table
                        data={ordenes}
                        keyField="id_orden"
                        enableFilters={true}
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'N° Orden',
                                accessor: 'numero_orden',
                                width: '120px',
                                filterable: true,
                                filterPlaceholder: 'Buscar N°...'
                            },
                            {
                                header: 'Fecha',
                                accessor: 'fecha',
                                width: '120px'
                            },
                            {
                                header: 'Descripción / Personal',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.descripcion}</p>
                                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">{row.tipo_orden}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.responsable}</p>
                                    </div>
                                ),
                                filterable: true,
                                filterPlaceholder: 'Buscar desc...'
                            },
                            {
                                header: 'Detalles',
                                accessor: (row) => (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 font-black uppercase">Items:</span>
                                            <span className="text-sm font-black text-slate-900">{row.detalles?.length || 0}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {row.detalles && row.detalles.length > 0 ? (
                                                row.detalles.slice(0, 2).map((d, i) => (
                                                    <span key={i} className="text-[10px] text-slate-500 font-bold truncate max-w-[140px]">
                                                        • {d.cantidad} {d.unidad_medida} - {d.descripcion}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">Sin detalles</span>
                                            )}
                                            {row.detalles && row.detalles.length > 2 && (
                                                <span className="text-[9px] text-blue-500 font-bold italic">+{row.detalles.length - 2} más...</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col mt-1 pt-1 border-t border-dashed border-slate-200">
                                            <span className="text-[9px] text-slate-400 font-black uppercase">Autoriza:</span>
                                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{row.autorizado_por || 'N/A'}</span>
                                        </div>
                                    </div>
                                ),
                                width: '180px'
                            },
                            {
                                header: 'Estado', accessor: (row) => (
                                    isReadOnly ? (
                                        <Badge variant={row.estado === 'aprobada' ? 'success' : row.estado === 'rechazada' ? 'danger' : 'warning'}>
                                            {row.estado.toUpperCase()}
                                        </Badge>
                                    ) : (
                                        <select
                                            value={row.estado}
                                            onChange={(e) => handleStatusChange(row.id_orden, e.target.value as Orden['estado'])}
                                            className={`
                                                bg-secondary border border-border rounded-lg px-3 py-1.5
                                                text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none transition-all
                                                focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50
                                                ${row.estado === 'aprobada' ? 'text-emerald-500' :
                                                    row.estado === 'rechazada' ? 'text-red-500' : 'text-amber-500'}
                                            `}
                                        >
                                            <option value="pendiente" className="bg-card text-amber-500">PENDIENTE</option>
                                            <option value="aprobada" className="bg-card text-emerald-500">APROBADA</option>
                                            <option value="rechazada" className="bg-card text-red-500">RECHAZADA</option>
                                        </select>
                                    )
                                ),
                                width: '140px',
                                align: 'center'
                            },
                            {
                                header: 'Area',
                                accessor: (row) => row.area?.nombre_area || getAreaName(row.id_area),
                                width: '120px',
                                filterable: true,
                                filterPlaceholder: 'Buscar area...'
                            },
                        ]}
                        actions={(row) => (
                            user?.role === 'admin' && (
                                <div className="flex gap-1 justify-end">
                                    <button onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(row.id_orden)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )
                        )}
                        hover
                    />
                )}
            </DataSection>
        </div>
    );
}
