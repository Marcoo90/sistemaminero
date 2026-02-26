"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useDebounce from '@/hooks/useDebounce';
import { Personal, Area } from '@/types';
import {
    getPersonalAll,
    deletePersonal,
    updatePersonal,
    createPersonal,
    getAreasAll
} from '@/services/personalService';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import PersonalForm from '@/components/personal/PersonalForm';
import Modal from '@/components/ui/Modal';
import { Plus, Edit, Trash2, Search, Users, Activity, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function PersonalPage() {
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
    const { user, canEdit, hasAccess } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [areaFilter, setAreaFilter] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, aData] = await Promise.all([
                getPersonalAll(),
                getAreasAll()
            ]);
            setPersonal(pData);
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
        if (confirm('¿Está seguro de eliminar este registro?')) {
            await deletePersonal(id);
            fetchData();
        }
    };

    const handleSave = async (data: Omit<Personal, 'id_personal'>) => {
        if (editingId) {
            await updatePersonal(editingId, data);
        } else {
            await createPersonal(data);
        }
        setView('list');
        fetchData();
    };

    const getAreaName = (id: number) => areas.find(a => a.id_area === id)?.nombre_area || 'Desconocido';

    const debouncedSearch = useDebounce(searchTerm, 300);

    const filteredPersonal = useMemo(() => {
        return personal.filter(person => {
            const q = debouncedSearch.toLowerCase();
            const matchesSearch =
                person.nombres.toLowerCase().includes(q) ||
                person.cargo.toLowerCase().includes(q) ||
                person.dni.includes(q);

            const matchesArea = areaFilter === '' || person.id_area.toString() === areaFilter;

            return matchesSearch && matchesArea;
        });
    }, [personal, debouncedSearch, areaFilter]);

    const initialPersonal = editingId ? personal.find(p => p.id_personal === editingId) : undefined;

    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <Users size={12} strokeWidth={3} />
                        Capital Humano
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Directorio de <span className="text-blue-500 font-medium">Personal</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Gestión integral de colaboradores, perfiles operativos y control administrativo minero.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-secondary p-1 rounded-xl border border-border mr-2">
                        <Link href="/personal/contratos" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-colors">Contratos</Link>
                        <Link href="/personal/epp" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 transition-colors border-l border-border">EPP</Link>
                    </div>
                    {!isReadOnly && (
                        <Button onClick={handleCreate} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-6">
                            Nuevo Registro
                        </Button>
                    )}
                </div>
            </div>

            {/* Workforce Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    label="Colaboradores Totales"
                    value={personal.length}
                    icon={Users}
                    color="primary"
                    trend={2}
                    trendLabel="este mes"
                />
                <StatCard
                    label="Personal Activo"
                    value={personal.filter(p => p.estado === 'activo').length}
                    icon={Shield}
                    color="success"
                />
                <StatCard
                    label="Áreas Operativas"
                    value={areas.length}
                    icon={Activity}
                    color="info"
                />
                <StatCard
                    label="Disponibilidad"
                    value="96"
                    unit="%"
                    icon={TrendingUp}
                    color="warning"
                />
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                {/* Advanced Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={3} />
                        <Input
                            placeholder="Buscar por nombre, cargo o DNI..."
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
                        />
                    </div>
                </div>

                {/* Data Table Wrapper */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Base de Datos...</p>
                    </div>
                ) : (
                    <Table
                        data={filteredPersonal}
                        keyField="id_personal"
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'Identificación',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="text-foreground font-bold">{row.dni}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">DNI Principal</p>
                                </div>,
                                width: '140px'
                            },
                            {
                                header: 'Nombre Completo',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="font-bold text-foreground">{row.nombres}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{row.cargo}</p>
                                </div>
                            },
                            {
                                header: 'Asignación',
                                accessor: (row: any) => <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-foreground/80">{getAreaName(row.id_area)}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unidad Operativa</p>
                                </div>
                            },
                            {
                                header: 'Registro',
                                accessor: (row: any) => (
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{row.fecha_registro?.split(',')[0]}</p>
                                        <p className="text-[10px] text-blue-500/60 font-black uppercase tracking-tighter">{row.fecha_registro?.split(',')[1]}</p>
                                    </div>
                                ),
                                width: '130px'
                            },
                            {
                                header: 'Estado',
                                accessor: (row: any) => (
                                    <Badge variant={row.estado === 'activo' ? 'success' : 'danger'}>
                                        {row.estado}
                                    </Badge>
                                ),
                                width: '120px',
                                align: 'center'
                            }
                        ]}
                        actions={(row) => (
                            <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleEdit(row.id_personal)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(row.id_personal)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        hover
                    />
                )}
            </div>

            <Modal open={view === 'form'} title={editingId ? 'Actualizar Colaborador' : 'Registrar Nuevo Colaborador'} onClose={() => setView('list')}>
                <div className="p-8">
                    <PersonalForm
                        initialData={initialPersonal}
                        onSave={handleSave}
                        onCancel={() => setView('list')}
                    />
                </div>
            </Modal>
        </div>
    );
}
