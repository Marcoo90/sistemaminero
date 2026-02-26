"use client";

import React, { useState, useEffect } from 'react';
import { Almacen } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import FormRow from '@/components/ui/FormRow';
import { ArrowLeft, Building2 } from 'lucide-react';

interface AlmacenFormProps {
    initialData?: Almacen;
    onSave: (data: Partial<Almacen>) => Promise<void>;
    onCancel: () => void;
}

export default function AlmacenForm({ initialData, onSave, onCancel }: AlmacenFormProps) {
    const [formData, setFormData] = useState<Partial<Almacen>>({
        nombre: '',
        ubicacion: '',
        responsable: '',
        observaciones: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.nombre?.trim()) {
            newErrors.nombre = 'El nombre del almacén es requerido';
        }
        if (!formData.ubicacion?.trim()) {
            newErrors.ubicacion = 'La ubicación es requerida';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error(error);
            setErrors({ submit: 'Error al guardar el almacén' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="premium" hover>
            <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                    <Button variant="ghost" size="sm" onClick={onCancel}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20 text-primary">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <CardTitle>{initialData ? 'Editar Almacén' : 'Nuevo Almacén'}</CardTitle>
                            <CardDescription>
                                {initialData ? 'Actualiza la información del almacén' : 'Registra un nuevo almacén en el sistema'}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Nombre del Almacén"
                        name="nombre"
                        value={formData.nombre || ''}
                        onChange={handleChange}
                        error={errors.nombre}
                        required
                        fullWidth
                        placeholder="Ej: Almacén Central"
                    />

                    <Input
                        label="Ubicación"
                        name="ubicacion"
                        value={formData.ubicacion || ''}
                        onChange={handleChange}
                        error={errors.ubicacion}
                        required
                        fullWidth
                        placeholder="Ej: Sector Norte, Piso 2"
                    />

                    <Input
                        label="Responsable"
                        name="responsable"
                        value={formData.responsable || ''}
                        onChange={handleChange}
                        fullWidth
                        placeholder="Nombre del responsable"
                    />

                    <FormRow label="Observaciones">
                        <textarea
                            name="observaciones"
                            value={formData.observaciones || ''}
                            onChange={handleChange}
                            placeholder="Notas adicionales sobre el almacén..."
                            className="w-full p-4 bg-card border-2 border-input rounded-lg min-h-[120px] resize-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </FormRow>

                    {errors.submit && (
                        <div className="p-4 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <CardFooter className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading} className="min-w-[140px]">
                            {initialData ? 'Actualizar' : 'Crear'} Almacén
                        </Button>
                    </CardFooter>
                </form>
            </CardContent>
        </Card>
    );
}
