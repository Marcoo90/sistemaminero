"use client";

import React, { useState } from 'react';
import { Proveedor } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import FormRow from '@/components/ui/FormRow';

interface ProveedorFormProps {
    onSave: (data: Omit<Proveedor, 'id_proveedor'>) => Promise<void>;
    onCancel: () => void;
    initialData?: Proveedor;
}

export default function ProveedorForm({ onSave, onCancel, initialData }: ProveedorFormProps) {
    const [formData, setFormData] = useState<Partial<Proveedor>>(initialData || {
        nombre: '',
        ruc: '',
        tipo: '',
        telefono: '',
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData as Omit<Proveedor, 'id_proveedor'>);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold">{initialData ? 'Editar Proveedor' : 'Registrar Proveedor'}</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Nombre / Razón Social" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    <Input label="RUC" name="ruc" value={formData.ruc} onChange={handleChange} required />
                    <Input label="Especialidad / Tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ej. Repuestos, Serv. Eléctrico" />
                    <Input label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                </div>

                <FormRow label="Observaciones">
                    <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} className="w-full bg-transparent border border-border rounded-md p-2 min-h-[80px] text-foreground" />
                </FormRow>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>{initialData ? 'Actualizar' : 'Registrar'}</Button>
                </div>
            </div>
        </form>
    );
}
