"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Proveedor } from '@/types';
import { getProveedoresAll, createProveedor, updateProveedor, deleteProveedor } from '@/services/adminService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import ProveedorForm from '@/components/admin/ProveedorForm';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { useAuth } from '@/context/AuthContext';

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingProveedor, setEditingProveedor] = useState<Proveedor | undefined>(undefined);
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
            const data = await getProveedoresAll();
            setProveedores(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: Omit<Proveedor, 'id_proveedor'>) => {
        setLoading(true);
        try {
            if (editingProveedor) {
                await updateProveedor(editingProveedor.id_proveedor, data);
            } else {
                await createProveedor(data);
            }
            setEditingProveedor(undefined);
            setView('list');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este proveedor?')) {
            try {
                await deleteProveedor(id);
                fetchData();
            } catch (err) {
                console.error(err);
                alert('No se pudo eliminar el proveedor.');
            }
        }
    };

    const handleEdit = (prov: Proveedor) => {
        setEditingProveedor(prov);
        setView('form');
    };

    if (view === 'form') {
        return <ProveedorForm onSave={handleSave} onCancel={() => { setView('list'); setEditingProveedor(undefined); }} initialData={editingProveedor} />;
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Directorio de Proveedores"
                description="Gestión de contratistas, proveedores de servicios y suministros mineros."
                icon={Users}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Proveedores' }
                ]}
                action={
                    !isReadOnly && (
                        <Button onClick={() => { setEditingProveedor(undefined); setView('form'); }} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                            Registrar Proveedor
                        </Button>
                    )
                }
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando proveedores...</p>
                    </div>
                ) : (
                    <Table
                        data={proveedores}
                        keyField="id_proveedor"
                        enableFilters={true}
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'Razón Social / RUC',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.nombre}</p>
                                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{row.ruc}</p>
                                    </div>
                                ),
                                filterable: true,
                                filterPlaceholder: 'Buscar nombre/RUC...'
                            },
                            {
                                header: 'Especialidad',
                                accessor: 'tipo',
                                filterable: true,
                                filterPlaceholder: 'Filtrar tipo...',
                                width: '180px'
                            },
                            {
                                header: 'Contacto',
                                accessor: 'telefono',
                                filterable: true,
                                width: '140px'
                            },
                            {
                                header: 'Observaciones',
                                accessor: (row) => <span className="text-slate-500 text-xs italic">{row.observaciones || 'Sin registros'}</span>
                            },
                            {
                                header: 'Acciones',
                                accessor: (row) => (
                                    user?.role === 'admin' && (
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(row.id_proveedor)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )
                                ),
                                width: '100px',
                                align: 'right'
                            }
                        ]}
                        hover
                    />
                )}
            </DataSection>
        </div>
    );
}
