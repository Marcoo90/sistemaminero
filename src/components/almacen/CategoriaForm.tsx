"use client";

import React, { useState, useEffect } from 'react';
import { CategoriaMaterial } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import FormRow from '@/components/ui/FormRow';
import { ArrowLeft } from 'lucide-react';

interface CategoriaFormProps {
    initialData?: CategoriaMaterial;
    onSave: (data: Partial<CategoriaMaterial>) => Promise<void>;
    onCancel: () => void;
}

export default function CategoriaForm({ initialData, onSave, onCancel }: CategoriaFormProps) {
    const [formData, setFormData] = useState<Partial<CategoriaMaterial>>({
        nombre: '',
        descripcion: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
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
        <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={onCancel}><ArrowLeft size={18} /></Button>
                <h2 className="text-lg font-semibold">{initialData ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                    label="Nombre de Categoría"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                />

                <FormRow label="Descripción">
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="w-full p-3 bg-transparent border border-border rounded-md min-h-[100px] resize-y text-foreground"
                    />
                </FormRow>

                <div className="flex justify-end gap-3 mt-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" isLoading={loading}>Guardar Categoría</Button>
                </div>
            </form>
        </Card>
    );
}
