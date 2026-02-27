"use server";

import { prisma } from '@/lib/prisma';
import {
    Almacen,
    CategoriaMaterial,
    Material,
    IngresoMaterial,
    SalidaMaterial,
    StockMaterial
} from '@/types';
import { toPeruDate, toPeruTime } from '@/lib/dateUtils';

const formatMaterial = (m: any): Material => ({
    ...m,
    precio: m.precio ? Number(m.precio.toFixed(2)) : 0,
    estado: m.estado as Material['estado'],
    fecha_registro: m.fecha_registro ? toPeruTime(m.fecha_registro) : ''
});

const formatIngreso = (i: any): IngresoMaterial => ({
    ...i,
    fecha: toPeruDate(i.fecha)
});

const formatSalida = (s: any): SalidaMaterial => ({
    ...s,
    fecha: toPeruDate(s.fecha)
});

export async function getAlmacenesAll(): Promise<Almacen[]> {
    const data = await prisma.almacen.findMany();
    return data.map((a: any) => ({
        ...a,
        fecha_registro: (a as any).fecha_registro ? toPeruTime((a as any).fecha_registro) : ''
    })) as Almacen[];
}

export async function getCategoriasAll(): Promise<CategoriaMaterial[]> {
    return await prisma.categoriaMaterial.findMany() as CategoriaMaterial[];
}

export async function getMaterialesAll(): Promise<Material[]> {
    const data = await prisma.material.findMany({
        include: {
            categoria: true,
            area: true
        }
    });
    return data.map(formatMaterial);
}

export async function getMaterialById(id: number): Promise<Material | undefined> {
    const material = await prisma.material.findUnique({ where: { id_material: id } });
    return material ? formatMaterial(material) : undefined;
}

export async function getStockByAlmacen(idAlmacen: number): Promise<StockMaterial[]> {
    return await prisma.stockMaterial.findMany({
        where: { id_almacen: idAlmacen }
    }) as StockMaterial[];
}

// Returns total stock per material across all warehouses
export async function getAllStock(): Promise<any[]> {
    const data = await prisma.stockMaterial.groupBy({
        by: ['id_material'],
        _sum: {
            stock_actual: true
        }
    });

    return data.map((s: any) => ({
        id_material: s.id_material,
        stock_actual: s._sum.stock_actual || 0
    }));
}

export async function getIngresosAll(): Promise<IngresoMaterial[]> {
    const data = await prisma.ingresoMaterial.findMany();
    return data.map(formatIngreso);
}

export async function getSalidasAll(): Promise<SalidaMaterial[]> {
    const data = await prisma.salidaMaterial.findMany();
    return data.map(formatSalida);
}

export async function registrarIngreso(ingreso: Partial<IngresoMaterial>, detalles: any[]): Promise<boolean> {
    await prisma.$transaction(async (tx: any) => {
        const createdIngreso = await tx.ingresoMaterial.create({
            data: {
                fecha: new Date(),
                tipo_ingreso: ingreso.tipo_ingreso || 'ingreso',
                documento: ingreso.documento,
                id_proveedor: Number(ingreso.id_proveedor),
                id_almacen: Number(ingreso.id_almacen),
                recibido_por: ingreso.recibido_por,
                observaciones: ingreso.observaciones,
                detalles: {
                    create: detalles.map((det: any) => ({
                        id_material: Number(det.id_material),
                        cantidad: Number(det.cantidad),
                        costo_unitario: Number(det.costo_unitario),
                        costo_total: Number((Number(det.cantidad) * Number(det.costo_unitario)).toFixed(2))
                    }))
                }
            }
        });

        for (const det of detalles) {
            // Update material price (total value)
            const increment = Number((Number(det.cantidad) * Number(det.costo_unitario)).toFixed(2));
            await tx.material.update({
                where: { id_material: Number(det.id_material) },
                data: {
                    precio: { increment }
                }
            });

            await tx.stockMaterial.upsert({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(det.id_material),
                        id_almacen: Number(ingreso.id_almacen)
                    }
                },
                update: {
                    stock_actual: { increment: Number(det.cantidad) }
                },
                create: {
                    id_material: Number(det.id_material),
                    id_almacen: Number(ingreso.id_almacen),
                    stock_actual: Number(det.cantidad)
                }
            });
        }
    }, {
        maxWait: 10000,
        timeout: 20000
    });
    return true;
}

