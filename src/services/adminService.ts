"use server";

import { prisma } from '@/lib/prisma';
import { Vale, Orden, Proveedor } from '@/types';

const formatVale = (v: any): Vale => ({
    ...v,
    fecha: v.fecha.toISOString().split('T')[0],
    estado: v.estado as Vale['estado']
});

const formatOrden = (o: any): Orden => ({
    ...o,
    fecha: o.fecha.toISOString().split('T')[0],
    estado: o.estado as Orden['estado']
});

export async function getValesAll(): Promise<Vale[]> {
    const data = await prisma.vale.findMany();
    return data.map(formatVale);
}

export async function createVale(data: Omit<Vale, 'id_vale'>): Promise<Vale> {
    const { id_vale, ...valeData } = data as any;
    const created = await prisma.vale.create({
        data: {
            ...valeData,
            id_area: Number(data.id_area),
            monto: Number(data.monto),
            fecha: new Date(data.fecha),
            estado: data.estado as string
        }
    });
    return formatVale(created);
}

export async function updateVale(id: number, data: Partial<Vale>): Promise<Vale> {
    const updated = await prisma.vale.update({
        where: { id_vale: id },
        data: {
            ...data,
            id_area: data.id_area ? Number(data.id_area) : undefined,
            monto: data.monto ? Number(data.monto) : undefined,
            fecha: data.fecha ? new Date(data.fecha) : undefined,
            estado: data.estado as string
        }
    });
    return formatVale(updated);
}

export async function deleteVale(id: number): Promise<void> {
    await prisma.vale.delete({
        where: { id_vale: id }
    });
}

export async function getOrdenesAll(): Promise<Orden[]> {
    const data = await prisma.orden.findMany({
        include: { detalles: true, area: true },
        orderBy: { id_orden: 'desc' }
    });
    return data.map(formatOrden);
}

export async function createOrden(data: Omit<Orden, 'id_orden'> & { detalles?: { descripcion: string; cantidad: number; unidad_medida?: string }[] }): Promise<Orden> {
    const { detalles, area, ...ordenData } = data;

    // Calculate total explicitly if not provided, though it's not a field in schema yet.
    // Assuming ordenData contains the main level description/cantidad which might serve as a summary or be deprecated.
    // For now we keep them populated possibly with the first item or a summary string.

    const created = await prisma.orden.create({
        data: {
            ...ordenData,
            id_area: Number(data.id_area),
            cantidad: Number(data.cantidad), // Kept for legacy compatibility
            fecha: new Date(`${data.fecha}T12:00:00Z`),
            estado: data.estado as string,
            detalles: {
                create: detalles?.map(d => ({
                    descripcion: d.descripcion,
                    cantidad: Number(d.cantidad),
                    unidad_medida: d.unidad_medida
                })) || []
            }
        },
        include: { detalles: true }
    });
    return formatOrden(created);
}

export async function updateOrden(id: number, data: Partial<Orden> & { detalles?: { descripcion: string; cantidad: number; unidad_medida?: string }[] }): Promise<Orden> {
    const { detalles, area, ...ordenData } = data;

    // Use transaction to update main data and replace details
    const updated = await prisma.$transaction(async (tx) => {
        if (detalles) {
            // Delete existing details
            await tx.detalleOrden.deleteMany({
                where: { id_orden: id }
            });

            // Create new details
            // We can't use update with nested create easily for replace logic without deleteMany first usually
            // Alternatively we could use update with deleteMany and create in one operation if supported, but manual step is safer here.
        }

        const op = await tx.orden.update({
            where: { id_orden: id },
            data: {
                ...ordenData,
                id_area: ordenData.id_area ? Number(ordenData.id_area) : undefined,
                cantidad: ordenData.cantidad ? Number(ordenData.cantidad) : undefined,
                fecha: ordenData.fecha ? new Date(`${ordenData.fecha}T12:00:00Z`) : undefined,
                estado: ordenData.estado as string,
                detalles: detalles ? {
                    create: detalles.map(d => ({
                        descripcion: d.descripcion,
                        cantidad: Number(d.cantidad),
                        unidad_medida: d.unidad_medida
                    }))
                } : undefined
            },
            include: { detalles: true }
        });
        return op;
    }, {
        maxWait: 10000,
        timeout: 20000
    });

    return formatOrden(updated);
}

export async function deleteOrden(id: number): Promise<void> {
    await prisma.orden.delete({
        where: { id_orden: id }
    });
}

export async function getProveedoresAll(): Promise<Proveedor[]> {
    return await prisma.proveedor.findMany() as Proveedor[];
}

export async function createProveedor(data: Omit<Proveedor, 'id_proveedor'>): Promise<Proveedor> {
    const { id_proveedor, ...proveedorData } = data as any;
    const created = await prisma.proveedor.create({
        data: proveedorData
    });
    return created as Proveedor;
}

export async function updateProveedor(id: number, data: Partial<Proveedor>): Promise<Proveedor> {
    const updated = await prisma.proveedor.update({
        where: { id_proveedor: id },
        data
    });
    return updated as Proveedor;
}

export async function deleteProveedor(id: number): Promise<void> {
    await prisma.proveedor.delete({
        where: { id_proveedor: id }
    });
}

// Object exports removed - "use server" files can only export async functions
