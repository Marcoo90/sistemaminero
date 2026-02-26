import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Seeding database...');

    // 1. Areas
    const areas = [
        { id_area: 1, nombre_area: 'Planta', descripcion: '' },
        { id_area: 2, nombre_area: 'Milagritos', descripcion: '' },
        { id_area: 3, nombre_area: '5 Estrellas', descripcion: '' },
        { id_area: 4, nombre_area: 'Qori Pallay', descripcion: '' },
        { id_area: 5, nombre_area: 'Solming', descripcion: '' },
        { id_area: 6, nombre_area: 'Rampa 1', descripcion: '' },
        { id_area: 7, nombre_area: 'Rampa 2', descripcion: '' },
        { id_area: 8, nombre_area: 'Rampa 3', descripcion: '' },
        { id_area: 9, nombre_area: 'Rampa 4', descripcion: '' },
        { id_area: 10, nombre_area: 'Pilotos', descripcion: '' },
    ];

    for (const area of areas) {
        await prisma.area.upsert({
            where: { id_area: area.id_area },
            update: {},
            create: area,
        });
    }

    // 2. Personal
    const personal = [
        {
            id_personal: 1,
            dni: '12345678',
            nombres: 'Juan Perez',
            cargo: 'Supervisor de Mina',
            id_area: 2,
            regimen: '14x7',
            fecha_ingreso: new Date('2023-01-15'),
            estado: 'activo',
            telefono: '987654321',
            observaciones: ''
        },
        {
            id_personal: 2,
            dni: '87654321',
            nombres: 'Maria Lopez',
            cargo: 'Asistente Administrativo',
            id_area: 1,
            regimen: '5x2',
            fecha_ingreso: new Date('2023-03-10'),
            estado: 'activo',
            telefono: '912345678',
            observaciones: ''
        },
    ];

    for (const p of personal) {
        await prisma.personal.upsert({
            where: { id_personal: p.id_personal },
            update: {},
            create: p,
        });
    }

    // 3. Almacenes
    const almacenes = [
        { id_almacen: 1, nombre: 'Almacén Central', ubicacion: 'Campamento Principal', responsable: 'Carlos Ruiz', observaciones: 'Almacén principal de repuestos y materiales' },
        { id_almacen: 2, nombre: 'Almacén Explosivos', ubicacion: 'Zona de Seguridad 1', responsable: 'Luis Torres', observaciones: 'Acceso restringido' },
    ];

    for (const a of almacenes) {
        await prisma.almacen.upsert({
            where: { id_almacen: a.id_almacen },
            update: {},
            create: a,
        });
    }

    // 4. Categorias
    const categorias = [
        { id_categoria: 1, nombre: 'EPP', descripcion: 'Equipos de Protección Personal' },
        { id_categoria: 2, nombre: 'Repuestos', descripcion: 'Repuestos para maquinaria' },
        { id_categoria: 3, nombre: 'Consumibles', descripcion: 'Aceites, grasas, filtros' },
        { id_categoria: 4, nombre: 'Herramientas', descripcion: 'Herramientas de mano y eléctricas' },
        { id_categoria: 5, nombre: 'Explosivos', descripcion: 'Materiales explosivos y accesorios' },
        { id_categoria: 6, nombre: 'Insumos Químicos', descripcion: 'Reactivos e insumos químicos básicos' },
    ];

    for (const c of categorias) {
        await prisma.categoriaMaterial.upsert({
            where: { id_categoria: c.id_categoria },
            update: {},
            create: c,
        });
    }

    // 5. Materiales
    const materiales = [
        { id_material: 1, codigo_material: 'EPP-001', nombre: 'Casco de Seguridad Blanco', id_categoria: 1, unidad_medida: 'UND', stock_minimo: 20, descripcion: 'Casco con suspensión de 4 puntos', estado: 'activo' },
        { id_material: 2, codigo_material: 'REP-102', nombre: 'Filtro de Aceite CAT-320', id_categoria: 2, unidad_medida: 'UND', stock_minimo: 5, descripcion: 'Filtro para excavadora CAT 320', estado: 'activo' },
        { id_material: 3, codigo_material: 'CON-005', nombre: 'Grasa Multiusos Litio', id_categoria: 3, unidad_medida: 'KG', stock_minimo: 50, descripcion: 'Balde de 20kg', estado: 'activo' },
    ];

    for (const m of materiales) {
        await prisma.material.upsert({
            where: { id_material: m.id_material },
            update: {},
            create: m,
        });
    }

    console.log('Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
