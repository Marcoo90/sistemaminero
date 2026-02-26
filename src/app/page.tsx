"use client";

import React, { useState, useEffect } from 'react';
import { Users, Truck, Fuel, HardHat, TrendingUp, Activity, FileText } from 'lucide-react';
import { getPersonalAll } from '@/services/personalService';
import { getEquiposAll } from '@/services/equipoService';
import { getVehiculosAll, getFuelLogs } from '@/services/vehiculoService';
import { queryCache, createCacheKey } from '@/utils/queryCache';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, hasAccess } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'conductor') {
      router.push('/viajes');
    }
  }, [user, router]);

  useEffect(() => {
    async function loadStats() {
      try {
        const cacheKey = createCacheKey('dashboard', 'stats');

        const data = await queryCache.get(
          cacheKey,
          async () => {
            const [p, e, v, f] = await Promise.all([
              getPersonalAll(),
              getEquiposAll(),
              getVehiculosAll(),
              getFuelLogs()
            ]);
            return { p, e, v, f };
          },
          2 * 60 * 1000
        );

        const { p, e, v, f } = data;
        const totalFuel = f.reduce((acc: number, curr: any) => acc + curr.litros, 0);
        const activePersonal = p.filter((x: any) => x.estado === 'activo').length;
        const operativeVehicles = v.filter((x: any) => x.estado === 'operativo').length;
        const operativePercentage = v.length > 0 ? Math.round((operativeVehicles / v.length) * 100) : 0;

        setStats([
          {
            label: 'Personal Activo',
            value: activePersonal,
            icon: Users,
            color: 'primary' as const,
            trend: 2,
            unit: 'personas'
          },
          {
            label: 'Maquinaria Pesada',
            value: e.length,
            icon: HardHat,
            color: 'success' as const,
            trend: 0,
            unit: 'equipos'
          },
          {
            label: 'Flota Operativa',
            value: operativePercentage,
            icon: Truck,
            color: 'warning' as const,
            trend: -1,
            unit: '%'
          },
          {
            label: 'Consumo Diesel',
            value: totalFuel,
            icon: Fuel,
            color: 'info' as const,
            trend: -5,
            unit: 'litros'
          },
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-center h-96 bg-card rounded-3xl border border-border">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-border border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">Sincronizando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* SaaS Dashboard Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-600/10 text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 mb-2">
            <Activity size={12} strokeWidth={3} />
            Sistema en Línea
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tighter">
            Vista <span className="text-blue-500 font-medium">Ejecutiva</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold max-w-xl">
            Monitoreo integral de flota, personal y niveles operativos en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={FileText} className="font-black uppercase tracking-widest text-[10px] px-4">Exportar PDF</Button>
          <Button variant="primary" size="sm" icon={TrendingUp} className="font-black uppercase tracking-widest text-[10px] px-4 shadow-lg shadow-blue-500/10">Refrescar Datos</Button>
        </div>
      </div>

      {/* Analytical KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            unit={stat.unit}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Operational Feed */}
        <div className="xl:col-span-8 space-y-8">
          <DataSection
            title="Distribución de Turnos"
            description="Estado actual de la fuerza laboral por zona"
            icon={Users}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Zona Norte', value: '45', color: 'bg-blue-600' },
                { label: 'Zona Centro', value: '38', color: 'bg-emerald-500' },
                { label: 'Zona Sur', value: '12', color: 'bg-amber-500' }
              ].map((item) => (
                <div key={item.label} className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:border-blue-500/50 transition-all group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{item.label}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-black text-foreground">{item.value}%</span>
                    <div className={`w-12 h-1.5 rounded-full ${item.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </div>
              ))}
            </div>
          </DataSection>

          <DataSection
            title="Suministros Críticos"
            description="Consumo acumulado 24h"
            icon={Fuel}
          >
            <Card variant="default" className="p-0 overflow-hidden border-border max-w-full">
              <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">Flujo de Combustible</h4>
                <span className="text-[10px] font-bold text-slate-500">ACTUALIZADO HACE 2M</span>
              </div>
              <div className="p-12 flex items-center justify-center bg-background/50">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-border border-t-blue-500 animate-spin" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculando métricas de eficiencia...</p>
                </div>
              </div>
            </Card>
          </DataSection>
        </div>

        {/* Sidebar Intelligence */}
        <div className="xl:col-span-4 space-y-8">
          <DataSection
            title="Atajos de Gestión"
            description="Links de acceso rápido"
            icon={Activity}
          >
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Registrar Nuevo Viaje', icon: Truck, path: '/viajes' },
                { label: 'Inventario Almacén', icon: Fuel, path: '/almacen' },
                { label: 'Lista de Personal', icon: Users, path: '/personal' },
                { label: 'Control de Equipos', icon: HardHat, path: '/equipos' }
              ].filter(action => {
                // If it's the personal list, we need to check if warehouseman can see it (they can view/epp)
                // but hasAccess handles the top-level path
                return hasAccess(action.path);
              }).map((action) => (
                <Link
                  key={action.label}
                  href={action.path}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-blue-500/50 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-2.5 rounded-lg bg-secondary text-slate-500 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
                    <action.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </DataSection>

          <DataSection
            title="Actividad del Sistema"
            description="Eventos recientes"
            icon={Activity}
          >
            <div className="relative pl-6 border-l-2 border-border/50 space-y-8">
              {[
                { time: '09:42', text: 'Carga de Diesel Pesada - Equipo #42', type: 'fuel' },
                { time: '08:15', text: 'Ingreso Personal - Turno Mañana', type: 'access' },
                { time: '07:30', text: 'Reporte Diario Generado', type: 'system' }
              ].map((event, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[33px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-card shadow-sm" />
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{event.time}</p>
                  <p className="text-xs font-bold text-foreground/80">{event.text}</p>
                </div>
              ))}
            </div>
          </DataSection>
        </div>
      </div>
    </div>
  );
}
