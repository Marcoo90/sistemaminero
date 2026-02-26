"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Plus, Save, User, Package, Calendar, CheckCircle, Activity, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getPersonalAll, registrarEntregaEPP, getEntregaEPPAll, getAreasAll, deleteEntregaEPP } from '@/services/personalService';
import { getMaterialesAll, getAlmacenesAll, getCategoriasAll } from '@/services/almacenService';
import { Personal, Material, Almacen, CategoriaMaterial, Area } from '@/types';
import Link from 'next/link';
import { generateEPPPDF } from '@/utils/reportGenerators';
import { Badge } from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { useAuth } from '@/context/AuthContext';

export default function EntregaEPPPage() {
    const [loading, setLoading] = useState(false);
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [selectedCategoria, setSelectedCategoria] = useState<string>('');
    const pathname = usePathname();
    const router = useRouter();
    const { user, canEdit, hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    const [entrega, setEntrega] = useState({
        id_personal: '',
        fecha: new Date().toISOString().split('T')[0],
        id_almacen: '',
        responsable_entrega: 'Admin',
        firmado: true,
        observaciones: ''
    });

    const [items, setItems] = useState<any[]>([]);
    const [currentItem, setCurrentItem] = useState({
        id_material: '',
        cantidad: 1,
        talla: ''
    });

    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchData();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const h = await getEntregaEPPAll();
            setHistory(h);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchData = async () => {
        const [p, m, a, c, areasData] = await Promise.all([
            getPersonalAll(),
            getMaterialesAll(),
            getAlmacenesAll(),
            getCategoriasAll(),
            getAreasAll()
        ]);
        setPersonal(p);
        setMateriales(m);
        setAlmacenes(a);
        setCategorias(c);
        setAreas(areasData || []);
        if (c.length > 0) setSelectedCategoria(c[0].id_categoria.toString());
    };

    const filteredMateriales = materiales.filter(m =>
        !selectedCategoria || m.id_categoria.toString() === selectedCategoria
    );

    const handleAddItem = () => {
        if (!currentItem.id_material) {
            alert('Seleccione un equipo de protección');
            return;
        }
        const mat = materiales.find(m => m.id_material.toString() === currentItem.id_material);
        if (!mat) return;

        const existingIdx = items.findIndex(item => item.id_material === mat.id_material && item.talla === currentItem.talla);

        if (existingIdx > -1) {
            const newItems = [...items];
            newItems[existingIdx].cantidad += currentItem.cantidad;
            setItems(newItems);
        } else {
            setItems([...items, {
                ...currentItem,
                nombre: mat.nombre,
                id_material: mat.id_material,
                tempId: Date.now()
            }]);
        }

        setCurrentItem({ id_material: '', cantidad: 1, talla: '' });
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este registro de entrega? Esta acción desvinculará los materiales del historial y es irreversible.')) {
            try {
                await deleteEntregaEPP(id);
                fetchHistory();
            } catch (error) {
                console.error(error);
                alert('Error al eliminar el registro');
            }
        }
    };

    const handleSave = async () => {
        if (!entrega.id_personal || items.length === 0) {
            alert('Por favor complete los datos y agregue al menos un EPP');
            return;
        }
        setLoading(true);
        try {
            await registrarEntregaEPP(entrega, items);
            alert('Entrega registrada correctamente');
            setEntrega({
                id_personal: '',
                fecha: new Date().toISOString().split('T')[0],
                id_almacen: '',
                responsable_entrega: 'Admin',
                firmado: true,
                observaciones: ''
            });
            setItems([]);
            fetchHistory(); // Refresh history table
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Error al registrar la entrega');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Entrega de Material y EPP"
                description="Registro y control de dotación de materiales y equipos de protección."
                icon={Shield}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Personal', href: '/personal' },
                    { label: 'Entrega Material' }
                ]}
                action={
                    <Button
                        variant="outline"
                        icon={Activity}
                        onClick={async () => {
                            try {
                                const history = await getEntregaEPPAll();
                                generateEPPPDF(history);
                            } catch (error) {
                                console.error(error);
                                alert('Error al generar reporte');
                            }
                        }}
                        className="font-black uppercase tracking-widest text-[10px]"
                    >
                        Reporte PDF
                    </Button>
                }
            />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-8">
                    <DataSection
                        title="Selección de Equipos"
                        description="Agregue los materiales que serán entregados al colaborador."
                        icon={Package}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-3">
                                <Select
                                    label="Categoría"
                                    options={categorias.map(c => ({ value: c.id_categoria.toString(), label: c.nombre }))}
                                    value={selectedCategoria}
                                    onChange={(e: any) => setSelectedCategoria(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4">
                                <Select
                                    label="Material / Equipo"
                                    options={filteredMateriales.map(m => ({ value: m.id_material.toString(), label: m.nombre }))}
                                    value={currentItem.id_material}
                                    onChange={(e: any) => setCurrentItem({ ...currentItem, id_material: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Cantidad"
                                    type="number"
                                    value={currentItem.cantidad}
                                    onChange={(e: any) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <Input
                                    label="Talla/Medida"
                                    value={currentItem.talla}
                                    onChange={(e: any) => setCurrentItem({ ...currentItem, talla: e.target.value })}
                                    placeholder="Ej: L, 42"
                                />
                            </div>
                            {!isReadOnly && (
                                <div className="md:col-span-2">
                                    <Button onClick={handleAddItem} icon={Plus} fullWidth className="font-black uppercase tracking-widest text-[10px]">Añadir</Button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <Table
                                data={items}
                                keyField="tempId"
                                columns={[
                                    {
                                        header: 'Categoría',
                                        accessor: (row) => {
                                            const mat = materiales.find(m => m.id_material === row.id_material);
                                            return (mat as any)?.categoria?.nombre || '-';
                                        }
                                    },
                                    { header: 'Material', accessor: 'nombre' },
                                    { header: 'Cantidad', accessor: 'cantidad', align: 'center' },
                                    { header: 'Talla', accessor: (row) => row.talla || '-', align: 'center' }
                                ]}
                                readOnly={isReadOnly}
                                actions={(row, index) => (
                                    !isReadOnly && (
                                        <button onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Remover">
                                            <Plus className="rotate-45" size={16} />
                                        </button>
                                    )
                                )}
                            />
                        </div>
                    </DataSection>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <DataSection
                        title="Datos de Entrega"
                        description="Información obligatoria para el cargo."
                        icon={User}
                    >
                        <div className="space-y-6">
                            <Select
                                label="Colaborador"
                                options={personal.map(p => ({ value: p.id_personal.toString(), label: p.nombres }))}
                                value={entrega.id_personal}
                                onChange={(e: any) => setEntrega({ ...entrega, id_personal: e.target.value })}
                                required
                            />
                            {entrega.id_personal && (
                                <Input
                                    label="Área del Colaborador"
                                    value={(() => {
                                        const p = personal.find(pers => pers.id_personal.toString() === entrega.id_personal);
                                        const area = areas.find(a => a.id_area === p?.id_area);
                                        return area?.nombre_area || 'Sin área asignada';
                                    })()}
                                    disabled
                                    className="bg-secondary/50 font-bold"
                                />
                            )}
                            <Input
                                label="Fecha de Registro"
                                type="date"
                                value={entrega.fecha}
                                onChange={(e: any) => setEntrega({ ...entrega, fecha: e.target.value })}
                            />
                            <Select
                                label="Almacén de Origen"
                                options={almacenes.map(a => ({ value: a.id_almacen.toString(), label: a.nombre }))}
                                value={entrega.id_almacen}
                                onChange={(e: any) => setEntrega({ ...entrega, id_almacen: e.target.value })}
                                required
                            />

                            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                                <input
                                    type="checkbox"
                                    id="firmado"
                                    checked={entrega.firmado}
                                    onChange={(e) => setEntrega({ ...entrega, firmado: e.target.checked })}
                                    className="w-5 h-5 rounded-md border-border bg-card text-blue-500 focus:ring-blue-500"
                                />
                                <label htmlFor="firmado" className="text-sm font-bold text-foreground/80 cursor-pointer">
                                    Confirmar firma de cargo
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500 pl-1">Observaciones</label>
                                <textarea
                                    placeholder="Detalles adicionales..."
                                    value={entrega.observaciones}
                                    onChange={(e) => setEntrega({ ...entrega, observaciones: e.target.value })}
                                    className="w-full p-4 bg-secondary border border-border rounded-xl text-sm text-foreground focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 min-h-[100px] transition-all resize-none"
                                />
                            </div>

                            {!isReadOnly && (
                                <Button
                                    onClick={handleSave}
                                    icon={Save}
                                    isLoading={loading}
                                    fullWidth
                                    className="font-black uppercase tracking-widest text-[12px] py-4 shadow-lg shadow-blue-500/20"
                                >
                                    Registrar Entrega
                                </Button>
                            )}
                        </div>
                    </DataSection>
                </div>

                <div className="xl:col-span-12">
                    <DataSection
                        title="Historial Reciente"
                        description="Últimas entregas de EPP registradas en el sistema."
                        icon={Activity}
                    >
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Activity className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Cargando historial...</p>
                            </div>
                        ) : (
                            <Table
                                data={history}
                                keyField="id_entrega_epp"
                                columns={[
                                    { header: 'Fecha', accessor: 'fecha' },
                                    { header: 'Colaborador', accessor: (row) => row.personal?.nombres || 'No asignado' },
                                    {
                                        header: 'Área',
                                        accessor: (row) => {
                                            const areaId = row.personal?.id_area;
                                            const area = areas.find(a => a.id_area === areaId);
                                            return area?.nombre_area || '-';
                                        }
                                    },
                                    { header: 'Responsable', accessor: 'responsable_entrega' },
                                    {
                                        header: 'Equipos Entregados',
                                        accessor: (row) => (
                                            <div className="flex flex-wrap gap-1">
                                                {row.detalles?.map((d: any, idx: number) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                        {d.material?.nombre} ({d.cantidad})
                                                    </span>
                                                ))}
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'Total Items',
                                        accessor: (row) => row.detalles?.length || 0,
                                        align: 'center'
                                    },
                                    {
                                        header: 'Estado',
                                        accessor: (row) => (
                                            <Badge variant={row.firmado ? 'success' : 'warning'}>
                                                {row.firmado ? 'Firmado' : 'Pendiente'}
                                            </Badge>
                                        ),
                                        align: 'center'
                                    }
                                ]}
                                actions={(row) => (
                                    user?.role === 'admin' && (
                                        <button onClick={() => handleDelete(row.id_entrega_epp)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    )
                                )}
                            />
                        )}
                    </DataSection>
                </div>
            </div>
        </div>
    );
}
