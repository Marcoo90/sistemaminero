"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Vale, Area } from '@/types';
import { getValesAll, createVale, updateVale, deleteVale } from '@/services/adminService';
import { getAreasAll } from '@/services/personalService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import ValeForm from '@/components/admin/ValeForm';
import { Plus, ReceiptText, Trash2, Edit } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';

export default function ValesPage() {
    const [vales, setVales] = useState<Vale[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingVale, setEditingVale] = useState<Vale | undefined>(undefined);
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
            const [vData, aData] = await Promise.all([
                getValesAll(),
                getAreasAll()
            ]);
            setVales(vData);
            setAreas(aData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Omit<Vale, 'id_vale'>) => {
        if (editingVale) {
            await updateVale(editingVale.id_vale, data);
        } else {
            await createVale(data);
        }
        setEditingVale(undefined);
        setView('list');
        fetchData();
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este vale?')) {
            try {
                await deleteVale(id);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('No se pudo eliminar el vale.');
            }
        }
    };

    const handleEdit = (vale: Vale) => {
        setEditingVale(vale);
        setView('form');
    };
    const handleStatusChange = async (id: number, newStatus: Vale['estado']) => {
        try {
            await updateVale(id, { estado: newStatus });
            setVales(prev => prev.map(v => v.id_vale === id ? { ...v, estado: newStatus } : v));
        } catch (err) {
            console.error(err);
        }
    };

    const getAreaName = (id: number) => areas.find(a => a.id_area === id)?.nombre_area || 'Desconocido';

    if (view === 'form') {
        return (
            <div className="space-y-10 animate-fade-in">
                <PageHeader
                    title={editingVale ? "Editar Vale de Gasto" : "Nuevo Vale de Gasto"}
                    description="Control de gastos menores y autorizaciones de fondos operativos."
                    icon={ReceiptText}
                    breadcrumbs={[
                        { label: 'Administración' },
                        { label: 'Vales' }
                    ]}
                />
                <ValeForm onSave={handleSave} onCancel={() => { setView('list'); setEditingVale(undefined); }} initialData={editingVale} />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Vales y Gastos"
                description="Control de gastos menores y autorizaciones de fondos operativos."
                icon={ReceiptText}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Vales' }
                ]}
                action={
                    !isReadOnly && (
                        <Button onClick={() => { setEditingVale(undefined); setView('form'); }} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                            Nuevo Vale
                        </Button>
                    )
                }
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando vales...</p>
                    </div>
                ) : (
                    <Table
                        data={vales}
                        keyField="id_vale"
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'Identificación',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.numero_vale}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.fecha}</p>
                                    </div>
                                ),
                                width: '140px'
                            },
                            {
                                header: 'Solicitante',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.solicitante}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{getAreaName(row.id_area)}</p>
                                    </div>
                                )
                            },
                            { header: 'Concepto', accessor: 'concepto' },
                            {
                                header: 'Monto',
                                accessor: (row) => <span className="font-black text-foreground">S/ {row.monto.toFixed(2)}</span>,
                                align: 'right'
                            },
                            {
                                header: 'Estado', accessor: (row) => (
                                    isReadOnly ? (
                                        <Badge variant={row.estado === 'aprobado' ? 'success' : row.estado === 'rechazado' ? 'danger' : 'warning'}>
                                            {row.estado.toUpperCase()}
                                        </Badge>
                                    ) : (
                                        <select
                                            value={row.estado}
                                            onChange={(e) => handleStatusChange(row.id_vale, e.target.value as Vale['estado'])}
                                            className={`
                                                bg-secondary border border-border rounded-lg px-3 py-1.5
                                                text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none transition-all
                                                focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50
                                                ${row.estado === 'aprobado' ? 'text-emerald-500' :
                                                    row.estado === 'rechazado' ? 'text-red-500' : 'text-amber-500'}
                                            `}
                                        >
                                            <option value="pendiente" className="bg-card text-amber-500">PENDIENTE</option>
                                            <option value="aprobado" className="bg-card text-emerald-500">APROBADO</option>
                                            <option value="rechazado" className="bg-card text-red-500">RECHAZADO</option>
                                        </select>
                                    )
                                ),
                                width: '140px',
                                align: 'center'
                            },
                        ]}
                        actions={(row) => (
                            user?.role === 'admin' && (
                                <div className="flex gap-1 justify-end">
                                    <button onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(row.id_vale)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
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
