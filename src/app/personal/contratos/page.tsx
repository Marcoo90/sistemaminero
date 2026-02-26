"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Plus, Calendar, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { getPersonalAll, getContratos, createContrato } from '@/services/personalService';
import { Personal, Contrato } from '@/types';
import Link from 'next/link';
import ContratoForm from '@/components/personal/ContratoForm';
import { generateContractPDF } from '@/utils/pdfUtils';
import { generateContratosPDF } from '@/utils/reportGenerators';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import StatsGrid from '@/components/layout/StatsGrid';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

export default function ContratosPage() {
    const [loading, setLoading] = useState(true);
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [contratos, setContratos] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const pathname = usePathname();
    const router = useRouter();
    const { canEdit, hasAccess } = useAuth();

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
            const p = await getPersonalAll();
            setPersonal(p);
            const allC = await Promise.all(p.map((person: Personal) => getContratos(person.id_personal)));
            setContratos(allC.flat().map((c: any) => ({
                ...c,
                empleado: p.find((person: Personal) => person.id_personal === c.id_personal)?.nombres || 'Desconocido'
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPDF = (contrato: Contrato) => {
        const person = personal.find(p => p.id_personal === contrato.id_personal);
        generateContractPDF(contrato, person);
    };

    const handleRenovar = (contrato: Contrato) => {
        alert(`Iniciando proceso de renovación para el contrato ${contrato.id_contrato}...`);
    };

    const handleSave = async (data: Omit<Contrato, 'id_contrato'>) => {
        try {
            await createContrato(data);
            setView('list');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    if (view === 'form') {
        return (
            <div className="space-y-10 animate-fade-in">
                <PageHeader
                    title="Generar Nuevo Contrato"
                    description="Creación de documentos contractuales para el personal."
                    icon={FileText}
                    breadcrumbs={[
                        { label: 'Administración' },
                        { label: 'Contratos', href: '/personal/contratos' },
                        { label: 'Nuevo' }
                    ]}
                />
                <ContratoForm onSave={handleSave} onCancel={() => setView('list')} />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Gestión de Contratos"
                description="Control de vigencia, tipos de contratación y documentos legales del personal."
                icon={FileText}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Personal', href: '/personal' },
                    { label: 'Contratos' }
                ]}
                action={
                    <div className="flex gap-3">
                        <Button variant="outline" icon={FileText} onClick={() => {
                            const personalMap: Record<number, string> = {};
                            personal.forEach(p => personalMap[p.id_personal] = p.nombres);
                            generateContratosPDF(contratos, personalMap);
                        }} className="font-black uppercase tracking-widest text-[10px]">Reporte PDF</Button>
                        {!isReadOnly && (
                            <Button icon={Plus} onClick={() => setView('form')} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10">Nuevo Contrato</Button>
                        )}
                    </div>
                }
            />

            <StatsGrid
                stats={[
                    {
                        label: 'Vigentes',
                        value: contratos.filter(c => c.estado === 'vigente').length,
                        icon: ShieldCheck,
                        color: 'success'
                    },
                    {
                        label: 'Por Vencer (30d)',
                        value: 2, // Mock or calculated
                        icon: Clock,
                        color: 'warning'
                    },
                    {
                        label: 'Vencidos',
                        value: contratos.filter(c => c.estado === 'vencido').length,
                        icon: AlertCircle,
                        color: 'danger'
                    }
                ]}
                columns={3}
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando contratos...</p>
                    </div>
                ) : (
                    <Table
                        data={contratos}
                        keyField="id_contrato"
                        readOnly={isReadOnly}
                        columns={[
                            {
                                header: 'Colaborador',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">{row.empleado}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.tipo_contrato.replace('_', ' ')}</p>
                                    </div>
                                )
                            },
                            {
                                header: 'Vigencia',
                                accessor: (row) => (
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium">{row.fecha_inicio}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">Hasta: {row.fecha_fin}</span>
                                    </div>
                                )
                            },
                            {
                                header: 'Sueldo Base',
                                accessor: (row) => <span className="font-black text-foreground">S/ {row.sueldo_base.toLocaleString()}</span>,
                                align: 'right'
                            },
                            {
                                header: 'Estado',
                                accessor: (row) => (
                                    <Badge variant={row.estado === 'vigente' ? 'success' : row.estado === 'vencido' ? 'danger' : 'info'}>
                                        {row.estado.toUpperCase()}
                                    </Badge>
                                ),
                                width: '120px',
                                align: 'center'
                            }
                        ]}
                        actions={(row) => (
                            <div className="flex gap-1 justify-end">
                                {!isReadOnly && (
                                    <button onClick={() => handleRenovar(row)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Renovar">
                                        <Calendar size={16} />
                                    </button>
                                )}
                                <button onClick={() => handleViewPDF(row)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver PDF">
                                    <FileText size={16} />
                                </button>
                            </div>
                        )}
                        hover
                    />
                )}
            </DataSection>
        </div>
    );
}
