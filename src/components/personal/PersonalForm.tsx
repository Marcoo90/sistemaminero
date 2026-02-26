"use client";

import React, { useState, useEffect } from 'react';
import { Area, Personal } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getAreasAll } from '@/services/personalService';

interface PersonalFormProps {
    initialData?: Personal;
    onSave: (data: Omit<Personal, 'id_personal'>) => Promise<void>;
    onCancel: () => void;
}

export default function PersonalForm({ initialData, onSave, onCancel }: PersonalFormProps) {
    const [formData, setFormData] = useState<Partial<Personal>>({
        dni: '',
        nombres: '',
        cargo: '',
        id_area: 0,
        regimen: '',
        fecha_ingreso: '',
        estado: 'activo',
        telefono: '',
        observaciones: ''
    });
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
        loadAreas();
    }, [initialData]);

    const loadAreas = async () => {
        const data = await getAreasAll();
        setAreas(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Validation for numeric fields
        if (name === 'dni' || name === 'telefono') {
            const numericValue = value.replace(/\D/g, '');
            // Limit DNI to 8 and Phone to 9
            const maxLength = name === 'dni' ? 8 : 9;
            if (numericValue.length > maxLength) return;

            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'id_area' ? (Number(value) || 0) : value
            }));
        }

        // Clear error
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.dni) {
            newErrors.dni = 'El DNI es obligatorio';
        } else if (formData.dni.length !== 8) {
            newErrors.dni = 'El DNI debe tener exactamente 8 dígitos';
        }

        if (formData.telefono && formData.telefono.length !== 9) {
            newErrors.telefono = 'El celular debe tener exactamente 9 dígitos';
        }

        if (!formData.nombres) newErrors.nombres = 'El nombre es obligatorio';
        if (!formData.cargo) newErrors.cargo = 'El cargo es obligatorio';
        if (!formData.id_area) newErrors.id_area = 'El área es obligatoria';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await onSave(formData as Omit<Personal, 'id_personal'>);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const areaOptions = areas.map(a => ({ value: a.id_area, label: a.nombre_area }));
    const estadoOptions = [
        { value: 'activo', label: 'Activo' },
        { value: 'vacaciones', label: 'Vacaciones' },
        { value: 'inactivo', label: 'Inactivo' }
    ];

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold">{initialData ? 'Editar Personal' : 'Nuevo Personal'}</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="DNI"
                        name="dni"
                        value={formData.dni}
                        onChange={handleChange}
                        error={errors.dni}
                    />
                    <Input
                        label="Nombres Completos"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleChange}
                        error={errors.nombres}
                    />
                    <Input
                        label="Cargo"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleChange}
                        error={errors.cargo}
                    />
                    <Select
                        label="Área"
                        name="id_area"
                        value={formData.id_area}
                        onChange={handleChange}
                        error={errors.id_area}
                        options={areaOptions}
                    />
                    <Input
                        label="Régimen"
                        name="regimen"
                        value={formData.regimen}
                        onChange={handleChange}
                        placeholder="Ej. 14x7"
                    />
                    <Input
                        label="Fecha Ingreso"
                        name="fecha_ingreso"
                        type="date"
                        value={formData.fecha_ingreso}
                        onChange={handleChange}
                    />
                    <Input
                        label="Teléfono / Celular (9 dígitos)"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        error={errors.telefono}
                        placeholder="Ej. 912345678"
                    />
                    <Select
                        label="Estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        options={estadoOptions}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Guardar
                    </Button>
                </div>
            </div>
        </form>
    );
}
