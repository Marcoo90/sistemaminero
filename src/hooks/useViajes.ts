import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getViajeActivo, getViajesByConductor, getViajesAll } from '@/services/viajeService';
import { Viaje } from '@/types';

export function useViajes() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeViaje, setActiveViaje] = useState<Viaje | null>(null);
    const [history, setHistory] = useState<Viaje[]>([]);
    const [error, setError] = useState<string | null>(null);

    const idConductor = user?.id_personal || (user as any)?.id_personal;
    const isAdmin = user?.role === 'admin' || user?.role === 'gerencia' || user?.role === 'gerente' || user?.role === 'logistica' || user?.role === 'asistante_administrativo';

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (isAdmin) {
                const allViajes = await getViajesAll();
                setHistory(allViajes);
                setActiveViaje(null);
            } else if (idConductor) {
                const current = await getViajeActivo(idConductor);
                setActiveViaje(current);
                const hist = await getViajesByConductor(idConductor);
                setHistory(hist);
            } else {
                setActiveViaje(null);
                setHistory([]);
            }
        } catch (err) {
            console.error("Error loading trips:", err);
            setError("No se pudieron cargar los datos de los viajes.");
        } finally {
            setLoading(false);
        }
    }, [idConductor, isAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        loading,
        error,
        activeViaje,
        history,
        reload: loadData,
        isAdmin,
        idConductor
    };
}
