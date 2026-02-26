"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, ArrowLeft, Activity, AlertTriangle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import {
    getMaterialesAll,
    getAllStock,
    getAlmacenesAll,
    getCategoriasAll
} from '@/services/almacenService';
import { getAreasAll } from '@/services/personalService';
import { Material, StockMaterial, Almacen, CategoriaMaterial, Area } from '@/types';
import { exportInventarioToExcel } from '@/utils/excelUtils';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';

export default function InventarioPage() {
    const [loading, setLoading] = useState(true);
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [stock, setStock] = useState<StockMaterial[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [almacenFilter, setAlmacenFilter] = useState<string>('all');
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [showLowStock, setShowLowStock] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [m, s, a, c, areasData] = await Promise.all([
                getMaterialesAll(),
                getAllStock(),
                getAlmacenesAll(),
                getCategoriasAll(),
                getAreasAll()
            ]);
            setMateriales(m);
            setStock(s);
            setAlmacenes(a);
            setCategorias(c);
            setAreas(areasData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const inventoryData = useMemo(() => {
        return materiales.map(m => {
            const sTotal = stock
                .filter(s => s.id_material === m.id_material && (almacenFilter === 'all' || s.id_almacen.toString() === almacenFilter))
                .reduce((acc, curr) => acc + curr.stock_actual, 0);

            return {
                ...m,
                stock_actual: sTotal,
                isLow: sTotal <= m.stock_minimo
            };
        }).filter(item => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = item.nombre.toLowerCase().includes(q) ||
                item.codigo_material.toLowerCase().includes(q);
            const matchesLowStock = !showLowStock || item.isLow;
            const matchesArea = areaFilter === 'all' ||
                item.id_area?.toString() === areaFilter ||
                item.area?.id_area.toString() === areaFilter;
            return matchesSearch && matchesLowStock && matchesArea;
        });
    }, [materiales, stock, searchTerm, almacenFilter, areaFilter, showLowStock]);

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Inventario Global"
                description="Control de existencias, stock mínimo y valoración de activos en tiempo real."
                icon={Package}
                breadcrumbs={[
                    { label: 'Almacén' },
                    { label: 'Inventario' }
                ]}
                action={
                    <Button
                        variant="primary"
                        icon={FileDown}
                        onClick={() => exportInventarioToExcel(materiales, stock, categorias, almacenes)}
                        className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8"
                    >
                        Exportar Excel
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Materiales Totales"
                    value={materiales.length}
                    icon={Package}
                    color="primary"
                />
                <StatCard
                    label="Stock Crítico"
                    value={materiales.filter(m => {
                        const sTotal = stock.filter(s => s.id_material === m.id_material).reduce((acc, curr) => acc + curr.stock_actual, 0);
                        return sTotal <= m.stock_minimo;
                    }).length}
                    icon={AlertTriangle}
                    color="danger"
                />
                <StatCard
                    label="Almacenes"
                    value={almacenes.length}
                    icon={Activity}
                    color="info"
                />
            </div>

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={3} />
                        <Input
                            placeholder="Buscar por código o nombre..."
                            value={searchTerm}
                            onChange={(e: any) => setSearchTerm(e.target.value)}
                            className="pl-11 border-transparent bg-secondary focus:bg-card focus:border-blue-500/20"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            options={[
                                { value: 'all', label: 'Todos los Almacenes' },
                                ...almacenes.map(a => ({ value: a.id_almacen.toString(), label: a.nombre }))
                            ]}
                            value={almacenFilter}
                            onChange={(e: any) => setAlmacenFilter(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            options={[
                                { value: 'all', label: 'Todas las Áreas' },
                                ...areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))
                            ]}
                            value={areaFilter}
                            onChange={(e: any) => setAreaFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowLowStock(!showLowStock)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showLowStock
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'bg-secondary text-slate-500 hover:bg-slate-500/10'
                            }`}
                    >
                        <AlertTriangle size={14} />
                        Stock Crítico
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando inventario...</p>
                    </div>
                ) : (
                    <Table
                        data={inventoryData}
                        keyField="id_material"
                        columns={[
                            {
                                header: 'Código',
                                accessor: (row: any) => <span className="font-bold text-blue-500 uppercase tracking-wider">{row.codigo_material}</span>,
                                width: '140px'
                            },
                            {
                                header: 'Área',
                                accessor: (row: any) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-secondary px-2 py-1 rounded-md">{row.area?.nombre_area || 'Sin Área'}</span>,
                                width: '150px'
                            },
                            {
                                header: 'Fecha',
                                accessor: (row: any) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {row.fecha_registro ? (row.fecha_registro.includes(',') ? row.fecha_registro.split(',')[0] : row.fecha_registro) : '-'}
                                </span>,
                                width: '120px'
                            },
                            {
                                header: 'Descripción del Material',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="font-bold text-foreground">{row.nombre}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{row.unidad_medida}</p>
                                </div>,
                                width: '250px'
                            },
                            {
                                header: 'Especificación',
                                accessor: (row: any) => <span className="text-[11px] text-slate-500 italic">{row.descripcion || '-'}</span>,
                                width: '200px'
                            },
                            {
                                header: 'Min.',
                                accessor: 'stock_minimo',
                                align: 'center',
                                width: '100px'
                            },
                            {
                                header: 'Stock Actual',
                                accessor: (row: any) => <span className={`text-base font-black ${row.isLow ? 'text-red-500' : 'text-emerald-500'}`}>{row.stock_actual}</span>,
                                align: 'right',
                                width: '140px'
                            },
                            {
                                header: 'Condición',
                                accessor: (row: any) => (
                                    <Badge variant={row.isLow ? 'danger' : 'success'}>
                                        {row.isLow ? 'CRÍTICO' : 'ÓPTIMO'}
                                    </Badge>
                                ),
                                align: 'center',
                                width: '120px'
                            }
                        ]}
                        hover
                    />
                )}
            </div>
        </div>
    );
}
