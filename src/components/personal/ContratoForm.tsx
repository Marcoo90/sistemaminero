"use client";

import React, { useState, useEffect } from 'react';
import { Personal, Contrato } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getPersonalAll } from '@/services/personalService';

interface ContratoFormProps {
    onSave: (data: Omit<Contrato, 'id_contrato'>) => Promise<void>;
    onCancel: () => void;
}

export default function ContratoForm({ onSave, onCancel }: ContratoFormProps) {
    const [formData, setFormData] = useState<Partial<Contrato>>({
        id_personal: 0,
        fecha_inicio: '',
        fecha_fin: '',
        tipo_contrato: 'plazo_fijo',
        sueldo_base: 0,
        estado: 'vigente',
        observaciones: ''
    });
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadPersonal();
    }, []);

    const loadPersonal = async () => {
        const data = await getPersonalAll();
        setPersonal(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'sueldo_base' || name === 'id_personal' ? Number(value) : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.id_personal) newErrors.id_personal = 'El empleado es obligatorio';
        if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
        if (!formData.sueldo_base || formData.sueldo_base <= 0) newErrors.sueldo_base = 'El sueldo debe ser mayor a 0';
        if (formData.tipo_contrato !== 'indeterminado' && !formData.fecha_fin) {
            newErrors.fecha_fin = 'La fecha de fin es obligatoria para contratos a plazo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await onSave(formData as Omit<Contrato, 'id_contrato'>);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const personalOptions = personal.map(p => ({ value: p.id_personal, label: `${p.nombres} (DNI: ${p.dni})` }));
    const tipoOptions = [
        { value: 'plazo_fijo', label: 'Plazo Fijo' },
        { value: 'indeterminado', label: 'Indeterminado' },
        { value: 'locacion', label: 'Locación' },
        { value: 'planilla', label: 'Planilla' }
    ];

    return (
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Nuevo Contrato
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <Select
                    label="Empleado"
                    name="id_personal"
                    value={formData.id_personal}
                    onChange={handleChange}
                    error={errors.id_personal}
                    options={[{ value: 0, label: 'Seleccionar Empleado' }, ...personalOptions]}
                />
                <Select
                    label="Tipo de Contrato"
                    name="tipo_contrato"
                    value={formData.tipo_contrato}
                    onChange={handleChange}
                    options={tipoOptions}
                />
                <Input
                    label="Sueldo Base (S/)"
                    name="sueldo_base"
                    type="number"
                    step="0.01"
                    value={formData.sueldo_base}
                    onChange={handleChange}
                    error={errors.sueldo_base}
                />
                <Input
                    label="Fecha Inicio"
                    name="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    error={errors.fecha_inicio}
                />
                <Input
                    label="Fecha Fin"
                    name="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    error={errors.fecha_fin}
                    disabled={formData.tipo_contrato === 'indeterminado'}
                />
                <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                        label="Observaciones"
                        name="observaciones"
                        value={formData.observaciones || ''}
                        onChange={handleChange}
                        placeholder="Información adicional del contrato..."
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={loading}>
                    Generar Contrato
                </Button>
            </div>
        </form>
    );
}
