import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contrato, EntregaEPP } from '@/types';

// Helper to add header
const addHeader = (doc: jsPDF, title: string) => {
    doc.setFontSize(18);
    doc.text('Sistema Minero - Reporte Oficial', 14, 20);
    doc.setFontSize(12);
    doc.text(title, 14, 30);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 38);
};

export const generateContratosPDF = (contratos: Contrato[], personalNames: Record<number, string>) => {
    const doc = new jsPDF();
    addHeader(doc, 'Reporte de Contratos de Personal');

    const tableData = contratos.map(c => [
        personalNames[c.id_personal] || 'Desconocido',
        c.tipo_contrato.replace('_', ' ').toUpperCase(),
        new Date(c.fecha_inicio).toLocaleDateString(),
        new Date(c.fecha_fin).toLocaleDateString(),
        `S/. ${c.sueldo_base.toFixed(2)}`,
        c.estado.toUpperCase()
    ]);

    autoTable(doc, {
        head: [['Personal', 'Tipo', 'Inicio', 'Fin', 'Sueldo', 'Estado']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save('reporte_contratos.pdf');
};

export const generateEPPPDF = (entregas: any[]) => {
    const doc = new jsPDF();
    addHeader(doc, 'Reporte Global de Entregas de EPP');

    const tableData: any[][] = [];

    entregas.forEach((entrega) => {
        const fecha = entrega.fecha ? entrega.fecha.split('-').reverse().join('/') : '-';
        const colaborador = entrega.personal?.nombres || 'No asignado';

        entrega.detalles.forEach((d: any) => {
            tableData.push([
                fecha,
                colaborador,
                entrega.personal?.area?.nombre_area || '-',
                d.material?.nombre || 'Material',
                d.cantidad,
                d.talla || '-',
                entrega.responsable_entrega
            ]);
        });
    });

    autoTable(doc, {
        head: [['Fecha', 'Colaborador', 'Área', 'Material', 'Cant.', 'Talla', 'Responsable']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 6, cellPadding: 1.5 },
        headStyles: { fillColor: [52, 73, 94] },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 40 },
            4: { cellWidth: 12, halign: 'center' },
            5: { cellWidth: 12, halign: 'center' },
            6: { cellWidth: 30 }
        },
        margin: { left: 14, right: 14 }
    });

    doc.save('reporte_epps_consolidado.pdf');
};

export const generateViajeReportPDF = (viajes: any[]) => {
    const doc = new jsPDF();
    addHeader(doc, 'Reporte Detallado de Viajes y Gastos');

    const tableData = viajes.map(v => {
        const totalGastos = v.gastos?.reduce((sum: number, g: any) => sum + g.monto, 0) || 0;
        return [
            new Date(v.fecha_salida).toLocaleDateString(),
            v.conductor?.nombres || 'Desconocido',
            `${v.origen} -> ${v.destino}`,
            v.vehiculo?.placa || '-',
            v.estado.toUpperCase(),
            `S/. ${totalGastos.toFixed(2)}`
        ];
    });

    autoTable(doc, {
        head: [['Fecha', 'Conductor', 'Ruta', 'Vehiculo', 'Estado', 'Total Gastos']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [46, 204, 113] }
    });

    doc.save('reporte_viajes_admin.pdf');
};

export const generateInventarioPDF = (materiales: any[], stock: any[], categorias: any[], almacenes: any[]) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    addHeader(doc, 'Reporte de Existencias e Inventario Global');

    const tableData = materiales.map(mat => {
        const matStock = stock.filter(s => s.id_material === mat.id_material);
        const cat = categorias.find(c => c.id_categoria === mat.id_categoria)?.nombre || '-';
        const area = mat.area?.nombre_area || 'Sin Área';

        return matStock.map(s => {
            const alm = almacenes.find(a => a.id_almacen === s.id_almacen)?.nombre || '-';
            return [
                mat.codigo_material,
                mat.nombre,
                mat.descripcion || '-',
                area,
                cat,
                mat.unidad_medida,
                s.stock_actual,
                alm,
                mat.stock_minimo,
                s.stock_actual <= mat.stock_minimo ? 'CRÍTICO' : 'ÓPTIMO',
                mat.fecha_registro ? (mat.fecha_registro.includes(',') ? mat.fecha_registro.split(',')[0] : mat.fecha_registro) : '-'
            ];
        });
    }).flat();

    autoTable(doc, {
        head: [['Código', 'Material', 'Descripción', 'Área', 'Categoría', 'U.M.', 'Stock', 'Almacén', 'Mín.', 'Estado', 'Fecha']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 7 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 40 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 12 },
            6: { cellWidth: 12, halign: 'center' },
            7: { cellWidth: 20 },
            8: { cellWidth: 12, halign: 'center' },
            9: { cellWidth: 15, halign: 'center' },
            10: { cellWidth: 15, halign: 'center' }
        }
    });

    doc.save(`Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    doc.save(`Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateOrdenesPDF = (ordenes: any[]) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    addHeader(doc, 'Reporte de Órdenes de Compra y Servicio');

    const tableData = ordenes.map(o => {
        const detallesFormatted = o.detalles && o.detalles.length > 0
            ? o.detalles.map((d: any) => `• [${d.cantidad} ${d.unidad_medida || 'UND'}] ${d.descripcion}`).join('\n')
            : 'Sin detalles especificados';

        return [
            o.numero_orden,
            // Parse YYYY-MM-DD directly to avoid timezone offset issues with new Date()
            o.fecha ? o.fecha.split('-').reverse().join('/') : '-',
            o.area?.nombre_area || (o.area ? 'Area no encontrada' : 'Sin Área'),
            o.tipo_orden.toUpperCase(),
            detallesFormatted,
            o.responsable,
            o.autorizado_por,
            o.estado.toUpperCase()
        ];
    });

    autoTable(doc, {
        head: [['N° Orden', 'Fecha', 'Área', 'Tipo', 'Detalle de Items / Servicios', 'Responsable', 'Autorizado', 'Estado']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [44, 62, 80] },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 18 },
            2: { cellWidth: 25 },
            3: { cellWidth: 18 },
            4: { cellWidth: 75 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 20, halign: 'center' }
        }
    });

    doc.save(`Reporte_Ordenes_${new Date().toISOString().split('T')[0]}.pdf`);
};
