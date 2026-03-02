"use server";

import { prisma } from '@/lib/prisma';
import { Viaje, GastoViaje } from '@/types';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

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

    // Generar un nombre de archivo único con extensión .webp para máxima compresión
    const filename = `${Date.now()}_comprobante.webp`;

    // 1. Convertir el archivo a Buffer para poder procesarlo en el servidor
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Procesar con SHARP para optimizar
    // - Redimensionamos a un ancho máximo de 1200px
    // - Convertimos a formato WebP (más ligero que JPG/PNG)
    // - Calidad del 80% (mantiene perfecta legibilidad)
    const processedBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    // 3. Subir el Buffer optimizado a Supabase Storage
    const { data, error } = await supabase.storage
        .from('comprobantes')
        .upload(filename, processedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error subiendo a Supabase:', error);
        throw new Error('No se pudo subir la imagen optimizada a Supabase');
    }

    // Obtener la URL pública de la imagen
    const { data: { publicUrl } } = supabase.storage
        .from('comprobantes')
        .getPublicUrl(filename);

    return publicUrl;
}

export async function deleteViaje(id: number): Promise<void> {
    await prisma.viaje.delete({
        where: { id_viaje: id }
    });
}
