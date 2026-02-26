"use client";

import React from 'react';
import { Viaje } from '@/types';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { Truck, Activity, TrendingUp, History, Trash2, Eye, Receipt, FileText, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import { generateViajeReportPDF } from '@/utils/reportGenerators';
import { deleteViaje } from '@/services/viajeService';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';

interface AdminViajesViewProps {
    history: Viaje[];
}

export const AdminViajesView: React.FC<AdminViajesViewProps> = ({ history }) => {
    const totalGastos = history.reduce((sum: number, v: Viaje) => sum + (v.gastos?.reduce((s, g) => s + g.monto, 0) || 0), 0);
    const viajesActivos = history.filter(v => v.estado === 'en_ruta').length;
    const { user } = useAuth();

    const [selectedViaje, setSelectedViaje] = React.useState<Viaje | null>(null);
    const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este viaje? Se borrarán también todos sus gastos asociados.')) {
            try {
                await deleteViaje(id);
                window.location.reload(); // Refresh to update list
            } catch (error) {
                console.error(error);
                alert('No se pudo eliminar el viaje.');
            }
        }
    };
    return (
        <div className="space-y-10 animate-fade-in">
            {/* SaaS Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
                        <Truck size={12} strokeWidth={3} />
                        Control Operativo
                    </div>
                    <h1 className="text-3xl font-black text-foreground tracking-tighter">
                        Reporte Global de <span className="text-blue-500 font-medium">Viajes</span>
                    </h1>
                    <p className="text-sm text-slate-500 font-bold max-w-xl">
                        Supervisión integral de rutas, consumos y gastos operativos de la flota.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => generateViajeReportPDF(history)}
                        icon={History}
                        className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8"
                    >
                        Descargar Reporte PDF
                    </Button>
                </div>
            </div>

            {/* Performance Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Viajes Totales"
                    value={history.length}
                    icon={Truck}
                    color="primary"
                />
                <StatCard
                    label="Operaciones en Ruta"
                    value={viajesActivos}
                    icon={Activity}
                    color="success"
                />
                <StatCard
                    label="Inversión en Rutas"
                    value={`S/ ${totalGastos.toLocaleString()}`}
                    icon={TrendingUp}
                    color="info"
                />
            </div>

            <div className="space-y-6">
                <Table
                    data={history}
                    keyField="id_viaje"
                    columns={[
                        {
                            header: 'Fecha / Salida',
                            accessor: (row: Viaje) => <div className="space-y-0.5">
                                <p className="font-bold text-foreground">{new Date(row.fecha_salida).toLocaleDateString()}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Hora: {new Date(row.fecha_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>,
                            width: '140px'
                        },
                        {
                            header: 'Operador / Vehículo',
                            accessor: (row: Viaje) => <div className="space-y-0.5">
                                <p className="font-bold text-foreground">{row.conductor?.nombres || 'N/A'}</p>
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{row.vehiculo?.placa || '-'}</p>
                            </div>
                        },
                        {
                            header: 'Destino',
                            accessor: (row: Viaje) => <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-500">{row.origen} →</p>
                                <p className="text-sm font-black text-foreground">{row.destino}</p>
                            </div>
                        },
                        {
                            header: 'Gastos Ruta',
                            accessor: (row: Viaje) => <span className="text-sm font-black text-foreground">S/. {row.gastos?.reduce((sum: number, g: any) => sum + g.monto, 0).toFixed(2) || '0.00'}</span>,
                            align: 'right'
                        },
                        {
                            header: 'Estado',
                            accessor: (row: Viaje) => (
                                <Badge variant={row.estado === 'en_ruta' ? 'success' : 'info'}>
                                    {row.estado === 'en_ruta' ? 'EN RUTA' : 'FINALIZADO'}
                                </Badge>
                            ),
                            width: '120px',
                            align: 'center'
                        }
                    ]}
                    actions={(row) => (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setSelectedViaje(row)}
                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Ver Detalles"
                            >
                                <Eye size={16} />
                            </button>
                            {user?.role === 'admin' && row.estado === 'finalizado' && (
                                <button
                                    onClick={() => handleDelete(row.id_viaje)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                    hover
                />
            </div>

            {/* Modal de Detalles del Viaje */}
            <Modal
                open={!!selectedViaje}
                onClose={() => setSelectedViaje(null)}
                title="Detalles del Viaje"
                size="xl"
            >
                {selectedViaje && (
                    <div className="space-y-8">
                        {/* Cabecera del Viaje */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/20 p-6 rounded-2xl border border-border">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg">
                                        <MapPin size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ruta</p>
                                        <p className="font-bold text-foreground">{selectedViaje.origen} → {selectedViaje.destino}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg">
                                        <UserIcon size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conductor</p>
                                        <p className="font-bold text-foreground">{selectedViaje.conductor?.nombres || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg">
                                        <Truck size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vehículo</p>
                                        <p className="font-bold text-foreground">{selectedViaje.vehiculo?.placa || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/10 p-2 rounded-lg">
                                        <Calendar size={18} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fecha de Salida</p>
                                        <p className="font-bold text-foreground">{new Date(selectedViaje.fecha_salida).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desglose de Gastos */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                <Receipt size={20} className="text-blue-500" />
                                Desglose de Gastos
                            </h3>

                            {!selectedViaje.gastos || selectedViaje.gastos.length === 0 ? (
                                <div className="text-center py-10 bg-slate-800/10 rounded-2xl border border-dashed border-border text-slate-500 font-medium italic">
                                    No se registraron gastos en este viaje.
                                </div>
                            ) : (
                                <Table
                                    data={selectedViaje.gastos}
                                    keyField="id_gasto"
                                    columns={[
                                        {
                                            header: 'Fecha',
                                            accessor: (g) => <span className="text-sm font-bold text-foreground">{new Date(g.fecha).toLocaleDateString()}</span>,
                                            width: '120px'
                                        },
                                        {
                                            header: 'Tipo',
                                            accessor: (g: any) => <Badge variant="default" className="capitalize text-[10px]">{g.tipo}</Badge>,
                                            width: '120px'
                                        },
                                        {
                                            header: 'Monto',
                                            accessor: (g) => <span className="text-sm font-black text-foreground">S/. {g.monto.toFixed(2)}</span>,
                                            align: 'right',
                                            width: '100px'
                                        },
                                        {
                                            header: 'Observaciones',
                                            accessor: (g) => <p className="text-xs text-slate-500 font-medium">{g.observaciones || '-'}</p>
                                        },
                                        {
                                            header: 'Comprobante',
                                            accessor: (g) => (
                                                <div className="flex justify-center">
                                                    {g.foto_url ? (
                                                        <button
                                                            onClick={() => setSelectedPhoto(g.foto_url || null)}
                                                            className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-all flex items-center gap-1.5"
                                                            title="Ver Comprobante"
                                                        >
                                                            <Receipt size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Ver Foto</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic opacity-50">Sin Foto</span>
                                                    )}
                                                </div>
                                            ),
                                            width: '130px',
                                            align: 'center'
                                        }
                                    ]}
                                />
                            )}
                        </div>

                        {/* Footer del Modal */}
                        <div className="flex justify-between items-center pt-6 border-t border-border">
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Estado del Viaje</p>
                                <Badge variant={selectedViaje.estado === 'en_ruta' ? 'success' : 'info'}>
                                    {selectedViaje.estado === 'en_ruta' ? 'EN RUTA' : 'FINALIZADO'}
                                </Badge>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Inversión Total</p>
                                <p className="text-2xl font-black text-blue-500">
                                    S/. {selectedViaje.gastos?.reduce((sum, g) => sum + g.monto, 0).toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal para ver la foto en grande */}
            <Modal
                open={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                title="Comprobante de Gasto"
                size="lg"
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-black/5 rounded-2xl p-4 w-full flex justify-center">
                        <img
                            src={selectedPhoto || ''}
                            alt="Comprobante"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedPhoto(null)}
                        className="font-black uppercase tracking-widest text-[10px]"
                    >
                        Cerrar Vista
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
