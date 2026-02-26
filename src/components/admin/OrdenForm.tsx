"use client";

import React, { useState, useEffect } from 'react';
import { Orden, Area, Personal, Usuario } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Plus, ShoppingCart } from 'lucide-react';
import { getAreasAll, getPersonalAll } from '@/services/personalService';
import { getUsuariosAll } from '@/services/usuarioService';
import { useAuth } from '@/context/AuthContext';

interface OrdenFormProps {
    onSave: (data: Omit<Orden, 'id_orden'>) => Promise<void>;
    onCancel: () => void;
    initialData?: Orden;
}

export default function OrdenForm({ onSave, onCancel, initialData }: OrdenFormProps) {
    const [formData, setFormData] = useState<Partial<Orden>>(initialData || {
        numero_orden: '',
        fecha: new Date().toLocaleDateString('en-CA'),
        tipo_orden: 'compra',
        id_area: 0,
        descripcion: '',
        cantidad: 0,
        responsable: '',
        autorizado_por: '',
        estado: 'pendiente',
        observaciones: '',
        detalles: []
    });
    const [detalles, setDetalles] = useState<{ descripcion: string; cantidad: number; unidad_medida: string }[]>(
        initialData?.detalles?.map(d => ({
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            unidad_medida: d.unidad_medida || 'UND'
        })) || []
    );
    const [areas, setAreas] = useState<Area[]>([]);
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [aData, pData, uData] = await Promise.all([
                getAreasAll(),
                getPersonalAll(),
                getUsuariosAll()
            ]);
            setAreas(aData);
            setPersonal(pData);
            setUsuarios(uData);
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addDetalle = () => {
        setDetalles([...detalles, { descripcion: '', cantidad: 1, unidad_medida: 'UND' }]);
    };

    const removeDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const updateDetalle = (index: number, field: string, value: string | number) => {
        const newDetalles = [...detalles];
        (newDetalles[index] as any)[field] = value;
        setDetalles(newDetalles);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (detalles.length === 0) {
            alert('Debe agregar al menos un ítem a la orden.');
            return;
        }
        setLoading(true);
        try {
            // Legacy compatibility: use first item or summary for main fields
            const mainDescripcion = detalles.map(d => d.descripcion).join(', ');
            const mainCantidad = detalles.reduce((acc, curr) => acc + Number(curr.cantidad), 0);

            const payload = {
                ...formData,
                descripcion: mainDescripcion.substring(0, 190), // Truncate if too long
                cantidad: mainCantidad,
                id_area: Number(formData.id_area),
                detalles: detalles
            } as any;

            await onSave(payload);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card p-8 animate-fade-in shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <ShoppingCart size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">{initialData ? 'Editar Orden' : 'Nueva Orden'}</h2>
                    <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Completa los detalles de la operación</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <Input label="Número de Orden" name="numero_orden" value={formData.numero_orden} onChange={handleChange} required />
                <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
                <Select label="Tipo" name="tipo_orden" value={formData.tipo_orden} onChange={handleChange} options={[
                    { value: 'compra', label: 'Compra' },
                    { value: 'servicio', label: 'Servicio' }
                ]} />
                <Select label="Área" name="id_area" value={formData.id_area} onChange={(e) => setFormData({ ...formData, id_area: Number(e.target.value) })} options={areas.map(a => ({ value: a.id_area, label: a.nombre_area }))} required />

                <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Items de la Orden</label>
                        <Button type="button" onClick={addDetalle} size="sm" icon={Plus} className="text-[10px] uppercase font-bold">
                            Agregar Ítem
                        </Button>
                    </div>

                    <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/50 text-[10px] uppercase font-black text-slate-500">
                                <tr>
                                    <th className="p-3 text-left">Descripción / Item</th>
                                    <th className="p-3 w-32">Unidad</th>
                                    <th className="p-3 w-32 text-center">Cantidad</th>
                                    <th className="p-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {detalles.map((detalle, idx) => (
                                    <tr key={idx} className="group hover:bg-secondary/30 transition-colors">
                                        <td className="p-2">
                                            <Input
                                                value={detalle.descripcion}
                                                onChange={(e) => updateDetalle(idx, 'descripcion', e.target.value)}
                                                placeholder="Descripción del producto o servicio"
                                                className="h-8 text-xs bg-transparent border-transparent focus:bg-card"
                                                required
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Select
                                                value={detalle.unidad_medida}
                                                onChange={(e) => updateDetalle(idx, 'unidad_medida', e.target.value)}
                                                options={[
                                                    { value: 'UND', label: 'Unidad' },
                                                    { value: 'GLB', label: 'Global' },
                                                    { value: 'SERV', label: 'Servicio' },
                                                    { value: 'KG', label: 'Kilos' },
                                                    { value: 'LTS', label: 'Litros' },
                                                    { value: 'MTS', label: 'Metros' },
                                                ]}
                                                className="h-8 text-xs"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input
                                                type="number"
                                                value={detalle.cantidad}
                                                onChange={(e) => updateDetalle(idx, 'cantidad', Number(e.target.value))}
                                                className="h-8 text-xs text-center bg-transparent border-transparent focus:bg-card"
                                                min={0.1}
                                                step={0.1}
                                                required
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeDetalle(idx)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <Plus size={16} className="rotate-45" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {detalles.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400 text-xs italic">
                                            No hay ítems agregados. Pulse "Agregar Ítem" para comenzar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Select label="Quien Autoriza (Usuario)" name="autorizado_por" value={formData.autorizado_por} onChange={(e) => setFormData({ ...formData, autorizado_por: e.target.value })} options={usuarios.map(u => ({ value: u.nombre, label: u.nombre }))} required />
                <Select label="Personal Responsable" name="responsable" value={formData.responsable} onChange={(e) => setFormData({ ...formData, responsable: e.target.value })} options={personal.map(p => ({ value: p.nombres, label: p.nombres }))} required />
                <Select label="Situación de Orden" name="estado" value={formData.estado} onChange={handleChange} options={[
                    { value: 'pendiente', label: 'PENDIENTE' },
                    { value: 'aprobada', label: 'APROBADA' },
                    { value: 'rechazada', label: 'RECHAZADA' }
                ]} required />
                <div className="md:col-span-2">
                    <Input label="Observaciones Adicionales" name="observaciones" value={formData.observaciones} onChange={handleChange} />
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="font-black uppercase tracking-widest text-[10px] px-8 py-3">Cancelar</Button>
                <Button type="submit" isLoading={loading} className="font-black uppercase tracking-widest text-[10px] px-10 py-3 shadow-lg shadow-blue-500/20">
                    {initialData ? 'Actualizar Orden' : 'Generar Orden'}
                </Button>
            </div>
        </form>
    );
}
