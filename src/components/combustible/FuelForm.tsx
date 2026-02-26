"use client";

import React, { useState, useEffect } from 'react';
import { Combustible, Vehiculo } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import FormRow from '@/components/ui/FormRow';
import { getVehiculosAll } from '@/services/vehiculoService';

interface FuelFormProps {
    onSave: (data: Omit<Combustible, 'id_combustible'>) => Promise<void>;
    onCancel: () => void;
}

export default function FuelForm({ onSave, onCancel }: FuelFormProps) {
    const [formData, setFormData] = useState<Partial<Combustible>>({
        id_vehiculo: 0,
        fecha: new Date().toISOString().split('T')[0],
        km_anterior: 0,
        km_horometro: 0,
        litros: 0,
        precio_litro: 0,
        costo_total: 0,
        vale: '',
        conductor: '',
        proveedor: '',
        observaciones: ''
    });
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadVehiculos();
    }, []);

    const loadVehiculos = async () => {
        const data = await getVehiculosAll();
        setVehiculos(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Auto-calculate cost
            if (name === 'litros' || name === 'precio_litro') {
                const l = name === 'litros' ? Number(value) : Number(prev.litros);
                const p = name === 'precio_litro' ? Number(value) : Number(prev.precio_litro);
                newData.costo_total = l * p;
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                id_vehiculo: Number(formData.id_vehiculo),
                km_anterior: Number(formData.km_anterior),
                km_horometro: Number(formData.km_horometro),
                litros: Number(formData.litros),
                precio_litro: Number(formData.precio_litro),
                costo_total: Number(formData.costo_total),
            } as Omit<Combustible, 'id_combustible'>;

            await onSave(payload);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const vehiculoOptions = vehiculos.map(v => ({ value: v.id_vehiculo, label: `${v.codigo_vehiculo} - ${v.placa}` }));

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
                <h2 className="text-lg font-semibold text-foreground">Registrar Carga de Combustible</h2>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Vehículo" name="id_vehiculo" value={formData.id_vehiculo} onChange={handleChange} options={vehiculoOptions} required />
                    <Input label="Fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
                    <Input label="KM Anterior" name="km_anterior" type="number" value={formData.km_anterior} onChange={handleChange} required />
                    <Input label="KM Actual" name="km_horometro" type="number" value={formData.km_horometro} onChange={handleChange} required />
                    <Input label="Litros" name="litros" type="number" step="0.01" value={formData.litros} onChange={handleChange} required />
                    <Input label="Precio por Litro" name="precio_litro" type="number" step="0.01" value={formData.precio_litro} onChange={handleChange} required />
                    <Input label="Costo Total" name="costo_total" type="number" value={formData.costo_total} disabled />
                    <Input label="Vale N°" name="vale" value={formData.vale} onChange={handleChange} required />
                    <Input label="Conductor" name="conductor" value={formData.conductor} onChange={handleChange} required />
                    <Input label="Proveedor (Grifo)" name="proveedor" value={formData.proveedor} onChange={handleChange} />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Registrar</Button>
                </div>
            </div>
        </form>
    );
}
