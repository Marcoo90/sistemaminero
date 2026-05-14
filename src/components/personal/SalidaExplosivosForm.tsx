"use client";

import React, { useState, useEffect } from 'react';
import { Personal, Area, Almacen } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { getPersonalAll, getAreasAll } from '@/services/personalService';
import { getAlmacenesAll, getMaterialesAll } from '@/services/almacenService';
import { registrarSalidaExplosivos, DetalleInput } from '@/services/explosivosService';
import { Zap, User, ChevronDown, Plus, Minus, Save, X } from 'lucide-react';

interface SalidaExplosivosFormProps {
    onSave: () => void;
    onCancel: () => void;
}

// ── Config de insumos ──────────────────────────────────────────────────────────
const INSUMOS_CONFIG = {
    cartucho_gelatina: {
        label: 'Cartucho Gelatina 65%',
        variantes: null, // no tiene variante, cantidad directa
    },
    emulnor: {
        label: 'Emulnor',
        variantes: ['5000 1" 1x7', '3000 1" 1x7', '1000 1" 1x7'],
    },
    mecha_seguridad: {
        label: 'Mecha de Seguridad',
        variantes: ['4 pies', '5 pies', '6 pies'],
    },
} as const;

type TipoInsumo = keyof typeof INSUMOS_CONFIG;

interface InsumoRow {
    tipo_insumo: TipoInsumo;
    variante: string;
    cantidad: number;
    id_material: number | '';
    activo: boolean;
}

const defaultInsumos = (): InsumoRow[] => [
    { tipo_insumo: 'cartucho_gelatina', variante: '', cantidad: 0, id_material: '', activo: false },
    { tipo_insumo: 'emulnor', variante: '5000 1" 1x7', cantidad: 0, id_material: '', activo: false },
    { tipo_insumo: 'mecha_seguridad', variante: '4 pies', cantidad: 0, id_material: '', activo: false },
];

