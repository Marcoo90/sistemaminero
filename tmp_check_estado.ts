import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEstado() {
    try {
        const vehiculos = await prisma.vehiculo.findMany({
            select: { placa: true, estado: true }
        });
        console.log("Estados exactos de los vehículos:");
        vehiculos.forEach(v => {
            console.log(`Placa: "${v.placa}", Estado: "${v.estado}" (Largo: ${v.estado.length})`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkEstado();
