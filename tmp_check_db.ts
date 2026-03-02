import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
    try {
        const vCount = await prisma.vehiculo.count();
        const pCount = await prisma.personal.count();
        const uCount = await prisma.usuario.count();
        const activeVehicles = await prisma.vehiculo.findMany({ where: { estado: 'operativo' } });

        console.log(`Vehículos totales: ${vCount}`);
        console.log(`Vehículos operativos: ${activeVehicles.length}`);
        activeVehicles.forEach(v => console.log(`- ${v.placa} (${v.codigo_vehiculo})`));
        console.log(`Personal total: ${pCount}`);
        console.log(`Usuarios registrados: ${uCount}`);

        const users = await prisma.usuario.findMany({ include: { personal: true } });
        users.forEach(u => console.log(`- Usuario: ${u.usuario}, Rol: ${u.rol}, Personal vinculado: ${u.personal?.nombres || 'Ninguno'}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
