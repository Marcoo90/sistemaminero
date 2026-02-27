"use server";

import { prisma } from '@/lib/prisma';
import { Area, Personal, Contrato } from '@/types';
import { toPeruDate, toPeruTime } from '@/lib/dateUtils';

// Helper to convert Prisma dates to formatted strings
const formatDateRange = (item: any) => {
    if (!item) return item;
    return {
        ...item,
        fecha_ingreso: item.fecha_ingreso ? toPeruDate(item.fecha_ingreso) : null,
        fecha_registro: item.fecha_registro ? toPeruTime(item.fecha_registro) : null,
        // Keep raw objects if specifically needed, but usually we want formatted
        // For existing calls relying on ISO-ish strings (YYYY-MM-DD), toPeruDate returns dd/mm/yyyy.
        // If frontend expects YYYY-MM-DD for inputs, we might need a separate helper. 
        // But user asked for "fecha debe ser hora y fecha peruana" generally implies display.
    };
};

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

const formatPersonal = (item: any) => ({
    ...item,
    fecha_ingreso: item.fecha_ingreso ? toPeruDate(item.fecha_ingreso) : '',
    fecha_registro: item.fecha_registro ? toPeruTime(item.fecha_registro) : '',
});

// Area Functions
export async function getAreasAll(): Promise<Area[]> {
    return await prisma.area.findMany() as Area[];
}

export async function getAreaById(id: number): Promise<Area | undefined> {
    const area = await prisma.area.findUnique({ where: { id_area: id } });
    return area ? (area as Area) : undefined;
}

// Personal Functions
export async function getPersonalAll(): Promise<Personal[]> {
    const data = await prisma.personal.findMany({
        where: { estado: { not: 'inactivo' } },
        orderBy: { id_personal: 'desc' }
    });
    return data.map(formatPersonal) as Personal[];
}

export async function getPersonalById(id: number): Promise<Personal | undefined> {
    const personal = await prisma.personal.findUnique({ where: { id_personal: id } });
    return personal ? (formatPersonal(personal) as Personal) : undefined;
}

export async function createPersonal(data: Omit<Personal, 'id_personal'>): Promise<Personal> {
    const created = await prisma.personal.create({
        data: {
            dni: data.dni,
            nombres: data.nombres,
            cargo: data.cargo,
            id_area: Number(data.id_area),
            regimen: data.regimen,
            fecha_ingreso: new Date(data.fecha_ingreso), // Assuming input is YYYY-MM-DD
            estado: data.estado as string,
            telefono: data.telefono,
            observaciones: data.observaciones,
            fecha_registro: new Date()
        }
    });
    return formatPersonal(created) as Personal;
}

export async function updatePersonal(id: number, data: Partial<Personal>): Promise<Personal> {
    const updated = await prisma.personal.update({
        where: { id_personal: id },
        data: {
            dni: data.dni,
            nombres: data.nombres,
            cargo: data.cargo,
            id_area: data.id_area ? Number(data.id_area) : undefined,
            regimen: data.regimen,
            //@ts-ignore
            fecha_ingreso: data.fecha_ingreso ? new Date(data.fecha_ingreso) : undefined,
            estado: data.estado,
            telefono: data.telefono,
            observaciones: data.observaciones
        }
    });
    return formatPersonal(updated) as Personal;
}

export async function deletePersonal(id: number): Promise<void> {
    // Soft delete due to constraints
    await prisma.personal.update({
        where: { id_personal: id },
        data: { estado: 'inactivo' }
    });
}

// Contracts
export async function getContratos(idPersonal?: number): Promise<Contrato[]> {
    const data = await prisma.contrato.findMany({
        where: idPersonal ? { id_personal: idPersonal } : {}
    });
    return data.map((c: any) => ({
        ...c,
        fecha_inicio: toPeruDate(c.fecha_inicio),
        fecha_fin: toPeruDate(c.fecha_fin)
    })) as Contrato[];
}

export async function createContrato(data: Omit<Contrato, 'id_contrato'>): Promise<Contrato> {
    const { id_contrato, ...contratoData } = data as any;
    const created = await prisma.contrato.create({
        data: {
            ...contratoData,
            fecha_inicio: new Date(data.fecha_inicio),
            fecha_fin: new Date(data.fecha_fin),
        }
    });
    return {
        ...created,
        fecha_inicio: toPeruDate(created.fecha_inicio),
        fecha_fin: toPeruDate(created.fecha_fin)
    } as Contrato;
}

// PPE (EPP)
export async function getEPPByPersonal(idPersonal: number): Promise<any[]> {
    const data = await prisma.entregaEPP.findMany({
        where: { id_personal: idPersonal },
        include: {
            detalles: {
                include: {
                    material: true
                }
            }
        }
    });
    return JSON.parse(JSON.stringify(data));
}

export async function getEntregaEPPAll(): Promise<any[]> {
    const data = await prisma.entregaEPP.findMany({
        include: {
            personal: {
                include: { area: true }
            },
            detalles: {
                include: {
                    material: true
                }
            }
        },
        orderBy: { fecha: 'desc' }
    });
    return data.map((d: any) => ({
        ...d,
        fecha: toPeruTime(d.fecha)
    }));
}

export async function registrarEntregaEPP(entrega: any, detalles: any[]): Promise<boolean> {
    await prisma.$transaction(async (tx: any) => {
        // 1. Create the delivery record
        await tx.entregaEPP.create({
            data: {
                ...entrega,
                id_personal: Number(entrega.id_personal),
                id_almacen: Number(entrega.id_almacen),
                fecha: new Date(),
                detalles: {
                    create: detalles.map((d: any) => ({
                        id_material: Number(d.id_material),
                        cantidad: Number(d.cantidad),
                        talla: d.talla
                    }))
                }
            }
        });

        // 2. Validate and Decrement stock for each item
        for (const item of detalles) {
            const stock = await tx.stockMaterial.findUnique({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(item.id_material),
                        id_almacen: Number(entrega.id_almacen)
                    }
                }
            });

            if (!stock || stock.stock_actual < Number(item.cantidad)) {
                // Fetch material name for a descriptive error message
                const material = await tx.material.findUnique({
                    where: { id_material: Number(item.id_material) },
                    select: { nombre: true }
                });
                throw new Error(`Stock insuficiente para "${material?.nombre || 'el material'}". Disponible: ${stock?.stock_actual || 0}`);
            }

            await tx.stockMaterial.update({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(item.id_material),
                        id_almacen: Number(entrega.id_almacen)
                    }
                },
                data: {
                    stock_actual: { decrement: Number(item.cantidad) }
                }
            });
        }
    });
    return true;
}

export async function deleteEntregaEPP(id: number): Promise<void> {
    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Eliminar detalles primero
            await tx.detalleEntregaEPP.deleteMany({
                where: { id_entrega_epp: id }
            });

            // 2. Eliminar la cabecera
            await tx.entregaEPP.delete({
                where: { id_entrega_epp: id }
            });
        });
    } catch (error: any) {
        console.error("Error al eliminar entrega EPP:", error);
        throw new Error('Error al intentar eliminar la entrega de EPP y sus detalles.');
    }
}


// Object exports removed - "use server" files can only export async functions
