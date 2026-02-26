"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Activity, Plus, Trash2, Save, ShoppingCart, Truck, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
    getMaterialesAll,
    getAlmacenesAll,
    registrarIngreso,
    registrarSalida
} from '@/services/almacenService';
import { getAreasAll } from '@/services/personalService';
import { Material, Almacen, Area } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';

interface MovimientoItem {
    id_material: number;
    nombre: string;
    cantidad: number;
    costo_unitario?: number;
}

export default function MovimientosPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);

    const [header, setHeader] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'ingreso',
        id_almacen: '',
        documento: '',
        id_proveedor: '',
        id_area: '',
        responsable: '',
        observaciones: ''
    });

    const [items, setItems] = useState<MovimientoItem[]>([]);
    const [currentItem, setCurrentItem] = useState({
        id_material: '',
        cantidad: 0,
        costo_unitario: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [m, a, areasData] = await Promise.all([
                getMaterialesAll(),
                getAlmacenesAll(),
                getAreasAll()
            ]);
            setMateriales(m);
            setAlmacenes(a);
            setAreas(areasData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddItem = () => {
        if (!currentItem.id_material || currentItem.cantidad <= 0) return;

        const material = materiales.find(m => m.id_material.toString() === currentItem.id_material);
        if (!material) return;

        setItems([...items, {
            id_material: material.id_material,
            nombre: material.nombre,
            cantidad: currentItem.cantidad,
            costo_unitario: currentItem.costo_unitario
        }]);

        setCurrentItem({ id_material: '', cantidad: 0, costo_unitario: 0 });
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!header.id_almacen || items.length === 0) {
            alert('Por favor complete los campos obligatorios y agregue al menos un material.');
            return;
        }

        setLoading(true);
        try {
            if (header.tipo_movimiento === 'ingreso') {
                await registrarIngreso(header as any, items);
            } else {
                await registrarSalida(header as any, items);
            }
            alert('Movimiento registrado con éxito');
            router.push('/almacen');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Registrar Movimiento"
                description="Control de ingresos de carga y despachos operativos de almacén."
                icon={Activity}
                breadcrumbs={[
                    { label: 'Almacén' },
                    { label: 'Movimientos' }
                ]}
                action={
                    <div className="flex bg-secondary p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setHeader({ ...header, tipo_movimiento: 'ingreso' })}
                            className={`px-6 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${header.tipo_movimiento === 'ingreso'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-500 hover:text-foreground'
                                }`}
                        >
                            Ingreso
                        </button>
                        <button
                            onClick={() => setHeader({ ...header, tipo_movimiento: 'salida' })}
                            className={`px-6 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${header.tipo_movimiento === 'salida'
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'text-slate-500 hover:text-foreground'
                                }`}
                        >
                            Salida
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">
                    <DataSection
                        title="Selección de Insumos"
                        description="Agregue los materiales al documento actual."
                        icon={Plus}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-7">
                                <Select
                                    label="Material / Insumo"
                                    options={materiales.map(m => ({ value: m.id_material.toString(), label: `${m.codigo_material} - ${m.nombre}` }))}
                                    value={currentItem.id_material}
                                    onChange={(e: any) => setCurrentItem({ ...currentItem, id_material: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Cantidad"
                                    type="number"
                                    value={currentItem.cantidad}
                                    onChange={(e: any) => setCurrentItem({ ...currentItem, cantidad: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            {header.tipo_movimiento === 'ingreso' && (
                                <div className="md:col-span-2">
                                    <Input
                                        label="Costo Unit."
                                        type="number"
                                        step="0.01"
                                        value={currentItem.costo_unitario}
                                        onChange={(e: any) => setCurrentItem({ ...currentItem, costo_unitario: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                            <div className={`md:col-span-${header.tipo_movimiento === 'ingreso' ? '1' : '3'}`}>
                                <Button onClick={handleAddItem} icon={Plus} fullWidth className="font-black uppercase tracking-widest text-[10px]">Añadir</Button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Table
                                data={items}
                                keyField="id_material"
                                columns={[
                                    {
                                        header: 'Descripción del Insumo',
                                        accessor: (row: any) => <span className="font-bold text-foreground">{row.nombre}</span>
                                    },
                                    {
                                        header: 'Cantidad',
                                        accessor: (row: any) => <span className="font-black text-blue-500">{row.cantidad}</span>,
                                        align: 'right',
                                        width: '120px'
                                    }
                                ]}
                                actions={(row, index) => (
                                    <button
                                        onClick={() => handleRemoveItem(index || 0)}
                                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                hover
                            />
                        </div>
                    </DataSection>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <DataSection
                        title="Cabecera del Documento"
                        description="Validación de destino y responsabilidades."
                        icon={FileText}
                    >
                        <div className="space-y-6">
                            <Select
                                label="Almacén Objetivo"
                                options={almacenes.map(a => ({ value: a.id_almacen.toString(), label: a.nombre }))}
                                value={header.id_almacen}
                                onChange={(e: any) => setHeader({ ...header, id_almacen: e.target.value })}
                                required
                            />

                            {header.tipo_movimiento === 'ingreso' ? (
                                <>
                                    <Input
                                        label="Referencia / N° Guía"
                                        placeholder="Ej: GR-00123"
                                        value={header.documento}
                                        onChange={(e: any) => setHeader({ ...header, documento: e.target.value })}
                                    />
                                    <Input
                                        label="Entidad Proveedora"
                                        placeholder="Nombre del proveedor"
                                        value={header.id_proveedor}
                                        onChange={(e: any) => setHeader({ ...header, id_proveedor: e.target.value })}
                                    />
                                </>
                            ) : (
                                <>
                                    <Select
                                        label="Área Solicitante"
                                        options={areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))}
                                        value={header.id_area}
                                        onChange={(e: any) => setHeader({ ...header, id_area: e.target.value })}
                                    />
                                    <Input
                                        label="Responsable del Pedido"
                                        placeholder="Nombre completo"
                                        value={header.responsable}
                                        onChange={(e: any) => setHeader({ ...header, responsable: e.target.value })}
                                    />
                                </>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500 pl-1">Notas de Operación</label>
                                <textarea
                                    className="w-full p-4 bg-secondary border border-border rounded-xl text-sm text-foreground focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 min-h-[100px] transition-all resize-none"
                                    value={header.observaciones}
                                    onChange={(e) => setHeader({ ...header, observaciones: e.target.value })}
                                    placeholder="Observaciones adicionales..."
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                isLoading={loading}
                                icon={Save}
                                fullWidth
                                className="font-black uppercase tracking-widest text-[12px] py-4 shadow-lg shadow-blue-500/20"
                            >
                                Registrar Operación
                            </Button>
                        </div>
                    </DataSection>

                    <div className="p-6 bg-blue-600 rounded-2xl text-white space-y-3 shadow-lg shadow-blue-600/20">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Protocolo de Control</p>
                        </div>
                        <p className="text-xs font-bold opacity-80 leading-relaxed">
                            Asegúrese de que el conteo físico coincida con el registro. Toda operación tiene trazabilidad de auditoría.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
