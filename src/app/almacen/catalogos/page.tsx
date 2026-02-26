"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Package, Box, Plus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    getMaterialesAll,
    getCategoriasAll,
    getAlmacenesAll,
    saveMaterial,
    saveCategoria,
    saveAlmacen,
    deleteMaterial,
    deleteCategoria,
    deleteAlmacen
} from '@/services/almacenService';
import { getAreasAll } from '@/services/personalService';
import { Material, CategoriaMaterial, Almacen, Area } from '@/types';
import Link from 'next/link';

import MaterialForm from '@/components/almacen/MaterialForm';
import CategoriaForm from '@/components/almacen/CategoriaForm';
import AlmacenForm from '@/components/almacen/AlmacenForm';

type Tab = 'materiales' | 'categorias' | 'almacenes';

export default function CatalogosPage() {
    const [activeTab, setActiveTab] = useState<Tab>('materiales');
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState<string>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [m, c, a, areasData] = await Promise.all([
                getMaterialesAll(),
                getCategoriasAll(),
                getAlmacenesAll(),
                getAreasAll()
            ]);
            setMateriales(m);
            setCategorias(c);
            setAlmacenes(a);
            setAreas(areasData || []);
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

    const handleSaveMaterial = async (data: Partial<Material>) => {
        await saveMaterial(data);
        setView('list');
        fetchData();
    };

    const handleSaveCategoria = async (data: Partial<CategoriaMaterial>) => {
        await saveCategoria(data);
        setView('list');
        fetchData();
    };

    const handleSaveAlmacen = async (data: Partial<Almacen>) => {
        await saveAlmacen(data);
        setView('list');
        fetchData();
    };

    const handleDeleteMaterial = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este material? Esta acción eliminará TAMBIÉN todo el historial de movimientos (ingresos, salidas, entregas) y es irreversible.')) {
            try {
                await deleteMaterial(id);
                fetchData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleDeleteCategoria = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta categoría? Solo se podrá eliminar si no tiene materiales asociados.')) {
            try {
                await deleteCategoria(id);
                fetchData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleDeleteAlmacen = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este almacén? Solo se podrá eliminar si no tiene stock o movimientos registrados.')) {
            try {
                await deleteAlmacen(id);
                fetchData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const filteredMateriales = useMemo(() => {
        return materiales.filter(m => {
            const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.codigo_material.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = areaFilter === 'all' ||
                m.id_area?.toString() === areaFilter ||
                m.area?.id_area.toString() === areaFilter;
            return matchesSearch && matchesArea;
        });
    }, [materiales, searchTerm, areaFilter]);

    const getCategoriaName = (id: number) => categorias.find(c => c.id_categoria === id)?.nombre || 'S/N';

    if (view === 'form') {
        if (activeTab === 'materiales') {
            const initialData = editingId ? materiales.find(m => m.id_material === editingId) : undefined;
            return <MaterialForm initialData={initialData} />;
        }
        if (activeTab === 'categorias') {
            const initialData = editingId ? categorias.find(c => c.id_categoria === editingId) : undefined;
            return (
                <CategoriaForm
                    initialData={initialData}
                    onSave={handleSaveCategoria}
                    onCancel={() => setView('list')}
                />
            );
        }
        if (activeTab === 'almacenes') {
            const initialData = editingId ? almacenes.find(a => a.id_almacen === editingId) : undefined;
            return (
                <AlmacenForm
                    initialData={initialData}
                    onSave={handleSaveAlmacen}
                    onCancel={() => setView('list')}
                />
            );
        }
    }

    const renderMateriales = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <Input
                        placeholder="Buscar por código o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', marginBottom: 0 }}
                    />
                </div>
                <div style={{ width: '250px' }}>
                    <Select
                        options={[
                            { value: 'all', label: 'Todas las Áreas' },
                            ...areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))
                        ]}
                        value={areaFilter}
                        onChange={(e: any) => setAreaFilter(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <Button icon={Plus} onClick={handleCreate}>Nuevo Material</Button>
            </div>

            <Table
                data={filteredMateriales}
                keyField="id_material"
                columns={[
                    { header: 'Código', accessor: 'codigo_material' },
                    { header: 'Nombre', accessor: 'nombre' },
                    { header: 'Área', accessor: (row) => row.area?.nombre_area || 'Sin Área' },
                    { header: 'Categoría', accessor: (row) => getCategoriaName(row.id_categoria) },
                    { header: 'U.M.', accessor: 'unidad_medida' },
                    { header: 'Stock Mín.', accessor: 'stock_minimo' },
                    {
                        header: 'Estado',
                        accessor: (row) => (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: row.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: row.estado === 'activo' ? '#34d399' : '#f87171'
                            }}>
                                {row.estado.toUpperCase()}
                            </span>
                        )
                    },
                ]}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.id_material)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="sm" style={{ color: '#f87171' }} onClick={() => handleDeleteMaterial(row.id_material)}><Trash2 size={16} /></Button>
                    </div>
                )}
            />
        </div>
    );

    const renderCategorias = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={Plus} onClick={handleCreate}>Nueva Categoría</Button>
            </div>
            <Table
                data={categorias}
                keyField="id_categoria"
                columns={[
                    { header: 'Nombre', accessor: 'nombre' },
                    { header: 'Descripción', accessor: 'descripcion' },
                ]}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.id_categoria)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="sm" style={{ color: '#f87171' }} onClick={() => handleDeleteCategoria(row.id_categoria)}><Trash2 size={16} /></Button>
                    </div>
                )}
            />
        </div>
    );

    const renderAlmacenes = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={Plus} onClick={handleCreate}>Nuevo Almacén</Button>
            </div>
            <Table
                data={almacenes}
                keyField="id_almacen"
                columns={[
                    { header: 'Nombre', accessor: 'nombre' },
                    { header: 'Ubicación', accessor: 'ubicacion' },
                    { header: 'Responsable', accessor: 'responsable' },
                ]}
                actions={(row) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(row.id_almacen)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="sm" style={{ color: '#f87171' }} onClick={() => handleDeleteAlmacen(row.id_almacen)}><Trash2 size={16} /></Button>
                    </div>
                )}
            />
        </div>
    );

    return (
        <div className="container mx-auto py-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/almacen">
                    <Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button>
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Catálogos de Almacén</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Maestros de materiales, categorías y sedes</p>
                </div>
            </div>

            <Card style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => { setActiveTab('materiales'); setView('list'); }}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'materiales' ? '#3b82f6' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'materiales' ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'materiales' ? 600 : 400
                        }}
                    >
                        Materiales
                    </button>
                    <button
                        onClick={() => { setActiveTab('categorias'); setView('list'); }}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'categorias' ? '#3b82f6' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'categorias' ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'categorias' ? 600 : 400
                        }}
                    >
                        Categorías
                    </button>
                    <button
                        onClick={() => { setActiveTab('almacenes'); setView('list'); }}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'almacenes' ? '#3b82f6' : 'var(--text-secondary)',
                            borderBottom: activeTab === 'almacenes' ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === 'almacenes' ? 600 : 400
                        }}
                    >
                        Almacenes
                    </button>
                </div>

                <div style={{ padding: '1rem' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando datos...</p>
                    ) : (
                        <>
                            {activeTab === 'materiales' && renderMateriales()}
                            {activeTab === 'categorias' && renderCategorias()}
                            {activeTab === 'almacenes' && renderAlmacenes()}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
