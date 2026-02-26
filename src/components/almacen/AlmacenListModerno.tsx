"use client";

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, TrendingUp } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import StatsGrid from '@/components/layout/StatsGrid';
import { DataTable, Column } from '@/components/layout/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getMaterialesAll, getCategoriasAll, getAllStock, deleteMaterial } from '@/services/almacenService';
import { getAreasAll } from '@/services/personalService';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Area } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface Material {
  id_material?: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  stock_actual?: number;
  stock_minimo?: number;
  precio_unitario?: number;
  precio?: number;
  unidad_medida?: string;
  estado?: 'activo' | 'inactivo';
  area?: any;
  fecha_registro?: string;
}

export default function AlmacenModerno() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stats, setStats] = useState({
    totalMateriales: 0,
    categorias: 0,
    stockBajo: 0,
    valorInventario: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pathname = usePathname();
  const router = useRouter();
  const { canEdit, hasAccess } = useAuth();

  useEffect(() => {
    if (!hasAccess(pathname)) {
      router.push('/');
    }
  }, [pathname, hasAccess, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materiales, categorias, stock, areasData] = await Promise.all([
        getMaterialesAll(),
        getCategoriasAll(),
        getAllStock(),
        getAreasAll()
      ]);
      setAreas(areasData || []);

      const materialsWithStock = materiales.map((m: any) => ({
        ...m,
        stock_actual: stock.find((s: any) => s.id_material === m.id_material)?.stock_actual || 0
      }));

      setMaterials(materialsWithStock);

      const bajoStock = materialsWithStock.filter((m: any) => m.stock_actual <= (m.stock_minimo || 0));
      const valorTotal = materiales.reduce((sum: number, m: any) =>
        sum + (m.precio || 0), 0
      );

      setStats({
        totalMateriales: materiales.length,
        categorias: categorias.length,
        stockBajo: bajoStock.length,
        valorInventario: valorTotal
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este material?')) {
      try {
        await deleteMaterial(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('No se pudo eliminar el material. Es posible que tenga movimientos asociados.');
      }
    }
  };

  const filteredData = materials.filter(m => {
    const matchesSearch = m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m as any).categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m as any).codigo_material?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === 'all' ||
      (m as any).id_area?.toString() === areaFilter ||
      (m as any).area?.id_area.toString() === areaFilter;

    return matchesSearch && matchesArea;
  });

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<Material>[] = [
    {
      key: 'nombre',
      label: 'Material',
      width: '25%',
      sortable: true,
      render: (value) => <span className="font-bold text-foreground">{value}</span>
    },
    {
      key: 'categoria',
      label: 'Categoría',
      width: '15%',
      sortable: true,
      render: (_, row) => <span className="text-slate-500 font-medium">{(row as any).categoria?.nombre || 'General'}</span>
    },
    {
      key: 'area',
      label: 'Área',
      width: '15%',
      sortable: true,
      render: (_, row) => <span className="text-slate-500 font-medium">{(row as any).area?.nombre_area || '-'}</span>
    },
    {
      key: 'stock_actual',
      label: 'Stock Actual',
      width: '12%',
      render: (value, row) => {
        const isLow = (value || 0) <= (row.stock_minimo || 0);
        return (
          <Badge variant={isLow ? 'danger' : 'success'}>
            {value} {row.unidad_medida || 'un'}
          </Badge>
        );
      }
    },
    {
      key: 'stock_minimo',
      label: 'Stock Mínimo',
      width: '12%',
      render: (value) => <span className="text-slate-500 font-bold">{value}</span>
    },
    {
      key: 'precio',
      label: 'Precio Total',
      width: '12%',
      render: (value) => <span className="font-black text-foreground">S/. {parseFloat(value as any || 0).toFixed(2)}</span>
    },
    {
      key: 'estado',
      label: 'Estado',
      width: '10%',
      render: (value) => (
        <Badge variant={value === 'activo' ? 'success' : 'secondary'}>
          {value === 'activo' ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'fecha_registro',
      label: 'Registro',
      width: '15%',
      render: (value) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500">{(value as string)?.split(',')[0]}</span>
          <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{(value as string)?.split(',')[1]}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <PageHeader
        title="Gestión de Almacén"
        description="Administra materiales, inventario y controla los niveles de stock"
        icon={Package}
        action={
          canEdit(pathname) && (
            <Link href="/almacen/crear">
              <Button onClick={() => { }} icon={Plus} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                Registrar Material
              </Button>
            </Link>
          )
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Almacén' }
        ]}
      />

      <div className="space-y-10">
        <StatsGrid
          stats={[
            {
              label: 'Materiales Totales',
              value: stats.totalMateriales,
              icon: Package,
              color: 'primary'
            },
            {
              label: 'Categorías',
              value: stats.categorias,
              icon: undefined,
              color: 'info'
            },
            {
              label: 'Stock Bajo',
              value: stats.stockBajo,
              icon: undefined,
              color: 'warning'
            },
            {
              label: 'Valor Inventario',
              value: `S/. ${stats.valorInventario.toFixed(2)}`,
              unit: 'PEN',
              icon: TrendingUp,
              color: 'success'
            }
          ]}
        />

        <DataSection
          title="Inventario General"
          description={`${filteredData.length} materiales listados en la base de datos`}
          icon={Package}
          actions={
            <div className="flex gap-4 items-center">
              <div className="relative w-64">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={3} />
                <Input
                  placeholder="Buscar en el almacén..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-11 border-transparent bg-secondary focus:bg-card focus:border-blue-500/20 text-foreground"
                />
              </div>
              <div className="w-48">
                <Select
                  options={[
                    { value: 'all', label: 'Todas las Áreas' },
                    ...areas.map(a => ({ value: a.id_area.toString(), label: a.nombre_area }))
                  ]}
                  value={areaFilter}
                  onChange={(e: any) => {
                    setAreaFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-secondary border-transparent"
                />
              </div>
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={paginatedData}
            keyField="id_material"
            loading={loading}
            striped={true}
            readOnly={!canEdit(pathname)}
            actions={(row) => (
              <div className="flex gap-1 justify-end">
                <Link href={`/almacen/editar/${row.id_material}`}>
                  <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                    <Edit size={16} />
                  </button>
                </Link>
                <button
                  onClick={() => row.id_material && handleDelete(row.id_material)}
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            pagination={{
              page,
              pageSize,
              total: filteredData.length,
              onPageChange: setPage
            }}
          />
        </DataSection>
      </div>
    </div>
  );
}
