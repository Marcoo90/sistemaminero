"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Package, Activity } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import MaterialForm from '@/components/almacen/MaterialForm';
import { getMaterialById } from '@/services/almacenService';
import { Material } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function EditarMaterialPage() {
    const { id } = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const { hasAccess, canEdit } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname) || !canEdit(pathname)) {
            router.push('/almacen');
        }
    }, [pathname, hasAccess, canEdit, router]);

    const [material, setMaterial] = useState<Material | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            getMaterialById(parseInt(id as string)).then(data => {
                if (data) setMaterial(data);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando material...</p>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Material no encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Editar Material"
                description={`Modificando registro: ${material.nombre}`}
                icon={Package}
                breadcrumbs={[
                    { label: 'Logística' },
                    { label: 'Almacén', href: '/almacen' },
                    { label: 'Editar' }
                ]}
            />

            <div className="max-w-4xl mx-auto">
                <DataSection
                    title="Actualizar Información"
                    description="Realice los cambios necesarios en la ficha del material."
                    icon={Package}
                >
                    <MaterialForm initialData={material} />
                </DataSection>
            </div>
        </div>
    );
}
