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
        const idArea = Number(data.id_area);
        if (isNaN(idArea)) throw new Error("ID de área inválido");

        // Creamos el objeto explícitamente para evitar campos 'null' o 'undefined' que Prisma rechace
        // o campos extra que vengan del formulario.
        const created = await prisma.vehiculo.create({
            data: {
                codigo_vehiculo: data.codigo_vehiculo?.toString().trim() || "",
                tipo: data.tipo?.toString() || "",
                marca: data.marca?.toString() || "",
                modelo: data.modelo?.toString() || "",
                anio: data.anio ? Number(data.anio) : null,
                placa: data.placa?.trim() || null, // null permite duplicados, "" no.
                vin: data.vin?.trim() || null,     // null permite duplicados, "" no.
                combustible_tipo: (data as any).combustible || "diesel",
                capacidad: data.capacidad?.toString() || "",
                estado: data.estado ? data.estado.toString().trim().toLowerCase() : 'operativo',
                id_area: idArea,
                km_horometro: Number(data.km_horometro) || 0,
                km_mantenimiento: Number(data.km_mantenimiento) || 0,
                soat: data.soat?.toString() || "",
                seguro: data.seguro?.toString() || "",
                revision_tecnica: data.revision_tecnica?.toString() || "",
                observaciones: data.observaciones?.toString() || "",
                fecha_registro: new Date()
            }
        });

        return formatVehiculo(created);
    } catch (error: any) {
        console.error("CREATE_VEHICULO_ERROR:", error);

        if (error.code === 'P2002') {
            const field = error.meta?.target || "campo único";
            throw new Error(`Ya existe un vehículo con este ${field}. Verifica la placa, código o VIN.`);
        }

        throw new Error(error.message || "Error interno al registrar el vehículo.");
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

    // Corregir restricción única en actualización: si es vacío, enviar null
    if (data.vin !== undefined) updateData.vin = data.vin?.trim() || null;
    if (data.placa !== undefined) updateData.placa = data.placa?.trim() || null;

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
