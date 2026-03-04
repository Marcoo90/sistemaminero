import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const maxArea = await prisma.area.findMany({
        orderBy: { id_area: 'desc' },
        take: 1
    });
    console.log('Max Area ID:', maxArea[0]?.id_area);

    const allAreas = await prisma.area.findMany();
    console.log('All Area IDs:', allAreas.map(a => a.id_area));
}

main().catch(console.error).finally(() => prisma.$disconnect());
