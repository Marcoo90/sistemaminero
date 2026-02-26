"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Truck, Plus, MapPin, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { DataTable, Column } from '@/components/layout/DataTable';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';

interface Viaje {
  id: number;
  numero: string;
  origen: string;
  destino: string;
  estado: 'en_transito' | 'entregado' | 'pendiente' | 'cancelado';
  fecha_salida: string;
  fecha_entrega?: string;
  conductor: string;
  vehiculo: string;
  carga: number;
  distancia: number;
  costo: number;
}

export default function LogisticaModerno() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [stats, setStats] = useState({
    enTransito: 0,
    entregados: 0,
    pendientes: 0,
    flota: 0,
    kmRecorridos: 0,
    costosHoy: 0
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pathname = usePathname();
  const router = useRouter();
  const { canEdit, hasAccess } = useAuth();

  useEffect(() => {
    if (!hasAccess(pathname)) {
      router.push('/');
    }
  }, [pathname, hasAccess, router]);

  const isReadOnly = !canEdit(pathname);

  // Mock data - reemplazar con llamada a API real
  useEffect(() => {
    const mockData: Viaje[] = [
      {
        id: 1,
        numero: 'V-001',
        origen: 'Almacén Central',
        destino: 'Mina A',
        estado: 'en_transito',
        fecha_salida: '2026-01-21 08:30',
        conductor: 'Juan García',
        vehiculo: 'Truck-001',
        carga: 8500,
        distancia: 145,
        costo: 850
      },
      {
        id: 2,
        numero: 'V-002',
        origen: 'Mina A',
        destino: 'Almacén Central',
        estado: 'entregado',
        fecha_salida: '2026-01-20 06:00',
        fecha_entrega: '2026-01-20 14:30',
        conductor: 'Carlos López',
        vehiculo: 'Truck-002',
        carga: 9200,
        distancia: 145,
        costo: 920
      }
    ];

    setViajes(mockData);
    setStats({
      enTransito: 3,
      entregados: 12,
      pendientes: 5,
      flota: 8,
      kmRecorridos: 1240,
      costosHoy: 5600
    });
    setLoading(false);
  }, []);

  const columns: Column<Viaje>[] = [
    {
      key: 'numero',
      label: 'Identificador',
      width: '12%',
      sortable: true,
      render: (value) => <span className="font-black text-slate-900 tracking-tighter">{value}</span>
    },
    {
      key: 'origen',
      label: 'Origen / Punto A',
      width: '18%',
      sortable: true,
      render: (value) => <span className="font-bold text-slate-600">{value}</span>
    },
    {
      key: 'destino',
      label: 'Destino / Punto B',
      width: '18%',
      sortable: true,
      render: (value) => <span className="font-bold text-slate-900">{value}</span>
    },
    {
      key: 'conductor',
      label: 'Operador Asignado',
      width: '15%',
      render: (value) => <span className="text-xs font-bold text-slate-500">{value}</span>
    },
    {
      key: 'estado',
      label: 'Situación',
      width: '12%',
      render: (value) => {
        const labels = {
          en_transito: 'En Tránsito',
          entregado: 'Entregado',
          pendiente: 'Pendiente',
          cancelado: 'Cancelado'
        };
        const variants = {
          en_transito: 'info',
          entregado: 'success',
          pendiente: 'warning',
          cancelado: 'danger'
        };
        return (
          <Badge variant={variants[value as keyof typeof variants] as any}>
            {labels[value as keyof typeof labels] || value}
          </Badge>
        );
      }
    },
    {
      key: 'distancia',
      label: 'Métricas',
      width: '15%',
      align: 'right',
      render: (value, row) => (
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-slate-900">{value} KM</span>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{row.carga} KG</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* SaaS Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 text-[10px] font-black text-blue-700 uppercase tracking-widest border border-blue-100 mb-2">
            <Truck size={12} strokeWidth={3} />
            Cadena de Suministro
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Panel de <span className="text-blue-600 font-medium">Logística</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold max-w-xl">
            Control centralizado de flota, despachos y métricas de distribución en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="font-black uppercase tracking-widest text-[10px] px-6 text-slate-400 hover:text-slate-900">
            Filtros Avanzados
          </Button>
          {!isReadOnly && (
            <Link href="/viajes">
              <Button icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/10 px-6">
                Programar Viaje
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Primary Logistics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Viajes en Curso"
          value={stats.enTransito}
          icon={Truck}
          color="primary"
          trend={1}
          trendLabel="activo"
        />
        <StatCard
          label="Entregas Exitosas"
          value={stats.entregados}
          icon={MapPin}
          color="success"
        />
        <StatCard
          label="Distancia Total"
          value={stats.kmRecorridos}
          unit="KM"
          icon={TrendingUp}
          color="info"
          trend={12}
          trendLabel="vs ayer"
        />
        <StatCard
          label="Costos Operativos"
          value={`S/ ${stats.costosHoy.toLocaleString()}`}
          icon={Plus}
          color="danger"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Operational Grid */}
        <div className="xl:col-span-8 space-y-8">
          <DataSection
            title="Actividad de Ruta"
            description={`${viajes.length} operaciones activas hoy`}
            icon={Truck}
          >
            <DataTable
              columns={columns}
              data={viajes.slice((page - 1) * 10, page * 10)}
              keyField="id"
              loading={loading}
              striped={true}
              readOnly={isReadOnly}
              actions={(row) => (
                <div className="flex gap-1 justify-end">
                  <Link href={`/logistica/viaje/${row.id}`} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <MapPin size={16} />
                  </Link>
                  {!isReadOnly && (
                    <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Clock size={16} />
                    </button>
                  )}
                </div>
              )}
              pagination={{
                page,
                pageSize: 10,
                total: viajes.length,
                onPageChange: setPage
              }}
              hover
            />
          </DataSection>
        </div>

        {/* Intelligence Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          <DataSection
            title="Centro de Alertas"
            description="Eventos que requieren acción"
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              {[
                { severity: 'warning', message: 'Viaje V-003 fuera de tiempo (+2h)', type: 'retraso' },
                { severity: 'info', message: 'Mantenimiento Truck-005 - 08:00 AM', type: 'taller' },
                { severity: 'danger', message: 'Alerta de Consumo: Truck-007', type: 'fuel' }
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex items-center gap-4 transition-all hover:translate-x-1 group ${alert.severity === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                    alert.severity === 'danger' ? 'bg-red-50/50 border-red-100' :
                      'bg-blue-50/50 border-blue-100'
                    }`}
                >
                  <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                    alert.severity === 'danger' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                    <AlertTriangle size={18} strokeWidth={3} />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${alert.severity === 'warning' ? 'text-amber-600' :
                      alert.severity === 'danger' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>{alert.type}</p>
                    <p className="text-xs font-bold text-slate-700">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </DataSection>

          <DataSection
            title="Eficiencia de Flota"
            description="Métricas de desempeño diarias"
            icon={TrendingUp}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Ocupación', value: '87%', color: 'bg-emerald-500' },
                { label: 'Puntualidad', value: '92%', color: 'bg-blue-500' },
                { label: 'Incidencias', value: '1 viaje', color: 'bg-amber-500' },
                { label: 'Combustible', value: '0.35 L/K', color: 'bg-slate-500' }
              ].map((item) => (
                <div key={item.label} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-lg font-black text-slate-900">{item.value}</p>
                  <div className="w-8 h-1 rounded-full mt-2 bg-slate-200 overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          </DataSection>
        </div>
      </div>
    </div>
  );
}
