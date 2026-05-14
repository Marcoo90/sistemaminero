"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { toPeruTime } from '@/lib/dateUtils';
import { SalidaExplosivos } from '@/types';

const formatSalida = (s: any): any => ({
    ...s,
    fecha: s.fecha ? toPeruTime(s.fecha) : '',
    personal: s.personal ? {
        ...s.personal,
        area: s.personal.area,
    } : undefined,
});

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getSalidasExplosivosAll(): Promise<any[]> {
    const data = await prisma.salidaExplosivos.findMany({
        include: {
            personal: { include: { area: true } },
            detalles: true,
        },
        orderBy: { fecha: 'desc' },
    });
    return data.map(formatSalida);
}

export async function getSalidaExplosivosById(id: number): Promise<any | null> {
    const data = await prisma.salidaExplosivos.findUnique({
        where: { id_salida_exp: id },
        include: {
            personal: { include: { area: true } },
            detalles: true,
        },
    });
    return data ? formatSalida(data) : null;
}

// ─── Write (with transactional stock decrement) ───────────────────────────────

export interface DetalleInput {
    tipo_insumo: string;
    variante?: string;
    cantidad: number;
    id_material?: number; // id_material in explosives warehouse to discount stock
}

export interface SalidaExplosivosInput {
    id_personal: number;
    turno: string;
    zona_area: string;
    tipo_labor: string;
    planilla_contrata?: string;
    hora_disparo?: string;
    nivel?: number;
    tipo_perforacion?: string;
    num_disparos?: number;
    pies_taladros?: number;
    id_almacen: number;
    observaciones?: string;
    detalles: DetalleInput[];
}

export async function registrarSalidaExplosivos(input: SalidaExplosivosInput): Promise<boolean> {
    await prisma.$transaction(async (tx: any) => {
        // 1. Validate stock BEFORE creating anything
        for (const det of input.detalles) {
            if (!det.id_material || det.cantidad <= 0) continue;

            const stock = await tx.stockMaterial.findUnique({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(det.id_material),
                        id_almacen: Number(input.id_almacen),
                    },
                },
            });

            if (!stock || stock.stock_actual < det.cantidad) {
                const material = await tx.material.findUnique({
                    where: { id_material: Number(det.id_material) },
                    select: { nombre: true },
                });
                throw new Error(
                    `Stock insuficiente para "${material?.nombre || det.tipo_insumo}". Disponible: ${stock?.stock_actual ?? 0}`
                );
            }
        }

        // 2. Create the header record
        const salida = await tx.salidaExplosivos.create({
            data: {
                id_personal: Number(input.id_personal),
                fecha: new Date(),
                turno: input.turno,
                zona_area: input.zona_area,
                tipo_labor: input.tipo_labor,
                planilla_contrata: input.planilla_contrata,
                hora_disparo: input.hora_disparo,
                nivel: input.nivel ? Number(input.nivel) : null,
                tipo_perforacion: input.tipo_perforacion,
                num_disparos: input.num_disparos ? Number(input.num_disparos) : null,
                pies_taladros: input.pies_taladros ? Number(input.pies_taladros) : null,
                id_almacen: Number(input.id_almacen),
                observaciones: input.observaciones,
                detalles: {
                    create: input.detalles
                        .filter(d => d.cantidad > 0)
                        .map(d => ({
                            tipo_insumo: d.tipo_insumo,
                            variante: d.variante,
                            cantidad: Number(d.cantidad),
                            id_material: d.id_material ? Number(d.id_material) : null,
                        })),
                },
            },
        });

        // 3. Also create a SalidaMaterial record for traceability in the main warehouse log
        const personalData = await tx.personal.findUnique({
            where: { id_personal: Number(input.id_personal) },
            select: { nombres: true, id_area: true },
        });

        const detallesConMaterial = input.detalles.filter(
            d => d.id_material && d.cantidad > 0
        );

        if (detallesConMaterial.length > 0) {
            await tx.salidaMaterial.create({
                data: {
                    fecha: new Date(),
                    tipo_salida: 'explosivos',
                    id_area: Number(personalData?.id_area ?? 1),
                    solicitado_por: personalData?.nombres ?? 'Personal',
                    autorizado_por: 'Sistema - Salida Explosivos',
                    id_almacen: Number(input.id_almacen),
                    observaciones: `Salida explosivos ref. #${salida.id_salida_exp}`,
                    detalles: {
                        create: detallesConMaterial.map(d => ({
                            id_material: Number(d.id_material),
                            cantidad: Number(d.cantidad),
                        })),
                    },
                },
            });

            // 4. Decrement stock for each item
            for (const det of detallesConMaterial) {
                await tx.stockMaterial.update({
                    where: {
                        id_material_id_almacen: {
                            id_material: Number(det.id_material),
                            id_almacen: Number(input.id_almacen),
                        },
                    },
                    data: {
                        stock_actual: { decrement: Number(det.cantidad) },
                    },
                });
            }
        }
    }, { maxWait: 10000, timeout: 20000 });

    revalidatePath('/personal/explosivos', 'layout');
    revalidatePath('/almacen', 'layout');
    return true;
}

export async function deleteSalidaExplosivos(id: number): Promise<void> {
    await prisma.detalleSalidaExplosivos.deleteMany({ where: { id_salida_exp: id } });
    await prisma.salidaExplosivos.delete({ where: { id_salida_exp: id } });
    revalidatePath('/personal/explosivos', 'layout');
}
