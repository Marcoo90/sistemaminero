"use server";

import { prisma } from '@/lib/prisma';
import { Viaje, GastoViaje } from '@/types';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Helper for date formatting
const formatViaje = (v: any): Viaje => ({
    ...v,
    fecha_salida: v.fecha_salida.toISOString(),
    fecha_retorno: v.fecha_retorno?.toISOString() || null,
    estado: v.estado as Viaje['estado']
});

const formatGasto = (g: any): GastoViaje => ({
    ...g,
    fecha: g.fecha.toISOString(),
});

export async function getViajesByConductor(idConductor: number): Promise<Viaje[]> {
    const viajes = await prisma.viaje.findMany({
        where: { id_conductor: idConductor },
        include: { vehiculo: true, gastos: true },
        orderBy: { fecha_salida: 'desc' }
    });
    return viajes.map(formatViaje);
}

export async function getViajesAll(): Promise<Viaje[]> {
    const viajes = await prisma.viaje.findMany({
        include: { vehiculo: true, conductor: true, gastos: true },
        orderBy: { fecha_salida: 'desc' }
    });
    return viajes.map(formatViaje);
}

export async function getViajeActivo(idConductor: number): Promise<Viaje | null> {
    const viaje = await prisma.viaje.findFirst({
        where: {
            id_conductor: idConductor,
            estado: 'en_ruta'
        },
        include: { vehiculo: true, gastos: true }
    });
    return viaje ? formatViaje(viaje) : null;
}

export async function iniciarViaje(data: {
    id_vehiculo: number;
    id_conductor: number;
    origen: string;
    destino: string;
    km_inicial: number;
    fecha_salida: Date;
}): Promise<Viaje> {
    const nuevoViaje = await prisma.viaje.create({
        data: {
            id_vehiculo: Number(data.id_vehiculo),
            id_conductor: Number(data.id_conductor),
            origen: data.origen,
            destino: data.destino,
            km_inicial: Number(data.km_inicial),
            fecha_salida: data.fecha_salida,
            estado: 'en_ruta'
        }
    });
    revalidatePath('/viajes');
    return formatViaje(nuevoViaje);
}

export async function finalizarViaje(idViaje: number, kmFinal: number, fechaRetorno: Date): Promise<Viaje> {
    const viaje = await prisma.viaje.update({
        where: { id_viaje: idViaje },
        data: {
            km_final: Number(kmFinal),
            fecha_retorno: fechaRetorno,
            estado: 'finalizado'
        }
    });
    revalidatePath('/viajes');
    return formatViaje(viaje);
}

export async function registrarGasto(data: {
    id_viaje: number;
    tipo: string;
    monto: number;
    fecha: Date;
    foto_url?: string;
    observaciones?: string;
}): Promise<GastoViaje> {
    const gasto = await prisma.gastoViaje.create({
        data: {
            id_viaje: Number(data.id_viaje),
            tipo: data.tipo,
            monto: Number(data.monto),
            fecha: data.fecha,
            foto_url: data.foto_url,
            observaciones: data.observaciones
        }
    });
    revalidatePath('/viajes');
    return formatGasto(gasto);
}

export async function subirComprobante(formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No se ha subido ningún archivo');

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');

    // Ensure dir exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    return `/uploads/comprobantes/${filename}`;
}

export async function deleteViaje(id: number): Promise<void> {
    await prisma.viaje.delete({
        where: { id_viaje: id }
    });
}