export async function registrarSalida(salida: Partial<SalidaMaterial>, detalles: any[]): Promise<boolean> {
    await prisma.$transaction(async (tx: any) => {
        await tx.salidaMaterial.create({
            data: {
                fecha: new Date(),
                tipo_salida: salida.tipo_salida || 'salida',
                id_area: Number(salida.id_area),
                solicitado_por: salida.solicitado_por,
                autorizado_por: salida.autorizado_por,
                id_almacen: Number(salida.id_almacen),
                observaciones: salida.observaciones,
                detalles: {
                    create: detalles.map((det: any) => ({
                        id_material: Number(det.id_material),
                        cantidad: Number(det.cantidad)
                    }))
                }
            }
        });

        for (const det of detalles) {
            const stock = await tx.stockMaterial.findUnique({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(det.id_material),
                        id_almacen: Number(salida.id_almacen)
                    }
                }
            });

            if (!stock || stock.stock_actual < Number(det.cantidad)) {
                // Fetch material name for error message
                const material = await tx.material.findUnique({
                    where: { id_material: Number(det.id_material) },
                    select: { nombre: true }
                });
                throw new Error(`Stock insuficiente para "${material?.nombre || 'el material'}". Disponible: ${stock?.stock_actual || 0}`);
            }

            await tx.stockMaterial.update({
                where: {
                    id_material_id_almacen: {
                        id_material: Number(det.id_material),
                        id_almacen: Number(salida.id_almacen)
                    }
                },
                data: {
                    stock_actual: { decrement: Number(det.cantidad) }
                }
            });

            // Update material price (total value) proportionally
            // First get current stock and price to calculate unit cost if not provided
            const material = await tx.material.findUnique({
                where: { id_material: det.id_material },
                select: { precio: true, stocks: true }
            });

            if (material) {
                const totalStock = await tx.stockMaterial.aggregate({
                    where: { id_material: det.id_material },
                    _sum: { stock_actual: true }
                });

                const currentStock = totalStock._sum.stock_actual || 0;
                // If we are at 0 stock, set price to 0, otherwise decrease proportionally
                if (currentStock <= 0) {
                    await tx.material.update({
                        where: { id_material: det.id_material },
                        data: { precio: 0 }
                    });
                } else {
                    const unitCost = material.precio / (currentStock + det.cantidad);
                    const decrement = Number((det.cantidad * unitCost).toFixed(2));
                    await tx.material.update({
                        where: { id_material: det.id_material },
                        data: { precio: { decrement } }
                    });
                }
            }
        }
    }, {
        maxWait: 10000,
        timeout: 20000
    });
    return true;
}

