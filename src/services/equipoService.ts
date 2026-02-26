"use server";

import { prisma } from '@/lib/prisma';
import { Equipo, MantenimientoEquipo } from '@/types';

import { toPeruDate, toPeruTime } from '@/lib/dateUtils';

const formatEquipo = (e: any): Equipo => ({
    ...e,
    fecha_adquisicion: e.fecha_adquisicion ? toPeruDate(e.fecha_adquisicion) : '',
    fecha_registro: e.fecha_registro ? toPeruTime(e.fecha_registro) : '',
    estado: e.estado as Equipo['estado']
});

const formatMantenimiento = (m: any): MantenimientoEquipo => ({
    ...m,
    fecha: toPeruDate(m.fecha),
    tipo_mantenimiento: m.tipo_mantenimiento as MantenimientoEquipo['tipo_mantenimiento']
});

export async function getEquiposAll(): Promise<Equipo[]> {
    const data = await prisma.equipo.findMany();
    return data.map(formatEquipo);
}

export async function getEquipoById(id: number): Promise<Equipo | undefined> {
    const equipo = await prisma.equipo.findUnique({ where: { id_equipo: id } });
    return equipo ? formatEquipo(equipo) : undefined;
}

const safeDate = (dateVal: any) => {
    if (!dateVal) return undefined;
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? undefined : d;
};

export async function createEquipo(data: Omit<Equipo, 'id_equipo'>): Promise<Equipo> {
    const { id_equipo, ...equipoData } = data as any;

    // Validate and convert types
    const idArea = Number(data.id_area);
    if (isNaN(idArea)) throw new Error("ID de área inválido");

    const created = await prisma.equipo.create({
        data: {
            ...equipoData,
            id_area: idArea,
            horometro: Number(data.horometro) || 0,
            horometro_mantenimiento: Number(data.horometro_mantenimiento) || 0,
            fecha_adquisicion: safeDate(data.fecha_adquisicion) || null, // null for create if invalid
            estado: data.estado as string,
            fecha_registro: new Date()
        }
    });
    return formatEquipo(created);
}

export async function updateEquipo(id: number, data: Partial<Equipo>): Promise<Equipo> {
    const { fecha_registro, ...dataWithoutRegistration } = data as any; // Exclude fecha_registro

    const updateData: any = {
        ...dataWithoutRegistration,
        fecha_adquisicion: safeDate(data.fecha_adquisicion),
        estado: data.estado as string
    };

    if (data.id_area !== undefined) {
        updateData.id_area = Number(data.id_area);
    }
    if (data.horometro !== undefined) {
        updateData.horometro = Number(data.horometro);
    }
    if (data.horometro_mantenimiento !== undefined) {
        updateData.horometro_mantenimiento = Number(data.horometro_mantenimiento);
    }

    const updated = await prisma.equipo.update({
        where: { id_equipo: id },
        data: updateData
    });
    return formatEquipo(updated);
}

export async function deleteEquipo(id: number): Promise<void> {
    await prisma.equipo.delete({ where: { id_equipo: id } });
}

export async function getMaintenanceHistory(idEquipo: number): Promise<MantenimientoEquipo[]> {
    const data = await prisma.mantenimientoEquipo.findMany({
        where: { id_equipo: idEquipo }
    });
    return data.map(formatMantenimiento);
}

// Object exports removed - "use server" files can only export async functions
