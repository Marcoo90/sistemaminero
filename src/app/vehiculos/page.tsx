"use client";

import React, { useState, useEffect } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { usePathname, useRouter } from 'next/navigation';
import { Vehiculo, Area } from '@/types';
import { getVehiculosAll, createVehiculo, updateVehiculo, deleteVehiculo } from '@/services/vehiculoService';
import { getAreasAll } from '@/services/personalService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import VehiculoForm from '@/components/vehiculos/VehiculoForm';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Truck, Search } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function VehiculosPage() {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
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

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState('');

    const debouncedSearch = useDebounce(searchTerm, 300);

    const filteredVehiculos = vehiculos.filter(v => {
        const q = debouncedSearch.toLowerCase();
        const matchesSearch =
            v.placa.toLowerCase().includes(q) ||
            v.marca.toLowerCase().includes(q) ||
            v.codigo_vehiculo.toLowerCase().includes(q);
        const matchesArea = areaFilter ? v.id_area.toString() === areaFilter : true;
        return matchesSearch && matchesArea;
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vData, aData] = await Promise.all([
                getVehiculosAll(),
                getAreasAll()
            ]);
            setVehiculos(vData);
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
        if (confirm('¿Está seguro de eliminar este vehículo?')) {
            await deleteVehiculo(id);
            fetchData();
        }
    };

    const handleSave = async (data: Omit<Vehiculo, 'id_vehiculo'>) => {
        if (editingId) {
            await updateVehiculo(editingId, data);
        } else {
            await createVehiculo(data);
        }
        setView('list');
        fetchData();
    };

    const getAreaName = (id: number) => areas.find(a => a.id_area === id)?.nombre_area || 'Desconocido';

    const initialVehiculo = editingId ? vehiculos.find(v => v.id_vehiculo === editingId) : undefined;

    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <Truck size={12} strokeWidth={3} />
                        Gestión de Activos
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Flota <span className="text-blue-500 font-medium">Vehicular</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Control centralizado de camionetas, maquinaria pesada y unidades de transporte logístico.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {canEdit(pathname) && (
                        <Button onClick={handleCreate} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-6">
                            Registrar Unidad
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm items-center">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={3} />
                    <Input
                        placeholder="Buscar por placa, marca o código..."
                        value={searchTerm}
                        onChange={(e: any) => setSearchTerm(e.target.value)}
                        className="pl-11 border-transparent bg-secondary focus:bg-card focus:border-blue-500/20 text-foreground"
                    />
                </div>
                <div className="w-full md:w-64">
                    <Select
                        options={[
                            { value: '', label: 'Todas las Áreas' },
                            ...areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))
                        ]}
                        value={areaFilter}
                        onChange={(e: any) => setAreaFilter(e.target.value)}
                        className="bg-secondary border-transparent focus:border-blue-500/20"
                    />
                </div>
            </div>

            {/* Table Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                    <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando flota...</p>
                </div>
            ) : (
                <Table
                    data={filteredVehiculos}
                    keyField="id_vehiculo"
                    readOnly={!canEdit(pathname)}
                    columns={[
                        {
                            header: 'Identificación',
                            accessor: (row: any) => (
                                <div className="space-y-0.5">
                                    <p className="text-foreground font-bold">{row.placa}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{row.codigo_vehiculo}</p>
                                </div>
                            ),
                            width: '140px'
                        },
                        { header: 'Tipo', accessor: 'tipo' },
                        {
                            header: 'SOAT',
                            accessor: (row: any) => (
                                <Badge variant={row.soat === 'Vigente' ? 'success' : 'danger'}>
                                    {row.soat}
                                </Badge>
                            )
                        },
                        {
                            header: 'Marca/Modelo',
                            accessor: (row: any) => (
                                <div className="space-y-0.5">
                                    <p className="font-bold text-foreground">{row.marca}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{row.modelo}</p>
                                </div>
                            )
                        },
                        { header: 'Área', accessor: (row: any) => getAreaName(row.id_area) },
                        {
                            header: 'Kilometraje',
                            accessor: (row: any) => (
                                <span className="font-bold text-foreground">
                                    {row.km_horometro.toLocaleString()} <span className="text-[10px] text-slate-500 text-xs">KM</span>
                                </span>
                            ),
                            align: 'right'
                        },
                        {
                            header: 'Próximo Mant.',
                            accessor: (row: any) => (
                                <span className="font-bold text-blue-500">
                                    {row.km_mantenimiento.toLocaleString()} <span className="text-[10px] text-blue-500/50 text-xs">KM</span>
                                </span>
                            ),
                            align: 'right'
                        },
                        {
                            header: 'Estado',
                            accessor: (row: any) => (
                                <Badge variant={row.estado === 'operativo' ? 'success' : row.estado === 'taller' ? 'warning' : 'danger'}>
                                    {row.estado}
                                </Badge>
                            ),
                            width: '120px',
                            align: 'center'
                        },
                    ]}
                    actions={(row) => (
                        <div className="flex gap-1 justify-end">
                            <button onClick={() => handleEdit(row.id_vehiculo)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(row.id_vehiculo)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                    hover
                />
            )}

            <Modal open={view === 'form'} title={editingId ? 'Actualizar Unidad' : 'Registrar Nueva Unidad'} onClose={() => setView('list')}>
                <div className="p-8">
                    <VehiculoForm
                        initialData={initialVehiculo}
                        onSave={async (data) => { await handleSave(data); setView('list'); }}
                        onCancel={() => setView('list')}
                    />
                </div>
            </Modal>
        </div>
    );
}
