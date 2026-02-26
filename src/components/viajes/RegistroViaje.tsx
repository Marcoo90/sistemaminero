"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { iniciarViaje } from '@/services/viajeService';
import { getVehiculosAll } from '@/services/vehiculoService';
import { Vehiculo } from '@/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MapPin, Navigation, Gauge, Calendar, Truck } from 'lucide-react';

interface Props {
    idConductor: number;
    onViajeIniciado: () => void;
}

export default function RegistroViaje({ idConductor, onViajeIniciado }: Props) {
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id_vehiculo: '',
        origen: '',
        destino: '',
        km_inicial: '',
        fecha_salida: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        const loadVehiculos = async () => {
            const data = await getVehiculosAll();
            setVehiculos(data.filter(v => v.estado === 'operativo'));
        };
        loadVehiculos();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await iniciarViaje({
                id_vehiculo: Number(formData.id_vehiculo),
                id_conductor: idConductor,
                origen: formData.origen,
                destino: formData.destino,
                km_inicial: Number(formData.km_inicial),
                fecha_salida: new Date(formData.fecha_salida)
            });
            onViajeIniciado();
        } catch (error) {
            console.error(error);
            alert('Error al iniciar el viaje');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 max-w-[600px] mx-auto">
            <div className="flex items-center gap-3 mb-6 border-b border-borderColor pb-4">
                <Truck size={24} className="text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Iniciar Nuevo Viaje</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Select
                    label="Vehículo Asignado"
                    name="id_vehiculo"
                    value={formData.id_vehiculo}
                    onChange={handleChange}
                    options={[{ value: '', label: 'Seleccione un vehículo...' }, ...vehiculos.map(v => ({ value: v.id_vehiculo, label: `${v.codigo_vehiculo} - ${v.placa} (${v.marca})` }))]}
                    required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Origen"
                        name="origen"
                        value={formData.origen}
                        onChange={handleChange}
                        startIcon={MapPin}
                        placeholder="Lugar de partida"
                        required
                    />
                    <Input
                        label="Destino"
                        name="destino"
                        value={formData.destino}
                        onChange={handleChange}
                        startIcon={Navigation}
                        placeholder="Lugar de llegada"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Kilometraje Inicial"
                        name="km_inicial"
                        type="number"
                        step="0.1"
                        value={formData.km_inicial}
                        onChange={handleChange}
                        startIcon={Gauge}
                        required
                    />
                    <Input
                        label="Fecha y Hora Salida"
                        name="fecha_salida"
                        type="datetime-local"
                        value={formData.fecha_salida}
                        onChange={handleChange}
                        startIcon={Calendar}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    isLoading={loading}
                    size="lg"
                    fullWidth
                    className="mt-4"
                >
                    Comenzar Ruta
                </Button>
            </form>
        </Card>
    );
}
