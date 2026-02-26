"use client";

import React, { useState, useEffect } from 'react';
import { Vehiculo, Area } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getAreasAll } from '@/services/personalService';

interface VehiculoFormProps {
    initialData?: Vehiculo;
    onSave: (data: Omit<Vehiculo, 'id_vehiculo'>) => Promise<void>;
    onCancel: () => void;
}

export default function VehiculoForm({ initialData, onSave, onCancel }: VehiculoFormProps) {
    const [formData, setFormData] = useState<Partial<Vehiculo>>({
        codigo_vehiculo: '',
        tipo: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        placa: '',
        vin: '',
        combustible: 'diesel',
        capacidad: '',
        estado: 'operativo',
        id_area: 0,
        responsable: '',
        km_horometro: 0,
        km_mantenimiento: 0,
        soat: '',
        seguro: '',
        revision_tecnica: '',
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                id_area: Number(formData.id_area),
                anio: Number(formData.anio),
                km_horometro: Number(formData.km_horometro),
            } as Omit<Vehiculo, 'id_vehiculo'>;

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
        { value: 'taller', label: 'En Taller' },
        { value: 'baja', label: 'De Baja' }
    ];
    const combustibleOptions = [
        { value: 'diesel', label: 'Diesel' },
        { value: 'gasolina', label: 'Gasolina' }
    ];

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold">{initialData ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Código" name="codigo_vehiculo" value={formData.codigo_vehiculo} onChange={handleChange} required />
                    <Input label="Placa" name="placa" value={formData.placa} onChange={handleChange} required />
                    <Input label="Tipo" name="tipo" value={formData.tipo} onChange={handleChange} placeholder="Ej. Camioneta 4x4" />
                    <Input label="Marca" name="marca" value={formData.marca} onChange={handleChange} />
                    <Input label="Modelo" name="modelo" value={formData.modelo} onChange={handleChange} />
                    <Input label="Año" name="anio" type="number" value={formData.anio} onChange={handleChange} />

                    <Select label="Combustible" name="combustible" value={formData.combustible} onChange={handleChange} options={combustibleOptions} />
                    <Select label="Estado" name="estado" value={formData.estado} onChange={handleChange} options={estadoOptions} />
                    <Select label="Área Asignada" name="id_area" value={formData.id_area} onChange={handleChange} options={areaOptions} />

                    <Input label="Kilometraje/Horómetro" name="km_horometro" type="number" value={formData.km_horometro} onChange={handleChange} />
                    <Input label="Próximo Mant. (KM)" name="km_mantenimiento" type="number" value={formData.km_mantenimiento} onChange={handleChange} />
                    <Input label="Responsable" name="responsable" value={formData.responsable} onChange={handleChange} />
                    <Input label="SOAT" name="soat" value={formData.soat} onChange={handleChange} />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Guardar Vehículo
                    </Button>
                </div>
            </div>
        </form>
    );
}
