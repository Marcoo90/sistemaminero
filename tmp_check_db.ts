import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
    try {
        const users = await prisma.usuario.findMany({
            include: {
                personal: {
                    include: { area: true }
                }
            }
        });
        console.log("Usuarios y su relación con personal/área:");
        users.forEach(u => {
            console.log(`- Usuario: ${u.usuario}`);
            console.log(`  Rol: ${u.rol}`);
            console.log(`  Personal: ${u.personal?.nombres || 'Ninguno'}`);
            console.log(`  ID Área Personal: ${u.personal?.id_area || 'N/A'}`);
            console.log(`  Nombre Área: ${u.personal?.area?.nombre_area || 'N/A'}`);
            console.log('-------------------');
        });

        const vehiculos = await prisma.vehiculo.findMany();
        console.log("Vehículos en DB:");
        vehiculos.forEach(v => {
            console.log(`- Placa: ${v.placa}, Estado: ${v.estado}, ID Área: ${v.id_area}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