export default function SalidaExplosivosForm({ onSave, onCancel }: SalidaExplosivosFormProps) {
    const [personal, setPersonal] = useState<Personal[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [materiales, setMateriales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Header form
    const [form, setForm] = useState({
        id_personal: '' as number | '',
        turno: 'mañana',
        zona_area: '',
        tipo_labor: '',
        planilla_contrata: '',
        hora_disparo: '',
        nivel: '' as number | '',
        tipo_perforacion: '',
        num_disparos: '' as number | '',
        pies_taladros: '' as number | '',
        id_almacen: '' as number | '',
        observaciones: '',
    });

    // Personal derived data
    const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
    const [insumos, setInsumos] = useState<InsumoRow[]>(defaultInsumos());

    useEffect(() => {
        Promise.all([
            getPersonalAll(),
            getAlmacenesAll(),
            getMaterialesAll(),
        ]).then(([p, a, m]) => {
            setPersonal(p);
            setAlmacenes(a);
            setMateriales(m.filter((mat: any) =>
                mat.id_categoria === 5 || // Explosivos category
                mat.nombre?.toLowerCase().includes('gelatina') ||
                mat.nombre?.toLowerCase().includes('emulnor') ||
                mat.nombre?.toLowerCase().includes('mecha')
            ));
        });
    }, []);

    const updateField = (field: string, value: any) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handlePersonalChange = (idPersonal: number | '') => {
        updateField('id_personal', idPersonal);
        if (!idPersonal) { setSelectedPersonal(null); return; }
        const found = personal.find(p => p.id_personal === Number(idPersonal));
        setSelectedPersonal(found || null);
        if (found) updateField('zona_area', (found as any).area?.nombre_area || '');
    };

    const toggleInsumo = (index: number, active: boolean) => {
        setInsumos(prev => prev.map((row, i) =>
            i === index ? { ...row, activo: active, cantidad: active ? row.cantidad : 0 } : row
        ));
    };

    const updateInsumo = (index: number, field: keyof InsumoRow, value: any) => {
        setInsumos(prev => prev.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        ));
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.id_personal) e.id_personal = 'Seleccione un trabajador';
        if (!form.zona_area) e.zona_area = 'Zona/Área es requerida';
        if (!form.tipo_labor) e.tipo_labor = 'Tipo de labor es requerido';
        if (!form.id_almacen) e.id_almacen = 'Seleccione un almacén';

        const insumosActivos = insumos.filter(i => i.activo);
        if (insumosActivos.length === 0) e.insumos = 'Debe registrar al menos un insumo';
        insumosActivos.forEach((ins, idx) => {
            if (ins.cantidad <= 0) e[`insumo_${idx}`] = 'La cantidad debe ser mayor a 0';
        });

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const detalles: DetalleInput[] = insumos
                .filter(i => i.activo && i.cantidad > 0)
                .map(i => ({
                    tipo_insumo: i.tipo_insumo,
                    variante: i.variante || undefined,
                    cantidad: Number(i.cantidad),
                    id_material: i.id_material ? Number(i.id_material) : undefined,
                }));

            await registrarSalidaExplosivos({
                id_personal: Number(form.id_personal),
                turno: form.turno,
                zona_area: form.zona_area,
                tipo_labor: form.tipo_labor,
                planilla_contrata: form.planilla_contrata || undefined,
                hora_disparo: form.hora_disparo || undefined,
                nivel: form.nivel !== '' ? Number(form.nivel) : undefined,
                tipo_perforacion: form.tipo_perforacion || undefined,
                num_disparos: form.num_disparos !== '' ? Number(form.num_disparos) : undefined,
                pies_taladros: form.pies_taladros !== '' ? Number(form.pies_taladros) : undefined,
                id_almacen: Number(form.id_almacen),
                observaciones: form.observaciones || undefined,
                detalles,
            });
            onSave();
        } catch (err: any) {
            alert(err.message || 'Error al registrar salida de explosivos');
        } finally {
            setLoading(false);
        }
    };

    const personalOptions = [
        { value: '', label: '— Seleccionar Trabajador —' },
        ...personal.map(p => ({ value: p.id_personal, label: `${p.nombres}  ·  DNI: ${p.dni}` })),
    ];
    const almacenOptions = [
        { value: '', label: '— Seleccionar Almacén —' },
        ...almacenes.map(a => ({ value: a.id_almacen, label: a.nombre })),
    ];
    const materialesOptions = (tipoInsumo: string) => [
        { value: '', label: '— Sin vínculo de inventario —' },
        ...materiales.map(m => ({ value: m.id_material, label: `${m.codigo_material} · ${m.nombre}` })),
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Sección: Trabajador ────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-1.5 rounded-lg bg-blue-600/10">
                        <User size={14} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                        Trabajador
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Select
                            label="Trabajador Registrado"
                            options={personalOptions}
                            value={form.id_personal}
                            onChange={(e: any) => handlePersonalChange(e.target.value === '' ? '' : Number(e.target.value))}
                            error={errors.id_personal}
                        />
                    </div>
                    {selectedPersonal && (
                        <div className="md:col-span-2 grid grid-cols-2 gap-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Cargo</p>
                                <p className="text-sm font-bold text-foreground">{selectedPersonal.cargo}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Área/Labor</p>
                                <p className="text-sm font-bold text-foreground">
                                    {(selectedPersonal as any).area?.nombre_area || '—'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sección: Información de Operación ─────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <div className="p-1.5 rounded-lg bg-orange-500/10">
                        <Zap size={14} className="text-orange-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                        Operación
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Fecha"
                        type="date"
                        value={new Date().toISOString().split('T')[0]}
                        onChange={() => {}}
                        disabled
                    />
                    <Select
                        label="Turno"
                        options={[
                            { value: 'mañana', label: '☀ Mañana' },
                            { value: 'noche', label: '🌙 Noche' },
                        ]}
                        value={form.turno}
                        onChange={(e: any) => updateField('turno', e.target.value)}
                    />
                    <Input
                        label="Hora de Disparo"
                        type="time"
                        value={form.hora_disparo}
                        onChange={(e: any) => updateField('hora_disparo', e.target.value)}
                        placeholder="HH:MM"
                    />
                    <Input
                        label="Zona / Área"
                        value={form.zona_area}
                        onChange={(e: any) => updateField('zona_area', e.target.value)}
                        error={errors.zona_area}
                        placeholder="Ej: Rampa 2 – Nivel 450"
                    />
                    <Input
                        label="Tipo de Labor"
                        value={form.tipo_labor}
                        onChange={(e: any) => updateField('tipo_labor', e.target.value)}
                        error={errors.tipo_labor}
                        placeholder="Ej: Avance, Rotura, Limpieza"
                    />
                    <Input
                        label="Planilla / Contrata"
                        value={form.planilla_contrata}
                        onChange={(e: any) => updateField('planilla_contrata', e.target.value)}
                        placeholder="Opcional"
                    />
                </div>
            </div>

            {/* ── Sección: Datos Técnicos de Perforación ───────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Datos Técnicos de Perforación <span className="text-slate-300 font-normal">(Opcional)</span>
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                        label="Nivel (m)"
                        type="number"
                        step="0.1"
                        value={form.nivel}
                        onChange={(e: any) => updateField('nivel', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0"
                    />
                    <Input
                        label="Tipo de Perforación"
                        value={form.tipo_perforacion}
                        onChange={(e: any) => updateField('tipo_perforacion', e.target.value)}
                        placeholder="Ej: Taladro largo"
                    />
                    <Input
                        label="Nº Disparos"
                        type="number"
                        value={form.num_disparos}
                        onChange={(e: any) => updateField('num_disparos', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="0"
                    />
                    <Input
                        label="Pies / Taladro"
                        type="number"
                        step="0.1"
                        value={form.pies_taladros}
                        onChange={(e: any) => updateField('pies_taladros', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* ── Sección: Almacén e Insumos ────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                        Salida de Almacén
                    </span>
                </div>

                <Select
                    label="Almacén de Explosivos"
                    options={almacenOptions}
                    value={form.id_almacen}
                    onChange={(e: any) => updateField('id_almacen', e.target.value === '' ? '' : Number(e.target.value))}
                    error={errors.id_almacen}
                />

                {errors.insumos && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.insumos}</p>
                )}

                <div className="space-y-3">
                    {insumos.map((ins, idx) => {
                        const config = INSUMOS_CONFIG[ins.tipo_insumo];
                        return (
                            <div
                                key={ins.tipo_insumo}
                                className={`rounded-xl border transition-all ${ins.activo ? 'border-orange-200 bg-orange-50/30' : 'border-border bg-card'}`}
                            >
                                {/* Header toggle */}
                                <button
                                    type="button"
                                    onClick={() => toggleInsumo(idx, !ins.activo)}
                                    className="w-full flex items-center justify-between px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${ins.activo ? 'bg-orange-500 border-orange-500' : 'border-border'}`}>
                                            {ins.activo && <span className="text-white text-[10px] font-black">✓</span>}
                                        </div>
                                        <span className={`text-sm font-bold ${ins.activo ? 'text-orange-700' : 'text-slate-500'}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <ChevronDown
                                        size={16}
                                        className={`text-slate-400 transition-transform ${ins.activo ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Expanded content */}
                                {ins.activo && (
                                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-orange-100">
                                        {/* Variante */}
                                        {config.variantes && (
                                            <Select
                                                label="Variante"
                                                options={config.variantes.map(v => ({ value: v, label: v }))}
                                                value={ins.variante}
                                                onChange={(e: any) => updateInsumo(idx, 'variante', e.target.value)}
                                            />
                                        )}
                                        {/* Cantidad */}
                                        <Input
                                            label="Cantidad"
                                            type="number"
                                            step="1"
                                            value={ins.cantidad || ''}
                                            onChange={(e: any) => updateInsumo(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                                            error={errors[`insumo_${idx}`]}
                                            placeholder="0"
                                        />
                                        {/* Vínculo a material de inventario */}
                                        <Select
                                            label="Vínculo Inventario (Opcional)"
                                            options={materialesOptions(ins.tipo_insumo)}
                                            value={ins.id_material}
                                            onChange={(e: any) => updateInsumo(idx, 'id_material', e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Observaciones ─────────────────────────────────────────────── */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 pl-1">Observaciones</label>
                <textarea
                    className="w-full p-4 bg-secondary border border-border rounded-xl text-sm text-foreground focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400/50 min-h-[80px] transition-all resize-none"
                    value={form.observaciones}
                    onChange={(e) => updateField('observaciones', e.target.value)}
                    placeholder="Detalles adicionales de la operación..."
                />
            </div>

            {/* ── Almacén selector ──────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}
                    className="font-black uppercase tracking-widest text-[10px]">
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    icon={Save}
                    isLoading={loading}
                    className="font-black uppercase tracking-widest text-[10px] bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                >
                    Registrar Salida
                </Button>
            </div>
        </form>
    );
}
