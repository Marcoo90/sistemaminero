import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const areas = await prisma.area.findMany();
    const almacenes = await prisma.almacen.findMany();

    console.log('Areas:', JSON.stringify(areas, null, 2));
    console.log('Almacenes:', JSON.stringify(almacenes, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
