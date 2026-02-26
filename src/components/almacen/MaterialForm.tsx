"use client";

import React, { useState, useEffect } from 'react';
import { Package, Save, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { getCategoriasAll, saveMaterial, getAlmacenesAll } from '@/services/almacenService';
import { getAreasAll } from '@/services/personalService';
import { CategoriaMaterial, Material, Almacen, Area } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MaterialFormProps {
    initialData?: Partial<Material>;
}

export default function MaterialForm({ initialData }: MaterialFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [formData, setFormData] = useState({
        id_material: initialData?.id_material,
        codigo_material: initialData?.codigo_material || '',
        nombre: initialData?.nombre || '',
        id_categoria: initialData?.id_categoria || '',
        id_area: initialData?.id_area || '',
        unidad_medida: initialData?.unidad_medida || 'un',
        stock_minimo: initialData?.stock_minimo || 0,
        descripcion: initialData?.descripcion || '',
        estado: initialData?.estado || 'activo',
        precio: initialData?.precio || 0,
        stock_inicial: 0,
        id_almacen: ''
    });

    useEffect(() => {
        getCategoriasAll().then(setCategorias);
        getAlmacenesAll().then(setAlmacenes);
        getAreasAll().then(setAreas);
    }, []);

    const unit = formData.unidad_medida.toLowerCase();
    useEffect(() => {
        if (formData.id_material) return; // Only for new materials

        if (unit === 'un' || unit === 'und' || unit === 'unidad') {
            setFormData(prev => ({ ...prev, stock_minimo: 3 }));
        } else if (unit === 'kg' || unit === 'kilo') {
            setFormData(prev => ({ ...prev, stock_minimo: 5 }));
        }
    }, [unit, formData.id_material]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveMaterial(formData as any);
            alert('Material guardado correctamente');
            router.push('/almacen');
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Error al guardar material');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Código de Material"
                    value={formData.codigo_material}
                    onChange={(e: any) => setFormData({ ...formData, codigo_material: e.target.value })}
                    required
                    placeholder="Ej: MAT-001"
                />
                <Input
                    label="Nombre del Material"
                    value={formData.nombre}
                    onChange={(e: any) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej: Casco de Seguridad"
                />
                <Select
                    label="Categoría"
                    options={categorias.map(c => ({ value: c.id_categoria.toString(), label: c.nombre }))}
                    value={formData.id_categoria.toString()}
                    onChange={(e: any) => setFormData({ ...formData, id_categoria: parseInt(e.target.value) })}
                    required
                />
                <Select
                    label="Área Asignada"
                    options={areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))}
                    value={formData.id_area.toString()}
                    onChange={(e: any) => setFormData({ ...formData, id_area: parseInt(e.target.value) })}
                    required
                />
                <Input
                    label="Unidad de Medida"
                    value={formData.unidad_medida}
                    onChange={(e: any) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    required
                    placeholder="Ej: un, kg, lt"
                />
                <Input
                    label="Stock Mínimo"
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e: any) => {
                        const val = parseInt(e.target.value);
                        setFormData({ ...formData, stock_minimo: isNaN(val) ? 0 : val });
                    }}
                    required
                />
                <Select
                    label="Estado"
                    options={[
                        { value: 'activo', label: 'Activo' },
                        { value: 'inactivo', label: 'Inactivo' }
                    ]}
                    value={formData.estado}
                    onChange={(e: any) => setFormData({ ...formData, estado: e.target.value as any })}
                />
                <Input
                    label="Precio Total (S/.)"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e: any) => {
                        const val = parseFloat(e.target.value);
                        setFormData({ ...formData, precio: isNaN(val) ? 0 : val });
                    }}
                    placeholder="0.00"
                />
                {!formData.id_material && (
                    <>
                        <Input
                            label="Stock Inicial"
                            type="number"
                            value={formData.stock_inicial}
                            onChange={(e: any) => {
                                const val = parseInt(e.target.value);
                                setFormData({ ...formData, stock_inicial: isNaN(val) ? 0 : val });
                            }}
                            placeholder="0"
                        />
                        <Select
                            label="Almacén para Stock"
                            options={almacenes.map(a => ({ value: a.id_almacen.toString(), label: a.nombre }))}
                            value={formData.id_almacen}
                            onChange={(e: any) => setFormData({ ...formData, id_almacen: e.target.value })}
                        />
                    </>
                )}
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 pl-1">Descripción</label>
                <textarea
                    className="w-full p-4 bg-secondary border border-border rounded-xl text-sm text-foreground focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 min-h-[100px] transition-all resize-none"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles del material..."
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Link href="/almacen">
                    <Button variant="outline" type="button" className="font-black uppercase tracking-widest text-[10px]">
                        Cancelar
                    </Button>
                </Link>
                <Button type="submit" icon={Save} isLoading={loading} className="font-black uppercase tracking-widest text-[10px]">
                    Guardar Material
                </Button>
            </div>
        </form>
    );
}
