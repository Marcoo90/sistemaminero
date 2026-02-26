"use client";

import React, { useState, useEffect } from 'react';
import { Usuario, Personal, Area } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import FormRow from '@/components/ui/FormRow';
import { getPersonalAll, getAreasAll } from '@/services/personalService';

interface UsuarioFormProps {
    initialData?: Usuario;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export default function UsuarioForm({ initialData, onSave, onCancel }: UsuarioFormProps) {
    const [formData, setFormData] = useState({
        usuario: '',
        clave: '',
        rol: 'operador',
        nombre: '',
        id_personal: ''
    });
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadResources();
        if (initialData) {
            setFormData({
                usuario: initialData.usuario,
                clave: '', // Don't show hash
                rol: initialData.rol,
                nombre: initialData.nombre || '',
                id_personal: initialData.id_personal?.toString() || ''
            });
        }
    }, [initialData]);

    const loadResources = async () => {
        const [p, a] = await Promise.all([getPersonalAll(), getAreasAll()]);
        setPersonalList(p);
        setAreas(a);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Auto-detect role if personal changes
        if (name === 'id_personal') {
            const selectedPerson = personalList.find(p => p.id_personal === Number(value));
            if (selectedPerson) {
                // Find area name
                const area = areas.find(a => a.id_area === selectedPerson.id_area);
                if (area?.nombre_area.toLowerCase().includes('piloto') || area?.nombre_area.toLowerCase().includes('conductor')) {
                    setFormData(prev => ({
                        ...prev,
                        [name]: value,
                        rol: 'conductor',
                        nombre: selectedPerson.nombres
                    }));
                    return;
                }
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    nombre: selectedPerson.nombres
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 max-w-3xl mx-auto">
            <div className="mb-4 pb-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <p className="text-sm text-muted mt-1">Complete los datos para registrar el acceso al sistema.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Usuario (Login)"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        required
                        placeholder="Ej: jperez"
                    />
                    <Input
                        label={initialData ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                        name="clave"
                        type="password"
                        value={formData.clave}
                        onChange={handleChange}
                        required={!initialData}
                        placeholder="••••••••"
                    />

                    <Select
                        label="Vincular con Personal"
                        name="id_personal"
                        value={formData.id_personal}
                        onChange={handleChange}
                        options={[
                            { value: '', label: 'Ninguno / Usuario Externo' },
                            ...personalList.map(p => ({ value: p.id_personal, label: `${p.nombres} - ${areas.find(a => a.id_area === p.id_area)?.nombre_area}` }))
                        ]}
                    />

                    <Input
                        label="Nombre Visible"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Juan Perez"
                    />

                    <Select
                        label="Rol del Sistema"
                        name="rol"
                        value={formData.rol}
                        onChange={handleChange}
                        options={[
                            { value: 'admin', label: 'Administrador (Acceso Total)' },
                            { value: 'gerente', label: 'Gerente (Ver Reportes)' },
                            { value: 'logistica', label: 'Logística' },
                            { value: 'almacenero', label: 'Almacenero' },
                            { value: 'asistante_administrativo', label: 'Asistante Administrativo' },
                            { value: 'conductor', label: 'Conductor (Solo Viajes)' },
                        ]}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-border">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar Usuario</Button>
                </div>
            </form>
        </Card>
    );
}
