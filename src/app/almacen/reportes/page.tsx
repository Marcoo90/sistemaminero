"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ArrowLeft, Download, TrendingUp, Package, AlertCircle, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { getMaterialesAll, getAllStock, getAlmacenesAll, getCategoriasAll } from '@/services/almacenService';
import { exportInventarioToExcel } from '@/utils/excelUtils';
import { generateInventarioPDF } from '@/utils/reportGenerators';
import { Material, StockMaterial, Almacen, CategoriaMaterial } from '@/types';
import Link from 'next/link';

export default function AlmacenReportesPage() {
    const [loading, setLoading] = useState(true);
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [stock, setStock] = useState<StockMaterial[]>([]);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);

    const [stats, setStats] = useState({
        totalEntradas: 120,
        totalSalidas: 85,
        valorInventario: 0,
        stockCritico: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, s, a, c] = await Promise.all([
                    getMaterialesAll(),
                    getAllStock(),
                    getAlmacenesAll(),
                    getCategoriasAll()
                ]);

                setMateriales(m);
                setStock(s);
                setAlmacenes(a);
                setCategorias(c);

                const valorTotal = m.reduce((sum, mat) => sum + (mat.precio || 0), 0);
                const criticos = m.filter(mat => {
                    const sTotal = s.filter(st => st.id_material === mat.id_material).reduce((acc, curr) => acc + curr.stock_actual, 0);
                    return sTotal <= mat.stock_minimo;
                }).length;

                setStats(prev => ({
                    ...prev,
                    valorInventario: valorTotal,
                    stockCritico: criticos
                }));
            } catch (err) {
                console.error('Error fetching report data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const consumptionByArea = [
        { area: 'Mantenimiento', valor: 45, monto: 'S/. 20,340', color: '#3b82f6' },
        { area: 'Operaciones', valor: 30, monto: 'S/. 13,560', color: '#10b981' },
        { area: 'Exploración', valor: 15, monto: 'S/. 6,780', color: '#f59e0b' },
        { area: 'Administración', valor: 10, monto: 'S/. 4,520', color: '#ef4444' },
    ];

    const monthlyTrend = [
        { mes: 'Ago', ingresos: 45, salidas: 30 },
        { mes: 'Sep', ingresos: 52, salidas: 40 },
        { mes: 'Oct', ingresos: 48, salidas: 45 },
        { mes: 'Nov', ingresos: 60, salidas: 35 },
        { mes: 'Dic', ingresos: 55, salidas: 50 },
        { mes: 'Ene', ingresos: 70, salidas: 45 },
    ];

    const valuationData = React.useMemo(() => {
        const groups: Record<string, { area: string, categoria: string, items: number, stock: number, valor: number }> = {};

        materiales.forEach(m => {
            const areaName = m.area?.nombre_area || 'Sin Área';
            const catName = categorias.find(c => c.id_categoria === m.id_categoria)?.nombre || 'General';
            const key = `${areaName}-${catName}`;

            const sTotal = stock
                .filter(s => s.id_material === m.id_material)
                .reduce((acc, curr) => acc + curr.stock_actual, 0);

            if (!groups[key]) {
                groups[key] = {
                    area: areaName,
                    categoria: catName,
                    items: 0,
                    stock: 0,
                    valor: 0
                };
            }

            groups[key].items += 1;
            groups[key].stock += sTotal;
            groups[key].valor += (m.precio || 0);
        });

        return Object.values(groups).sort((a, b) => a.area.localeCompare(b.area));
    }, [materiales, stock, categorias]);

    return (
        <div className="container mx-auto py-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/almacen">
                        <Button variant="ghost" size="sm"><ArrowLeft size={18} /></Button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reportes Estratégicos de Almacén</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Inteligencia de inventario y optimización de costos</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        icon={Download}
                        variant="outline"
                        onClick={() => exportInventarioToExcel(materiales, stock, categorias, almacenes)}
                    >
                        Excel
                    </Button>
                    <Button
                        icon={FileText}
                        onClick={() => generateInventarioPDF(materiales, stock, categorias, almacenes)}
                    >
                        PDF Gerencial
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ingresos del Mes</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalEntradas}</span>
                        <TrendingUp size={16} color="#10b981" />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>+12% vs mes anterior</span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Salidas del Mes</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalSalidas}</span>
                        <TrendingUp size={16} color="#10b981" />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>+5% vs mes anterior</span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valorización de Inventario</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>S/. {stats.valorInventario.toLocaleString()}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Actualizado hace 5 min</span>
                </Card>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #ef4444' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Alertas Críticas</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} color="#ef4444" />
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.stockCritico}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Requieren reabastecimiento urgente</span>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                {/* Monthly Trend Chart */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BarChart3 size={18} /> Tendencia Mensual de Movimientos
                        </h3>
                    </div>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {monthlyTrend.map(t => (
                            <div key={t.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                                    <div style={{ width: '12px', height: `${t.ingresos}%`, backgroundColor: '#3b82f6', borderRadius: '4px 4px 0 0' }} title={`Ingresos: ${t.ingresos}`} />
                                    <div style={{ width: '12px', height: `${t.salidas}%`, backgroundColor: '#ef4444', borderRadius: '4px 4px 0 0' }} title={`Salidas: ${t.salidas}`} />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.mes}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '2px' }} /> Ingresos
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '2px' }} /> Salidas
                        </div>
                    </div>
                </Card>

                {/* Consumption By Area */}
                <Card>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PieChart size={18} /> Distribución por Área
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {consumptionByArea.map(item => (
                            <div key={item.area} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span style={{ fontWeight: 500 }}>{item.area}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 600 }}>{item.valor}%</span>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.monto}</p>
                                    </div>
                                </div>
                                <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${item.valor}%`,
                                        backgroundColor: item.color,
                                        borderRadius: '3px'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Valuation by Category Table */}
            <Card>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Valorización y Stock por Área y Categoría</h3>
                <Table
                    data={valuationData}
                    columns={[
                        { header: 'Área', accessor: 'area' },
                        { header: 'Categoría', accessor: 'categoria' },
                        { header: 'Variedad de Items', accessor: 'items' },
                        { header: 'Stock Total', accessor: 'stock' },
                        {
                            header: 'Valorización',
                            accessor: (row) => `S/. ${row.valor.toLocaleString()}`
                        },
                        {
                            header: 'Estado Salud',
                            accessor: (row) => {
                                const isLow = row.stock <= (row.items * 2); // Heuristic
                                return (
                                    <span style={{
                                        color: isLow ? '#ef4444' : '#10b981',
                                        fontWeight: 700,
                                        fontSize: '0.75rem'
                                    }}>
                                        {isLow ? 'BAJO' : 'ÓPTIMO'}
                                    </span>
                                )
                            }
                        },
                    ]}
                />
            </Card>

            {/* Top Consumed Materials Detail */}
            <Card>
                <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Materiales de Mayor Rotación (Top 5)</h3>
                <Table
                    data={[
                        { material: 'Guantes de Nitrilo', codigo: 'EPP-001', area: 'Operaciones', consumo: 450, um: 'PAR', costo: 1350.00 },
                        { material: 'Filtro Aceite CAT', codigo: 'REP-102', area: 'Mantenimiento', consumo: 12, um: 'UND', costo: 2400.00 },
                        { material: 'Grasa Litio', codigo: 'CON-005', area: 'Mantenimiento', consumo: 10, um: 'BAL', costo: 1500.00 },
                        { material: 'Botas de Seguridad', codigo: 'EPP-005', area: 'Operaciones', consumo: 25, um: 'PAR', costo: 3125.00 },
                        { material: 'Lentes de Protección', codigo: 'EPP-012', area: 'Operaciones', consumo: 60, um: 'UND', costo: 600.00 },
                    ]}
                    keyField="codigo"
                    columns={[
                        { header: 'Código', accessor: 'codigo' },
                        { header: 'Descripción', accessor: 'material' },
                        { header: 'Área', accessor: 'area' },
                        { header: 'Consumo (Mes)', accessor: (row) => `${row.consumo} ${row.um}` },
                        { header: 'Inversión Total', accessor: (row) => `S/. ${row.costo.toLocaleString()}` },
                        {
                            header: 'Impacto en Costo',
                            accessor: (row) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px' }}>
                                        <div style={{ width: `${(row.costo / 10000) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem' }}>{((row.costo / stats.valorInventario) * 100).toFixed(1)}%</span>
                                </div>
                            )
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
