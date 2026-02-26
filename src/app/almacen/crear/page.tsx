"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Package, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import MaterialForm from '@/components/almacen/MaterialForm';
import { useAuth } from '@/context/AuthContext';

export default function RegistrarMaterialPage() {
    const pathname = usePathname();
    const router = useRouter();
    const { hasAccess, canEdit } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname) || !canEdit(pathname)) {
            router.push('/almacen');
        }
    }, [pathname, hasAccess, canEdit, router]);
    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Registrar Material"
                description="Añade un nuevo recurso al inventario del almacén."
                icon={Package}
                breadcrumbs={[
                    { label: 'Logística' },
                    { label: 'Almacén', href: '/almacen' },
                    { label: 'Registrar' }
                ]}
            />

            <div className="max-w-4xl mx-auto">
                <DataSection
                    title="Información del Material"
                    description="Complete los campos obligatorios para el registro oficial."
                    icon={Package}
                >
                    <MaterialForm />
                </DataSection>
            </div>
        </div>
    );
}
