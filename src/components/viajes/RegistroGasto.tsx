"use client";

import React, { useState, useRef } from 'react';
import { registrarGasto, subirComprobante, finalizarViaje } from '@/services/viajeService';
import { Viaje } from '@/types';
import { Camera, Upload, CheckCircle, DollarSign, StickyNote, Flag, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Props {
    viaje: Viaje;
    onUpdate: () => void;
}

export default function RegistroGasto({ viaje, onUpdate }: Props) {
    const [mode, setMode] = useState<'expense' | 'finalize'>('expense');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Expense Form State
    const [gastoData, setGastoData] = useState({
        tipo: 'viatico',
        monto: '',
        observaciones: ''
    });
    const [file, setFile] = useState<File | null>(null);

    // Finalize Form State
    const [finData, setFinData] = useState({
        km_final: '',
        fecha_retorno: new Date().toISOString().slice(0, 16)
    });

    const handleGastoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let foto_url = '';
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                foto_url = await subirComprobante(formData);
            }

            await registrarGasto({
                id_viaje: viaje.id_viaje,
                tipo: gastoData.tipo,
                monto: Number(gastoData.monto),
                fecha: new Date(),
                foto_url,
                observaciones: gastoData.observaciones
            });

            setGastoData({ tipo: 'viatico', monto: '', observaciones: '' });
            setFile(null);
            alert('Gasto registrado exitosamente');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Error al registrar el gasto');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await finalizarViaje(
                viaje.id_viaje,
                Number(finData.km_final),
                new Date(finData.fecha_retorno)
            );
            alert('Viaje finalizado correctamente');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Error al finalizar el viaje');
        } finally {
            setLoading(false);
        }
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    return (
        <div className="grid grid-cols-1 2xl:grid-cols-[1fr_400px] gap-8 items-start">
            <Card className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-2">
                        <Button
                            variant={mode === 'expense' ? 'primary' : 'outline'}
                            onClick={() => setMode('expense')}
                            size="sm"
                        >
                            Registrar Gasto
                        </Button>
                        <Button
                            variant={mode === 'finalize' ? 'danger' : 'outline'}
                            onClick={() => setMode('finalize')}
                            size="sm"
                            className={mode === 'finalize' ? '' : 'text-red-500 border-red-500/50 hover:bg-red-500/10'}
                        >
                            Finalizar Viaje
                        </Button>
                    </div>
                </div>

                {mode === 'expense' ? (
                    <form onSubmit={handleGastoSubmit} className="flex flex-col gap-5">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                            <Receipt size={20} /> Nuevo Gasto
                        </h3>

                        <Select
                            label="Tipo de Gasto"
                            value={gastoData.tipo}
                            onChange={e => setGastoData({ ...gastoData, tipo: e.target.value })}
                            options={[
                                { value: 'viatico', label: 'Viático (Alimentación/Hospedaje)' },
                                { value: 'peaje', label: 'Peaje' },
                                { value: 'combustible', label: 'Combustible' },
                                { value: 'lavado', label: 'Lavado' },
                                { value: 'llantas', label: 'Mantenimiento Llantas' },
                                { value: 'engrase', label: 'Engrase' },
                                { value: 'otros', label: 'Otros' }
                            ]}
                        />

                        <Input
                            label="Monto (S/.)"
                            type="number"
                            step="0.1"
                            value={gastoData.monto}
                            onChange={e => setGastoData({ ...gastoData, monto: e.target.value })}
                            startIcon={DollarSign}
                            required
                        />

                        <div
                            onClick={triggerFileInput}
                            className={`
                                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                ${file
                                    ? 'border-emerald-500/50 bg-emerald-500/10'
                                    : 'border-borderColor hover:bg-zinc-800/50 hover:border-primary/50'
                                }
                            `}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            {file ? (
                                <div className="text-emerald-500 flex flex-col items-center gap-2">
                                    <CheckCircle size={32} />
                                    <span className="font-medium">{file.name}</span>
                                    <span className="text-xs">Click para cambiar</span>
                                </div>
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center gap-2">
                                    <Camera size={32} />
                                    <span className="font-medium">Subir Foto del Comprobante</span>
                                    <span className="text-xs">Formato JPG, PNG</span>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Observaciones"
                            value={gastoData.observaciones}
                            onChange={e => setGastoData({ ...gastoData, observaciones: e.target.value })}
                            startIcon={StickyNote}
                        />

                        <Button type="submit" isLoading={loading} size="lg">Guardar Gasto</Button>
                    </form>
                ) : (
                    <form onSubmit={handleFinalizarSubmit} className="flex flex-col gap-5">
                        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-lg text-sm border border-amber-500/20">
                            ⚠ Asegúrate de haber registrado todos los gastos antes de finalizar el viaje.
                        </div>

                        <Input
                            label="Kilometraje Final"
                            type="number"
                            step="0.1"
                            value={finData.km_final}
                            onChange={e => setFinData({ ...finData, km_final: e.target.value })}
                            startIcon={Flag}
                            required
                        />

                        <Input
                            label="Fecha y Hora de Retorno"
                            type="datetime-local"
                            value={finData.fecha_retorno}
                            onChange={e => setFinData({ ...finData, fecha_retorno: e.target.value })}
                            required
                        />

                        <Button
                            type="submit"
                            isLoading={loading}
                            size="lg"
                            variant="danger"
                        >
                            Finalizar Viaje
                        </Button>
                    </form>
                )}
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-borderColor bg-white/5">
                    <h3 className="text-lg font-semibold text-foreground">Resumen del Viaje</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Origen</span>
                            <p className="font-medium text-foreground">{viaje.origen}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Destino</span>
                            <p className="font-medium text-foreground">{viaje.destino}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Vehículo</span>
                            <p className="font-medium text-foreground">{viaje.vehiculo?.placa}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Salida</span>
                            <p className="font-medium text-foreground">{new Date(viaje.fecha_salida).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider">GASTOS REGISTRADOS</h4>

                    {!viaje.gastos || viaje.gastos.length === 0 ? (
                        <p className="text-center text-muted-foreground italic py-4">Sin gastos registrados</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {viaje.gastos.map(g => (
                                <div key={g.id_gasto} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-borderColor">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/10 p-2 rounded-full">
                                            <Receipt size={16} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm capitalize text-foreground">{g.tipo}</p>
                                            {g.observaciones && <p className="text-xs text-muted-foreground">{g.observaciones}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-foreground">S/. {g.monto.toFixed(2)}</p>
                                        {g.foto_url && <span className="text-xs text-emerald-500 block">Con Foto</span>}
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 pt-4 border-t border-borderColor flex justify-between items-center">
                                <span className="font-semibold text-foreground">Total Gastos</span>
                                <span className="text-xl font-bold text-blue-500">
                                    S/. {viaje.gastos.reduce((sum, g) => sum + g.monto, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
