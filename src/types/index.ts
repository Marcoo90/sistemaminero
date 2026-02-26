export type Role = 'admin' | 'gerente' | 'logistica' | 'almacenero' | 'conductor' | 'asistente_administrativo' | 'user';

export interface Usuario {
    id_usuario: number;
    usuario: string;
    clave: string;
    rol: string;
    nombre: string;
    id_personal?: number;
    personal?: Personal;
}

export interface User {
    id: number;
    username: string;
    role: string;
    name: string;
    id_personal?: number;
}

export interface Area {
    id_area: number;
    nombre_area: string;
    descripcion: string;
}

export interface Personal {
    id_personal: number;
    dni: string;
    nombres: string;
    cargo: string;
    id_area: number;
    regimen: string;
    fecha_ingreso: string;
    estado: 'activo' | 'inactivo' | 'vacaciones';
    telefono: string;
    observaciones: string;
    fecha_registro?: string;
}

export interface Asistencia {
    id_asistencia: number;
    id_personal: number;
    fecha: string;
    turno_dia: boolean;
    turno_noche: boolean;
    estado: 'presente' | 'falta' | 'tardanza' | 'justificada' | 'permiso' | 'descanso';
    observaciones?: string;
}

export interface Equipo {
    id_equipo: number;
    codigo_equipo: string;
    tipo_equipo: string;
    categoria: string;
    descripcion: string;
    marca: string;
    modelo: string;
    serie: string;
    capacidad: string;
    energia: string;
    estado: 'operativo' | 'mantenimiento' | 'inoperativo';
    id_area: number;
    responsable: string;
    fecha_adquisicion: string;
    horometro: number; // decimal
    horometro_mantenimiento: number; // Next maintenance target (Days)
    observaciones: string;
    fecha_registro?: string;
}

export interface MantenimientoEquipo {
    id_mant_equipo: number;
    id_equipo: number;
    fecha: string;
    tipo_mantenimiento: 'preventivo' | 'correctivo';
    horometro: number;
    proveedor: string;
    costo: number;
    observaciones: string;
}

export interface Vehiculo {
    id_vehiculo: number;
    codigo_vehiculo: string;
    tipo: string;
    marca: string;
    modelo: string;
    anio: number;
    placa: string;
    vin: string;
    combustible: 'diesel' | 'gasolina';
    capacidad: string;
    estado: 'operativo' | 'taller' | 'baja';
    id_area: number;
    responsable: string;
    km_horometro: number;
    km_mantenimiento: number; // Next maintenance KM
    soat: string;
    seguro: string;
    revision_tecnica: string;
    observaciones: string;
    fecha_registro?: string;
}

export interface MantenimientoVehiculo {
    id_mant_vehiculo: number;
    id_vehiculo: number;
    fecha: string;
    tipo_mantenimiento: 'preventivo' | 'correctivo';
    km_horometro: number;
    proveedor: string;
    costo: number;
    observaciones: string;
}

export interface Combustible {
    id_combustible: number;
    id_vehiculo: number;
    fecha: string;
    km_anterior: number;
    km_horometro: number;
    litros: number;
    precio_litro: number;
    costo_total: number;
    vale: string;
    conductor: string;
    proveedor: string;
    observaciones: string;
}

export interface Vale {
    id_vale: number;
    numero_vale: string;
    fecha: string;
    solicitante: string;
    id_area: number;
    concepto: string;
    monto: number;
    autorizado_por: string;
    estado: 'aprobado' | 'pendiente' | 'rechazado';
    observaciones?: string;
}

export interface Orden {
    id_orden: number;
    numero_orden: string;
    fecha: string;
    tipo_orden: 'compra' | 'servicio';
    id_area: number;
    descripcion: string;
    cantidad: number;
    responsable: string;
    autorizado_por: string;
    estado: 'aprobada' | 'pendiente' | 'rechazada';
    observaciones?: string;
    area?: Area;
    detalles?: DetalleOrden[];
}

export interface DetalleOrden {
    id_detalle: number;
    id_orden: number;
    descripcion: string;
    cantidad: number;
    unidad_medida?: string;
}

export interface Proveedor {
    id_proveedor: number;
    nombre: string;
    ruc: string;
    tipo: string;
    telefono: string;
    observaciones: string;
}

// --- ALMACÉN / WAREHOUSE ---

export interface Almacen {
    id_almacen: number;
    nombre: string;
    ubicacion: string;
    responsable: string;
    observaciones: string;
    fecha_registro?: string;
}

export interface CategoriaMaterial {
    id_categoria: number;
    nombre: string;
    descripcion: string;
}

export interface Material {
    id_material: number;
    codigo_material: string;
    nombre: string;
    id_categoria: number;
    unidad_medida: string;
    stock_minimo: number;
    descripcion: string;
    precio: number;
    id_area?: number;
    area?: Area;
    estado: 'activo' | 'inactivo';
    fecha_registro?: string;
}

export interface IngresoMaterial {
    id_ingreso: number;
    fecha: string;
    tipo_ingreso: string;
    documento: string;
    id_proveedor: number;
    id_almacen: number;
    recibido_por: string;
    observaciones: string;
}

export interface DetalleIngresoMaterial {
    id_det_ingreso: number;
    id_ingreso: number;
    id_material: number;
    cantidad: number;
    costo_unitario: number;
    costo_total: number;
}

export interface SalidaMaterial {
    id_salida: number;
    fecha: string;
    tipo_salida: string;
    id_area: number;
    solicitado_por: string;
    autorizado_por: string;
    id_almacen: number;
    observaciones: string;
}

export interface DetalleSalidaMaterial {
    id_det_salida: number;
    id_salida: number;
    id_material: number;
    cantidad: number;
}

export interface StockMaterial {
    id_material: number;
    id_almacen: number;
    stock_actual: number;
}

// --- PERSONAL (CONTRACTS & PPE) ---

export interface Contrato {
    id_contrato: number;
    id_personal: number;
    fecha_inicio: string;
    fecha_fin: string;
    tipo_contrato: 'indeterminado' | 'plazo_fijo' | 'locacion' | 'planilla';
    sueldo_base: number;
    estado: 'vigente' | 'vencido' | 'renovado';
    documento_adjunto?: string;
    observaciones?: string;
}

export interface EntregaEPP {
    id_entrega_epp: number;
    id_personal: number;
    fecha: string;
    id_almacen: number;
    responsable_entrega: string; // User or Personnel id
    firmado: boolean;
    observaciones?: string;
}

export interface DetalleEntregaEPP {
    id_det_entrega: number;
    id_entrega_epp: number;
    id_material: number;
    cantidad: number;
    talla?: string;
}

export interface Viaje {
    id_viaje: number;
    id_vehiculo: number;
    vehiculo?: Vehiculo;
    id_conductor: number;
    conductor?: Personal;
    fecha_salida: string;
    fecha_retorno?: string | null;
    origen: string;
    destino: string;
    km_inicial: number;
    km_final?: number | null;
    estado: 'en_ruta' | 'finalizado';
    gastos?: GastoViaje[];
}

export interface GastoViaje {
    id_gasto: number;
    id_viaje: number;
    tipo: string;
    monto: number;
    fecha: string;
    foto_url?: string;
    observaciones?: string;
}
