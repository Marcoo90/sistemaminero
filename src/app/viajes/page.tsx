"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useViajes } from '@/hooks/useViajes';
import { AdminViajesView } from '@/components/viajes/AdminViajesView';
import { ConductorViajesView } from '@/components/viajes/ConductorViajesView';
import { AlertCircle } from 'lucide-react';

export default function Page() {
    const { user } = useAuth();
    const { loading, activeViaje, history, reload, isAdmin, idConductor } = useViajes();

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Inicie sesión para acceder...</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Bitácora de Viajes...</p>
            </div>
        );
    }

    // Admin View
    if (isAdmin) {
        return <AdminViajesView history={history} />;
    }

    // Safety check for conductor linkage
    if (!idConductor) {
        return (
            <div className="flex flex-col items-center justify-center py-40 bg-card rounded-2xl border border-border shadow-sm text-center px-10">
                <AlertCircle size={48} className="text-amber-500 mb-6" strokeWidth={3} />
                <h2 className="text-2xl font-black text-foreground tracking-tighter mb-2">Usuario no vinculado</h2>
                <p className="text-slate-500 font-bold max-w-sm">Su usuario no está asociado a un registro de Personal/Conductor en el sistema.</p>
            </div>
        );
    }

    return (
        <ConductorViajesView
            idConductor={Number(idConductor)}
            activeViaje={activeViaje}
            history={history}
            onUpdate={reload}
        />
    );
}
