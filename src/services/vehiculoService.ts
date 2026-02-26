"use server";

import { prisma } from '@/lib/prisma';
import { Vehiculo, MantenimientoVehiculo, Combustible } from '@/types';

import { toPeruDate, toPeruTime } from '@/lib/dateUtils';

const formatVehiculo = (v: any): Vehiculo => ({
    ...v,
    combustible: v.combustible_tipo as Vehiculo['combustible'],
    estado: v.estado as Vehiculo['estado'],
    fecha_registro: v.fecha_registro ? toPeruTime(v.fecha_registro) : ''
});

const formatCombustible = (c: any): Combustible => ({
    ...c,
    fecha: toPeruDate(c.fecha)
});

export async function getVehiculosAll(): Promise<Vehiculo[]> {
    const data = await prisma.vehiculo.findMany();
    return data.map(formatVehiculo);
}

export async function createVehiculo(data: Omit<Vehiculo, 'id_vehiculo'>): Promise<Vehiculo> {
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
            estado: data.estado as string,
            fecha_registro: new Date()
        }
    });
    return formatVehiculo(created);
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
