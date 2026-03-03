"use server";

import { prisma } from '@/lib/prisma';
import { Vehiculo, MantenimientoVehiculo, Combustible } from '@/types';
import { unstable_noStore as noStore } from 'next/cache';

import { toPeruDate, toPeruTime } from '@/lib/dateUtils';

const formatVehiculo = (v: any): Vehiculo => {
    try {
        return {
            id_vehiculo: v.id_vehiculo || 0,
            codigo_vehiculo: v.codigo_vehiculo || '',
            tipo: v.tipo || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            anio: v.anio || 0,
            placa: v.placa || '',
            vin: v.vin || '',
            combustible: (v.combustible_tipo || v.combustible || 'diesel') as any,
            capacidad: v.capacidad || '',
            // Normalización crítica: siempre a minúsculas y sin espacios
            estado: (v.estado ? v.estado.toString().trim().toLowerCase() : 'operativo') as any,
            id_area: v.id_area || 0,
            km_horometro: v.km_horometro || 0,
            km_mantenimiento: v.km_mantenimiento || 0,
            soat: v.soat || '',
            seguro: v.seguro || '',
            revision_tecnica: v.revision_tecnica || '',
            observaciones: v.observaciones || '',
            // Garantizar que la fecha sea un string plano para evitar errores de serialización
            fecha_registro: v.fecha_registro ? (v.fecha_registro instanceof Date ? v.fecha_registro.toISOString() : v.fecha_registro.toString()) : ''
        };
    } catch (e) {
        console.error("Error formatting vehiculo:", e);
        return v;
    }
};

const formatCombustible = (c: any): Combustible => ({
    ...c,
    fecha: toPeruDate(c.fecha)
});

export async function getVehiculosAll(): Promise<Vehiculo[]> {
    try {
        const data = await prisma.vehiculo.findMany();
        if (!data || data.length === 0) return [];

        // Mapeo ultra-simplificado para evitar Errores 500 por serialización
        return data.map((v: any) => ({
            id_vehiculo: Number(v.id_vehiculo),
            codigo_vehiculo: String(v.codigo_vehiculo || ""),
            tipo: String(v.tipo || ""),
            marca: String(v.marca || ""),
            modelo: String(v.modelo || ""),
            anio: Number(v.anio || 0),
            placa: String(v.placa || ""),
            vin: String(v.vin || ""),
            combustible: "diesel" as any,
            capacidad: String(v.capacidad || ""),
            estado: String(v.estado || "operativo").trim().toLowerCase() as any,
            id_area: Number(v.id_area || 0),
            km_horometro: Number(v.km_horometro || 0),
            km_mantenimiento: Number(v.km_mantenimiento || 0),
            soat: String(v.soat || ""),
            seguro: String(v.seguro || ""),
            revision_tecnica: String(v.revision_tecnica || ""),
            observaciones: String(v.observaciones || ""),
            fecha_registro: String(v.fecha_registro || "")
        }));
    } catch (error: any) {
        console.error("DEBUG_ERROR (getVehiculosAll):", error);
        return [];
    }
}

export async function createVehiculo(data: Omit<Vehiculo, 'id_vehiculo'>): Promise<Vehiculo> {
    try {
        const { id_vehiculo, combustible, ...vehiculoData } = data as any;

        const idArea = Number(data.id_area);
        if (isNaN(idArea)) throw new Error("ID de área inválido");

        const created = await prisma.vehiculo.create({
            data: {
                ...vehiculoData,
                id_area: idArea,
                anio: data.anio ? Number(data.anio) : null,
                km_horometro: Number(data.km_horometro) || 0,
                km_mantenimiento: Number(data.km_mantenimiento) || 0,
                combustible_tipo: combustible,
                estado: data.estado ? data.estado.toString().trim().toLowerCase() : 'operativo',
                fecha_registro: new Date()
            }
        });
        return formatVehiculo(created);
    } catch (error: any) {
        console.error("FATAL_ERROR (createVehiculo):", error);
        throw new Error(error.message || "Error al registrar el vehículo en la base de datos.");
    }
}

export async function deleteVehiculo(id: number): Promise<void> {
    await prisma.vehiculo.delete({ where: { id_vehiculo: id } });
}

export async function updateVehiculo(id: number, data: Partial<Vehiculo>): Promise<Vehiculo> {
    const updateData: any = {
        ...data,
        //@ts-ignore
        combustible_tipo: data.combustible || undefined,
        estado: data.estado as string
    };

    if (data.id_area !== undefined) updateData.id_area = Number(data.id_area);
    if (data.anio !== undefined) updateData.anio = Number(data.anio);
    if (data.km_horometro !== undefined) updateData.km_horometro = Number(data.km_horometro);
    if (data.km_mantenimiento !== undefined) updateData.km_mantenimiento = Number(data.km_mantenimiento);

    const updated = await prisma.vehiculo.update({
        where: { id_vehiculo: id },
        data: updateData
    });
    return formatVehiculo(updated);
}

// Fuel Functions
export async function getFuelLogs(): Promise<Combustible[]> {
    const data = await prisma.combustible.findMany({
        include: { vehiculo: true },
        orderBy: { fecha: 'desc' }
    });
    return data.map(formatCombustible);
}

export async function addFuelLog(data: Omit<Combustible, 'id_combustible'>): Promise<Combustible> {
    const { id_combustible, ...combustibleData } = data as any;
    const created = await prisma.combustible.create({
        data: {
            ...combustibleData,
            fecha: new Date(data.fecha) // Assuming YYYY-MM-DD input
        }
    });
    return formatCombustible(created);
}

// Maintenance history (placeholder for now)
export async function getVehiculoMaintenanceHistory(idVehiculo: number): Promise<any[]> {
    return await prisma.mantenimientoVehiculo.findMany({
        where: { id_vehiculo: idVehiculo }
    });
}

// Object exports removed - "use server" files can only export async functions
