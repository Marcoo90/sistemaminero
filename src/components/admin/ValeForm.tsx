"use client";

import React, { useState, useEffect } from 'react';
import { Vale, Area } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getAreasAll } from '@/services/personalService';

interface ValeFormProps {
    onSave: (data: Omit<Vale, 'id_vale'>) => Promise<void>;
    onCancel: () => void;
    initialData?: Vale;
}

export default function ValeForm({ onSave, onCancel, initialData }: ValeFormProps) {
    const [formData, setFormData] = useState<Partial<Vale>>(initialData || {
        numero_vale: '',
        fecha: new Date().toISOString().split('T')[0],
        solicitante: '',
        id_area: 0,
        concepto: '',
        monto: 0,
        autorizado_por: '',
        estado: 'pendiente',
        observaciones: ''
    });
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData(initialData);
        loadAreas();
    }, [initialData]);

    const loadAreas = async () => {
        const data = await getAreasAll();
        setAreas(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                id_area: Number(formData.id_area),
                monto: Number(formData.monto),
            } as Omit<Vale, 'id_vale'>;
            await onSave(payload);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold">{initialData ? 'Editar Vale de Gasto' : 'Nuevo Vale de Gasto'}</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Número de Vale" name="numero_vale" value={formData.numero_vale} onChange={handleChange} required />
                    <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
                    <Input label="Solicitante" name="solicitante" value={formData.solicitante} onChange={handleChange} required />
                    <Select label="Área" name="id_area" value={formData.id_area} onChange={handleChange} options={areas.map(a => ({ value: a.id_area, label: a.nombre_area }))} required />
                    <Input label="Concepto" name="concepto" value={formData.concepto} onChange={handleChange} required />
                    <Input label="Monto (S/)" name="monto" type="number" step="0.01" value={formData.monto} onChange={handleChange} required />
                    <Input label="Autorizado por" name="autorizado_por" value={formData.autorizado_por} onChange={handleChange} />
                    <Select label="Estado" name="estado" value={formData.estado} onChange={handleChange} options={[
                        { value: 'pendiente', label: 'Pendiente' },
                        { value: 'aprobado', label: 'Aprobado' },
                        { value: 'rechazado', label: 'Rechazado' }
                    ]} />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar Vale</Button>
                </div>
            </div>
        </form>
    );
}
