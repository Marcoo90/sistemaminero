import * as XLSX from 'xlsx';
import { Personal, Asistencia } from '../types';

export const exportAsistenciaToExcel = (
    month: number,
    year: number,
    personal: Personal[],
    asistencias: Asistencia[]
) => {
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Header
    const headers = [
        'Colaborador',
        'Cargo',
        ...daysArray.map(d => d.toString()),
        'T', 'F', 'Tar', 'J'
    ];

    // Data Rows
    const rows = personal.map(person => {
        const personAsis = asistencias.filter(a => a.id_personal === person.id_personal);

        const summary = {
            trabajos: personAsis.filter(a => {
                if (a.estado === 'falta') return false;
                return a.turno_dia || a.turno_noche || a.estado === 'presente' || a.estado === 'tardanza';
            }).length,
            faltas: personAsis.filter(a => a.estado === 'falta').length,
            tardanzas: personAsis.filter(a => a.estado === 'tardanza').length,
            justificadas: personAsis.filter(a => a.estado === 'justificada').length,
        };

        const dayStatus = daysArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const asis = personAsis.find(a => a.fecha === dateStr);
            if (!asis) return '';

            let status = '';
            if (asis.estado === 'presente') status = 'P';
            else if (asis.estado === 'falta') status = 'F';
            else if (asis.estado === 'tardanza') status = 'T';
            else if (asis.estado === 'justificada') status = 'J';
            else if (asis.estado === 'permiso') status = 'PE';
            else if (asis.estado === 'descanso') status = 'DE';

            const shifts = [];
            if (asis.turno_dia) shifts.push('D');
            if (asis.turno_noche) shifts.push('N');

            if (shifts.length > 0) {
                return `${status}${status ? '/' : ''}${shifts.join('+')}`;
            }
            return status;
        });

        return [
            person.nombres,
            person.cargo,
            ...dayStatus,
            summary.trabajos,
            summary.faltas,
            summary.tardanzas,
            summary.justificadas
        ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Asistencia ${meses[month]}`);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Reporte_Asistencia_${meses[month]}_${year}.xlsx`);
};

export const exportInventarioToExcel = (
    materiales: any[],
    stock: any[],
    categorias: any[],
    almacenes: any[]
) => {
    const headers = ['Código', 'Nombre', 'Descripción', 'Área', 'Categoría', 'U.M.', 'Stock Actual', 'Almacén', 'Stock Mínimo', 'Estado', 'Fecha Registro'];

    const rows = materiales.map(mat => {
        const matStock = stock.filter(s => s.id_material === mat.id_material);
        const cat = categorias.find(c => c.id_categoria === mat.id_categoria)?.nombre || 'Sin categoría';
        const area = mat.area?.nombre_area || 'Sin Área';

        return matStock.map(s => {
            const alm = almacenes.find(a => a.id_almacen === s.id_almacen)?.nombre || 'Desconocido';
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
                mat.estado.toUpperCase(),
                mat.fecha_registro ? (mat.fecha_registro.includes(',') ? mat.fecha_registro.split(',')[0] : mat.fecha_registro) : '-'
            ];
        });
    }).flat();

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportCombustibleToExcel = (
    datos: any[],
    vehiculos: any[]
) => {
    const headers = ['Fecha', 'Vehículo', 'Placa', 'Km/Horom.', 'Litros', 'Precio/L', 'Costo Total', 'Vale', 'Conductor', 'Proveedor'];

    const rows = datos.map(c => {
        const v = vehiculos.find(veh => veh.id_vehiculo === c.id_vehiculo);
        return [
            c.fecha,
            v ? `${v.marca} ${v.modelo}` : 'Desconocido',
            v?.placa || '-',
            c.km_horometro,
            c.litros,
            c.precio_litro,
            c.costo_total,
            c.vale,
            c.conductor,
            c.proveedor
        ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consumo Combustible');
    XLSX.writeFile(workbook, `Reporte_Combustible_${new Date().toISOString().split('T')[0]}.xlsx`);
};
