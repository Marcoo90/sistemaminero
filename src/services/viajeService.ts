"use server";

import { prisma } from '@/lib/prisma';
import { Viaje, GastoViaje } from '@/types';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { supabase } from '@/lib/supabase';
// import sharp from 'sharp'; // Mantenemos fuera para evitar carga en SSR

// Helper for date formatting
const formatViaje = (v: any): Viaje => {
    try {
        return {
            id_viaje: v.id_viaje,
            id_vehiculo: v.id_vehiculo,
            id_conductor: v.id_conductor,
            origen: v.origen,
            destino: v.destino,
            km_inicial: v.km_inicial,
            km_final: v.km_final,
            fecha_salida: v.fecha_salida instanceof Date ? v.fecha_salida.toISOString() : new Date(v.fecha_salida).toISOString(),
            fecha_retorno: v.fecha_retorno ? (v.fecha_retorno instanceof Date ? v.fecha_retorno.toISOString() : new Date(v.fecha_retorno).toISOString()) : null,
            estado: v.estado as Viaje['estado'],
            // Las relaciones se incluyen solo si existen y con el mismo formato limpio
            vehiculo: v.vehiculo ? {
                id_vehiculo: v.vehiculo.id_vehiculo,
                placa: v.vehiculo.placa,
                codigo_vehiculo: v.vehiculo.codigo_vehiculo
            } as any : undefined,
            conductor: v.conductor ? {
                id_personal: v.conductor.id_personal,
                nombres: v.conductor.nombres
            } as any : undefined,
            gastos: v.gastos ? v.gastos.map(formatGasto) : []
        };
    } catch (e) {
        console.error("Error formatting viaje:", e);
        return v;
    }
};

const formatGasto = (g: any): GastoViaje => {
    try {
        return {
            id_gasto: g.id_gasto,
            id_viaje: g.id_viaje,
            tipo: g.tipo,
            monto: g.monto,
            fecha: g.fecha instanceof Date ? g.fecha.toISOString() : new Date(g.fecha).toISOString(),
            foto_url: g.foto_url,
            observaciones: g.observaciones
        };
    } catch (e) {
        console.error("Error formatting gasto:", e);
        return g;
    }
};

export async function getViajesByConductor(idConductor: number): Promise<Viaje[]> {
    try {
        const viajes = await prisma.viaje.findMany({
            where: { id_conductor: idConductor },
            include: { vehiculo: true, gastos: true },
            orderBy: { fecha_salida: 'desc' }
        });
        if (!viajes) return [];
        return viajes.map(formatViaje);
    } catch (e) {
        console.error("error getViajesByConductor:", e);
        return [];
    }
}

export async function getViajesAll(): Promise<Viaje[]> {
    try {
        const viajes = await prisma.viaje.findMany({
            include: { vehiculo: true, conductor: true, gastos: true },
            orderBy: { fecha_salida: 'desc' }
        });
        if (!viajes) return [];
        return viajes.map(formatViaje);
    } catch (e) {
        console.error("error getViajesAll:", e);
        return [];
    }
}

export async function getViajeActivo(idConductor: number): Promise<Viaje | null> {
    try {
        const viaje = await prisma.viaje.findFirst({
            where: {
                id_conductor: idConductor,
                estado: 'en_ruta'
            },
            include: { vehiculo: true, gastos: true }
        });
        return viaje ? formatViaje(viaje) : null;
    } catch (e) {
        console.error("error getViajeActivo:", e);
        return null;
    }
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

    // 1. Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let processedBuffer = buffer;
    let contentType = file.type || 'image/jpeg';
    let finalExtension = file.type.split('/')[1] || 'jpg';

    // 2. Intentar optimizar con SHARP (Resiliente)
    try {
        const sharp = (await import('sharp')).default;
        const optimized = await sharp(buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
        processedBuffer = optimized as any;
        contentType = 'image/webp';
        finalExtension = 'webp';
        console.log("SHARP: Imagen optimizada con éxito.");
    } catch (sharpError) {
        console.error("SHARP_FAIL: Falló la optimización, usando original:", sharpError);
        // Si falla sharp, mantenemos los valores originales de buffer y contentType
    }

    const filename = `${Date.now()}_comprobante.${finalExtension}`;

    // 3. Subir a Supabase Storage
    const { data, error } = await supabase.storage
        .from('comprobantes')
        .upload(filename, processedBuffer, {
            contentType: contentType,
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
