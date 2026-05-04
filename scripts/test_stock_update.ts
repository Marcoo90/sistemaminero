import { saveMaterial } from '../src/services/almacenService';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("Creating/Finding material and warehouse...");
    
    let almacen = await prisma.almacen.findFirst();
    if (!almacen) {
        almacen = await prisma.almacen.create({ data: { nombre: "Test Almacen", ubicacion: "Test", responsable: "Test" } });
    }

    let cat = await prisma.categoriaMaterial.findFirst();
    if (!cat) {
        cat = await prisma.categoriaMaterial.create({ data: { nombre: "Test Cat" } });
    }

    let mat = await prisma.material.findFirst({ where: { codigo_material: "TEST-001" }});
    if (!mat) {
        mat = await prisma.material.create({ 
            data: { codigo_material: "TEST-001", nombre: "Test Mat", id_categoria: cat.id_categoria, unidad_medida: "un", estado: "activo" } 
        });
    }

    await prisma.stockMaterial.upsert({
        where: { id_material_id_almacen: { id_material: mat.id_material, id_almacen: almacen.id_almacen } },
        update: { stock_actual: 50 },
        create: { id_material: mat.id_material, id_almacen: almacen.id_almacen, stock_actual: 50 }
    });

    console.log(`Stock initialized to 50 for Mat: ${mat.id_material}, Almacen: ${almacen.id_almacen}`);

    console.log("Calling saveMaterial to overwrite stock to 10...");
    await saveMaterial({
        id_material: mat.id_material,
        codigo_material: "TEST-001",
        nombre: "Test Mat",
        id_categoria: cat.id_categoria,
        unidad_medida: "un",
        id_almacen: almacen.id_almacen,
        stock_inicial: 10,
        force_set_stock: true,
        precio: 0
    });

    const stock = await prisma.stockMaterial.findUnique({
        where: { id_material_id_almacen: { id_material: mat.id_material, id_almacen: almacen.id_almacen } }
    });

    console.log("Stock after saveMaterial:", stock?.stock_actual);
}

main().catch(console.error).finally(() => prisma.$disconnect());