export async function saveMaterial(data: Partial<Material> & { stock_inicial?: number, id_almacen?: number }): Promise<boolean> {
    const id = data.id_material ? Number(data.id_material) : null;
    if (id && id > 0) {
        await prisma.material.update({
            where: { id_material: id },
            data: {
                codigo_material: data.codigo_material,
                nombre: data.nombre,
                id_categoria: data.id_categoria ? Number(data.id_categoria) : undefined,
                unidad_medida: data.unidad_medida,
                stock_minimo: data.stock_minimo !== undefined ? Number(data.stock_minimo) : undefined,
                descripcion: data.descripcion,
                id_area: data.id_area ? Number(data.id_area) : null,
                precio: data.precio !== undefined ? Number(Number(data.precio).toFixed(2)) : undefined,
                estado: data.estado as string
            }
        });
    } else {
        // Check for duplicate code
        const existing = await prisma.material.findUnique({ where: { codigo_material: data.codigo_material } });
        if (existing) throw new Error(`El código '${data.codigo_material}' ya está en uso.`);

        await prisma.$transaction(async (tx: any) => {
            const material = await tx.material.create({
                data: {
                    codigo_material: data.codigo_material!,
                    nombre: data.nombre!,
                    id_categoria: Number(data.id_categoria),
                    unidad_medida: data.unidad_medida!,
                    stock_minimo: Number(data.stock_minimo) || 0,
                    descripcion: data.descripcion,
                    id_area: data.id_area ? Number(data.id_area) : null,
                    precio: Number(Number(data.precio).toFixed(2)) || 0,
                    estado: data.estado || 'activo',
                    fecha_registro: new Date()
                }
            });

            if (data.stock_inicial && data.stock_inicial > 0 && data.id_almacen) {
                await tx.stockMaterial.create({
                    data: {
                        id_material: material.id_material,
                        id_almacen: Number(data.id_almacen),
                        stock_actual: Number(data.stock_inicial)
                    }
                });
            }
        }, {
            maxWait: 10000,
            timeout: 20000
        });
    }
    return true;
}

export async function saveCategoria(data: Partial<CategoriaMaterial>): Promise<boolean> {
    if (data.id_categoria) {
        await prisma.categoriaMaterial.update({
            where: { id_categoria: data.id_categoria },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion
            }
        });
    } else {
        await prisma.categoriaMaterial.create({
            data: {
                nombre: data.nombre!,
                descripcion: data.descripcion
            }
        });
    }
    return true;
}

export async function deleteMaterial(id: number): Promise<void> {
    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Eliminar detalles de EPP relacionados
            await tx.detalleEntregaEPP.deleteMany({ where: { id_material: id } });

            // 2. Eliminar detalles de salidas relacionados
            await tx.detalleSalidaMaterial.deleteMany({ where: { id_material: id } });

            // 3. Eliminar detalles de ingresos relacionados
            await tx.detalleIngresoMaterial.deleteMany({ where: { id_material: id } });

            // 4. Eliminar registros de stock
            await tx.stockMaterial.deleteMany({ where: { id_material: id } });

            // 5. Finalmente eliminar el material
            await tx.material.delete({ where: { id_material: id } });
        }, {
            maxWait: 10000,
            timeout: 20000
        });
    } catch (error: any) {
        console.error("Error al eliminar material:", error);
        throw new Error('Error al intentar eliminar el material y su historial relacionado.');
    }
}

export async function saveAlmacen(data: Partial<Almacen>): Promise<boolean> {
    if (data.id_almacen) {
        await prisma.almacen.update({
            where: { id_almacen: data.id_almacen },
            data: {
                nombre: data.nombre,
                ubicacion: data.ubicacion,
                responsable: data.responsable,
                observaciones: data.observaciones
            }
        });
    } else {
        await prisma.almacen.create({
            data: {
                nombre: data.nombre!,
                ubicacion: data.ubicacion,
                responsable: data.responsable,
                observaciones: data.observaciones,
                fecha_registro: new Date()
            }
        });
    }
    return true;
}

export async function deleteCategoria(id: number): Promise<void> {
    try {
        await prisma.categoriaMaterial.delete({
            where: { id_categoria: id }
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error('No se puede eliminar la categoría: tiene materiales asociados.');
        }
        throw error;
    }
}

export async function deleteAlmacen(id: number): Promise<void> {
    try {
        await prisma.almacen.delete({
            where: { id_almacen: id }
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error('No se puede eliminar el almacén: tiene materiales en stock o historial de movimientos vinculados.');
        }
        throw error;
    }
}

// Object exports removed - "use server" files can only export async functions
