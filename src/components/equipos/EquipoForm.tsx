"use client";

import React, { useState, useEffect } from 'react';
import { Equipo, Area } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import FormRow from '@/components/ui/FormRow';
import { getAreasAll } from '@/services/personalService';

interface EquipoFormProps {
    initialData?: Equipo;
    onSave: (data: Omit<Equipo, 'id_equipo'>) => Promise<void>;
    onCancel: () => void;
}

export default function EquipoForm({ initialData, onSave, onCancel }: EquipoFormProps) {
    const [formData, setFormData] = useState<Partial<Equipo>>({
        codigo_equipo: '',
        tipo_equipo: '',
        categoria: '',
        descripcion: '',
        marca: '',
        modelo: '',
        serie: '',
        capacidad: '',
        energia: '',
        estado: 'operativo',
        id_area: 0,
        responsable: '',
        fecha_adquisicion: '',
        horometro: 0,
        horometro_mantenimiento: 0,
        observaciones: ''
    });
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
        loadAreas();
    }, [initialData]);

    const loadAreas = async () => {
        try {
            const data = await getAreasAll();
            setAreas(data);
        } catch (error) {
            console.error("Error loading areas:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numericFields = ['id_area', 'horometro', 'horometro_mantenimiento'];
        setFormData(prev => ({
            ...prev,
            [name]: numericFields.includes(name) ? (parseFloat(value) || 0) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Cast horometro/id_area to number if needed, though Select/Input usually return strings
            const payload = {
                ...formData,
                id_area: Number(formData.id_area),
                horometro: Number(formData.horometro),
            } as Omit<Equipo, 'id_equipo'>;

            await onSave(payload);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const areaOptions = areas.map(a => ({ value: a.id_area, label: a.nombre_area }));
    const estadoOptions = [
        { value: 'operativo', label: 'Operativo' },
        { value: 'mantenimiento', label: 'En Mantenimiento' },
        { value: 'inoperativo', label: 'Inoperativo' }
    ];
    const energiaOptions = [
        { value: 'Diesel', label: 'Diesel' },
        { value: 'Eléctrico', label: 'Eléctrico' },
        { value: 'Gasolina', label: 'Gasolina' }
    ];

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold text-foreground">{initialData ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Código" name="codigo_equipo" value={formData.codigo_equipo} onChange={handleChange} required />
                    <Input label="Tipo" name="tipo_equipo" value={formData.tipo_equipo} onChange={handleChange} required />
                    <Input label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
                    <Input label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} />
                    <Input label="Serie" name="serie" value={formData.serie} onChange={handleChange} />
                    <Input label="Capacidad" name="capacidad" value={formData.capacidad} onChange={handleChange} />

                    <Select label="Energía" name="energia" value={formData.energia} onChange={handleChange} options={energiaOptions} />
                    <Select label="Estado" name="estado" value={formData.estado} onChange={handleChange} options={estadoOptions} />
                    <Select label="Área Asignada" name="id_area" value={formData.id_area} onChange={handleChange} options={areaOptions} />

                    <Input label="Responsable" name="responsable" value={formData.responsable} onChange={handleChange} />
                    <Input label="Fecha Adquisición" name="fecha_adquisicion" type="date" value={formData.fecha_adquisicion} onChange={handleChange} />
                    <Input label="Horómetro Actual" name="horometro" type="number" value={formData.horometro} onChange={handleChange} />
                    <Input label="Próximo Mant. (Horas)" name="horometro_mantenimiento" type="number" value={formData.horometro_mantenimiento} onChange={handleChange} />
                </div>

                <FormRow label="Descripción">
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="w-full bg-transparent border border-border rounded-md p-3 min-h-[80px] text-foreground font-sans"
                    />
                </FormRow>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Guardar Equipo
                    </Button>
                </div>
            </div>
        </form>
    );
}
