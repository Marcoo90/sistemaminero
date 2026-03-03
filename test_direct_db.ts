import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Intentando obtener vehículos con Prisma...");
        const vehiculos = await prisma.vehiculo.findMany();
        console.log("Conteo de vehículos:", vehiculos.length);
        console.log("Datos:", JSON.stringify(vehiculos, null, 2));

        const operativos = vehiculos.filter(v => v.estado === 'operativo');
        console.log("Operativos:", operativos.length);
    } catch (error) {
        console.error("Error en la prueba:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
