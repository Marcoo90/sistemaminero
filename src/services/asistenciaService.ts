"use server";

import { prisma } from '@/lib/prisma';
import { Asistencia } from '@/types';

const formatAsistencia = (a: any): Asistencia => ({
    ...a,
    fecha: a.fecha.toISOString().split('T')[0],
    estado: a.estado as Asistencia['estado']
});

export async function getAsistenciasAll(): Promise<Asistencia[]> {
    const data = await prisma.asistencia.findMany();
    return data.map(formatAsistencia);
}

export async function getAsistenciasByMonth(month: number, year: number): Promise<Asistencia[]> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const data = await prisma.asistencia.findMany({
        where: {
            fecha: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    return data.map(formatAsistencia);
}

export async function upsertAsistencia(data: Omit<Asistencia, 'id_asistencia'>): Promise<Asistencia> {
    const date = new Date(data.fecha);

    const existing = await prisma.asistencia.findFirst({
        where: {
            id_personal: data.id_personal,
            fecha: date
        }
    });

    if (existing) {
        const updated = await prisma.asistencia.update({
            where: { id_asistencia: existing.id_asistencia },
            data: {
                turno_dia: data.turno_dia,
                turno_noche: data.turno_noche,
                estado: data.estado,
                observaciones: data.observaciones
            }
        });
        return formatAsistencia(updated);
    } else {
        const { id_asistencia, ...asistenciaData } = data as any;
        const created = await prisma.asistencia.create({
            data: {
                ...asistenciaData,
                fecha: date
            }
        });
        return formatAsistencia(created);
    }
}

export async function createAsistencia(data: Omit<Asistencia, 'id_asistencia'>): Promise<Asistencia> {
    return upsertAsistencia(data);
}

// Object exports removed - "use server" files can only export async functions
