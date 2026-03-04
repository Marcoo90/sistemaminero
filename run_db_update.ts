import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Sincronizando Secuencias y Actualizando Base de Datos ---');

    // Resetear secuencias en PostgreSQL para evitar errores de restricción única
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Area"', 'id_area'), (SELECT MAX(id_area) FROM "Area"))`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Almacen"', 'id_almacen'), (SELECT MAX(id_almacen) FROM "Almacen"))`);
        console.log('Secuencias sincronizadas.');
    } catch (err) {
        console.log('Nota: No se pudo sincronizar secuencias (posiblemente no es PostgreSQL o tablas vacías).', err);
    }

    // 1. Agregar nueva área: Qori Ñawi
    let areaQori = await prisma.area.findFirst({ where: { nombre_area: 'Qori Ñawi' } });
    if (!areaQori) {
        areaQori = await prisma.area.create({
            data: {
                nombre_area: 'Qori Ñawi',
                descripcion: 'Nueva área operativa'
            }
        });
        console.log('Área agregada:', areaQori.nombre_area);
    } else {
        console.log('Área ya existe:', areaQori.nombre_area);
    }

    // 2. Agregar nuevos almacenes
    const almacenesNuevos = [
        'Almacén de Rampa 1',
        'Almacén de Rampa 2',
        'Almacén de Rampa 3',
        'Almacén de Rampa 4',
        'Almacén de 5 Estrellas'
    ];

    for (const nombre of almacenesNuevos) {
        const existing = await prisma.almacen.findFirst({ where: { nombre } });
        if (!existing) {
            const nuevo = await prisma.almacen.create({
                data: {
                    nombre,
                    ubicacion: 'Operaciones',
                    responsable: 'Por asignar'
                }
            });
            console.log('Almacén agregado:', nuevo.nombre);
        } else {
            console.log('Almacén ya existe:', existing.nombre);
        }
    }

    console.log('--- Actualización completada ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
