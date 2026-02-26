"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FileBarChart, FileSpreadsheet, Download, PieChart, TrendingUp, Loader2, Table as TableIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { getPersonalAll } from '@/services/personalService';
import { getAsistenciasByMonth } from '@/services/asistenciaService';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { useAuth } from '@/context/AuthContext';

interface ReportData {
    dni: string;
    nombres: string;
    cargo: string;
    dias_trabajados: number;
    turnos_totales: number;
    faltas: number;
    tardanzas: number;
}

export default function ReportesPage() {
    const [loadingReport, setLoadingReport] = useState<number | null>(null);
    const [previewData, setPreviewData] = useState<ReportData[] | null>(null);
    const [activeReportName, setActiveReportName] = useState<string>("");
    const pathname = usePathname();
    const router = useRouter();
    const { hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const reports = [
        { id: 1, title: 'Asistencia Mensual', desc: 'Archivo Excel (.xlsx) detallado con control de turnos y cumplimiento.', icon: FileSpreadsheet, type: 'xlsx' },
        { id: 2, title: 'Consumo de Combustible', desc: 'Análisis de gasto por vehículo y área operativa.', icon: TrendingUp, type: 'pdf' },
        { id: 3, title: 'Mantenimiento Preventivo', desc: 'Próximos servicios programados por horómetro.', icon: PieChart, type: 'xlsx' },
        { id: 4, title: 'Vales y Gastos', desc: 'Resumen detallado de vales administrativos y gastos operativos.', icon: FileBarChart, type: 'xlsx' },
        { id: 5, title: 'Órdenes de Servicio/Compra', desc: 'Seguimiento de órdenes emitidas, estados y responsables.', icon: FileSpreadsheet, type: 'pdf' },
        { id: 6, title: 'Inventario de Equipos', desc: 'Listado completo de equipos, estados y áreas asignadas.', icon: TableIcon, type: 'xlsx' },
        { id: 7, title: 'Flota de Vehículos', desc: 'Estado actual de la flota, kilometraje y documentos.', icon: TrendingUp, type: 'xlsx' },
        { id: 8, title: 'Stock de Almacén', desc: 'Reporte de existencias, categorías y niveles mínimos.', icon: FileSpreadsheet, type: 'xlsx' },
    ];

    const calculateReportData = async (reportId: number): Promise<any[]> => {
        const SELECTED_MONTH = new Date().getMonth();
        const SELECTED_YEAR = 2026;

        switch (reportId) {
            case 1: // Asistencia
                const [personalesAsis, asistencias] = await Promise.all([
                    getPersonalAll(),
                    getAsistenciasByMonth(SELECTED_MONTH, SELECTED_YEAR)
                ]);
                return personalesAsis.map((p: any) => {
                    const pAsis = asistencias.filter((a: any) => a.id_personal === p.id_personal);
                    const diasTrabajados = pAsis.filter((a: any) => (a.turno_dia || a.turno_noche || a.estado === 'presente' || a.estado === 'tardanza') && a.estado !== 'falta').length;
                    return {
                        dni: p.dni,
                        nombres: p.nombres,
                        cargo: p.cargo,
                        dias_trabajados: diasTrabajados,
                        faltas: pAsis.filter((a: any) => a.estado === 'falta').length,
                        tardanzas: pAsis.filter((a: any) => a.estado === 'tardanza').length,
                    };
                });

            case 2: { // Consumo de Combustible
                const { getFuelLogs } = await import('@/services/vehiculoService');
                const logs = await getFuelLogs();
                return logs.map((l: any) => ({
                    'Fecha': l.fecha,
                    'Vehículo': l.vehiculo?.placa || 'Desconocido',
                    'Combustible': l.vehiculo?.combustible_tipo || '-',
                    'Litros': l.litros,
                    'Precio/L': l.precio_litro,
                    'Total': l.costo_total,
                    'Km Actual': l.km_horometro,
                    'Conductor': l.conductor || '-',
                    'Proveedor': l.proveedor || '-'
                }));
            }

            case 3: { // Mantenimiento Preventivo
                const { getEquiposAll } = await import('@/services/equipoService');
                const { getVehiculosAll } = await import('@/services/vehiculoService');
                const [equipos3, vehiculos3] = await Promise.all([getEquiposAll(), getVehiculosAll()]);

                const maintenanceList: any[] = [];

                equipos3.forEach((e: any) => {
                    const usage = e.horometro;
                    const target = e.horometro_mantenimiento;
                    const remaining = target - usage;
                    maintenanceList.push({
                        'Tipo': 'Equipo',
                        'Identificador': e.codigo_equipo,
                        'Modelo': e.modelo,
                        'Uso Actual': `${usage} hrs`,
                        'Mantenimiento Programado': `${target} hrs`,
                        'Restante': remaining,
                        'Estado': remaining <= 50 ? 'CRÍTICO' : (remaining <= 250 ? 'PRÓXIMO' : 'OK')
                    });
                });

                vehiculos3.forEach((v: any) => {
                    const usage = v.km_horometro;
                    const target = v.km_mantenimiento;
                    const remaining = target - usage;
                    maintenanceList.push({
                        'Tipo': 'Vehículo',
                        'Identificador': v.placa,
                        'Modelo': v.modelo,
                        'Uso Actual': `${usage} km`,
                        'Mantenimiento Programado': `${target} km`,
                        'Restante': remaining,
                        'Estado': remaining <= 1000 ? 'CRÍTICO' : (remaining <= 5000 ? 'PRÓXIMO' : 'OK')
                    });
                });

                return maintenanceList.sort((a, b) => a['Restante'] - b['Restante']).map(m => ({
                    ...m,
                    'Restante': typeof m['Restante'] === 'number' ? m['Restante'].toFixed(2) : m['Restante']
                }));
            }

            case 4: { // Vales y Gastos
                const { getValesAll } = await import('@/services/adminService');
                const vales = await getValesAll();
                return vales.map(v => ({
                    'Número': v.numero_vale,
                    'Fecha': v.fecha,
                    'Solicitante': v.solicitante,
                    'Concepto': v.concepto,
                    'Monto': v.monto,
                    'Estado': v.estado
                }));
            }

            case 5: { // Órdenes
                const { getOrdenesAll } = await import('@/services/adminService');
                const ordenes = await getOrdenesAll();
                return ordenes.map(o => ({
                    'Número': o.numero_orden,
                    'Fecha': o.fecha,
                    'Área': o.area?.nombre_area || 'Sin Área',
                    'Tipo': o.tipo_orden,
                    'Detalles': o.detalles?.map(d => `${d.cantidad} ${d.unidad_medida} - ${d.descripcion}`).join(' | ') || 'Sin detalles',
                    'Responsable': o.responsable,
                    'Estado': o.estado
                }));
            }

            case 6: { // Equipos
                const { getEquiposAll } = await import('@/services/equipoService');
                const equipos = await getEquiposAll();
                return equipos.map(e => ({
                    'Código': e.codigo_equipo,
                    'Tipo': e.tipo_equipo,
                    'Marca': e.marca,
                    'Modelo': e.modelo,
                    'Estado': e.estado,
                    'Horómetro': e.horometro,
                    'Próximo Mant.': e.horometro_mantenimiento
                }));
            }

            case 7: { // Vehículos
                const { getVehiculosAll } = await import('@/services/vehiculoService');
                const vehiculos = await getVehiculosAll();
                return vehiculos.map(v => ({
                    'Placa': v.placa,
                    'Tipo': v.tipo,
                    'Marca': v.marca,
                    'Modelo': v.modelo,
                    'Estado': v.estado,
                    'Kilometraje': v.km_horometro,
                    'Próximo Mant.': v.km_mantenimiento,
                    'Área': v.id_area
                }));
            }

            case 8: { // Almacén
                const { getMaterialesAll, getAllStock } = await import('@/services/almacenService');
                const [materiales, stocks] = await Promise.all([getMaterialesAll(), getAllStock()]);
                return materiales.map(m => {
                    const stock = stocks.find(s => s.id_material === m.id_material)?.stock_actual || 0;
                    return {
                        'Código': m.codigo_material,
                        'Nombre': m.nombre,
                        'Descripción': m.descripcion || '-',
                        'Área': m.area?.nombre_area || 'Sin Área',
                        'Categoría': (m as any).categoria?.nombre || '-',
                        'Unidad': m.unidad_medida,
                        'Stock Actual': stock,
                        'Stock Mínimo': m.stock_minimo,
                        'Costo Total': m.precio,
                        'Estado': m.estado,
                        'Fecha Registro': m.fecha_registro || '-'
                    };
                });
            }

            default:
                return [];
        }
    };

    const handlePreview = async (reportId: number, title: string) => {
        setLoadingReport(reportId);
        setActiveReportName(title);
        try {
            const data = await calculateReportData(reportId);
            setPreviewData(data);
        } catch (error) {
            console.error(error);
            alert("Error al cargar vista previa.");
        } finally {
            setLoadingReport(null);
        }
    };

    const handleDownload = async (report: typeof reports[0]) => {
        setLoadingReport(report.id);
        try {
            const extension = report.type;
            const filename = `${report.title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;

            if (report.type === 'xlsx') {
                const data = (previewData && activeReportName === report.title) ? previewData : await calculateReportData(report.id);
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Reporte");
                XLSX.writeFile(wb, filename);
            } else {
                if (report.id === 5) {
                    const { generateOrdenesPDF } = await import('@/utils/reportGenerators');
                    const { getOrdenesAll } = await import('@/services/adminService');
                    const ordenesData = await getOrdenesAll();
                    generateOrdenesPDF(ordenesData);
                } else if (report.id === 2) {
                    // Existing logic for Consumo Combustible PDF if any, otherwise placeholder
                    alert("Descarga PDF en desarrollo para este módulo.");
                } else {
                    alert("Descarga PDF en desarrollo para este módulo.");
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error al descargar el archivo.");
        } finally {
            setLoadingReport(null);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Centro de Reportes"
                description="Análisis inteligente de datos y exportación de informes estratégicos."
                icon={FileBarChart}
                breadcrumbs={[
                    { label: 'Administración' },
                    { label: 'Reportes' }
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reports.map((report) => {
                    const Icon = report.icon;
                    const isLoading = loadingReport === report.id;
                    return (
                        <div key={report.id} className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:border-blue-500/50 transition-all flex flex-col group">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                                    <Icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-foreground uppercase text-[12px] tracking-widest">{report.title}</h3>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{report.desc}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreview(report.id, report.title)}
                                    disabled={loadingReport !== null}
                                    className="flex-1 font-black uppercase tracking-widest text-[9px]"
                                >
                                    {isLoading && loadingReport === report.id ? <Loader2 className="animate-spin mr-2" size={12} /> : <TableIcon className="mr-2" size={12} />}
                                    Previsualizar
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDownload(report)}
                                    disabled={loadingReport !== null}
                                    className="flex-1 font-black uppercase tracking-widest text-[9px]"
                                >
                                    <Download className="mr-2" size={12} />
                                    {report.type.toUpperCase()}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {previewData && (
                <DataSection
                    title={`Vista Previa: ${activeReportName}`}
                    description="Datos preliminares calculados según el periodo actual (Enero 2026)."
                    icon={TableIcon}
                    actions={
                        <button onClick={() => setPreviewData(null)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                            <X size={20} />
                        </button>
                    }
                >
                    <Table
                        data={previewData}
                        keyField={Object.keys(previewData[0])[0] as any}
                        columns={Object.keys(previewData[0]).map(key => ({
                            header: key,
                            accessor: key as any,
                            align: typeof (previewData[0] as any)[key] === 'number' ? 'center' : 'left'
                        }))}
                        hover
                    />

                    <div className="mt-8 flex justify-end">
                        <Button
                            variant="primary"
                            icon={Download}
                            onClick={() => handleDownload(reports[0])}
                            className="font-black uppercase tracking-widest text-[10px] px-8 py-4 shadow-lg shadow-blue-500/20"
                        >
                            Confirmar Descarga (.XLSX)
                        </Button>
                    </div>
                </DataSection>
            )}
        </div>
    );
}
