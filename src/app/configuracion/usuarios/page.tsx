"use client";

import React, { useState, useEffect } from 'react';
import { getUsuariosAll, createUsuario, updateUsuario, deleteUsuario } from '@/services/usuarioService';
import { Usuario } from '@/types';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Plus, Trash2, Edit, UserCog } from 'lucide-react';
import UsuarioForm from '@/components/configuracion/UsuarioForm';
import PageHeader from '@/components/layout/PageHeader';
import DataSection from '@/components/layout/DataSection';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function UsuariosPage() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingUser, setEditingUser] = useState<Usuario | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const { hasAccess } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
            return;
        }
        loadData();
    }, [pathname, hasAccess, router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getUsuariosAll();
            setUsuarios(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        if (editingUser) {
            await updateUsuario(editingUser.id_usuario, data);
        } else {
            await createUsuario({
                usuario: data.usuario,
                clave: data.clave,
                rol: data.rol,
                nombre: data.nombre,
                id_personal: data.id_personal
            });
        }
        setView('list');
        setEditingUser(undefined);
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            await deleteUsuario(id);
            loadData();
        }
    };

    if (view === 'form') {
        return (
            <div className="space-y-10 animate-fade-in">
                <PageHeader
                    title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    description="Configuración de credenciales y niveles de acceso."
                    icon={UserCog}
                    breadcrumbs={[
                        { label: 'Configuración' },
                        { label: 'Usuarios', href: '/configuracion/usuarios' },
                        { label: editingUser ? 'Editar' : 'Nuevo' }
                    ]}
                />
                <UsuarioForm initialData={editingUser} onSave={handleSave} onCancel={() => { setView('list'); setEditingUser(undefined); }} />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <PageHeader
                title="Gestión de Usuarios"
                description="Administración de cuentas, permisos y seguridad del sistema."
                icon={UserCog}
                breadcrumbs={[
                    { label: 'Configuración' },
                    { label: 'Usuarios' }
                ]}
                action={
                    <Button icon={Plus} onClick={() => { setEditingUser(undefined); setView('form'); }} className="font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/10 px-8">
                        Nuevo Usuario
                    </Button>
                }
            />

            <DataSection>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border shadow-sm">
                        <div className="w-12 h-12 border-4 border-border rounded-full border-t-blue-500 animate-spin mb-6" />
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Cargando usuarios...</p>
                    </div>
                ) : (
                    <Table
                        data={usuarios}
                        keyField="id_usuario"
                        columns={[
                            {
                                header: 'Usuario / Acceso',
                                accessor: (row) => (
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-foreground">@{row.usuario}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{row.nombre}</p>
                                    </div>
                                )
                            },
                            {
                                header: 'Rol del Sistema',
                                accessor: (row) => (
                                    <Badge variant={row.rol === 'admin' ? 'primary' : 'secondary'}>
                                        {row.rol.toUpperCase()}
                                    </Badge>
                                ),
                                width: '140px',
                                align: 'center'
                            },
                            {
                                header: 'Personal Vinculado',
                                accessor: (row) => <span className="text-slate-500 font-medium">{row.personal?.nombres || 'Sin vinculación'}</span>
                            },
                            ...(user?.role === 'admin' ? [{
                                header: 'Contraseña',
                                accessor: (row: Usuario) => (
                                    <span className="font-mono text-blue-500 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                                        {row.clave}
                                    </span>
                                ),
                                width: '150px'
                            }] : [])
                        ]}
                        actions={(row) => (
                            <div className="flex gap-1 justify-end">
                                <button onClick={() => { setEditingUser(row); setView('form'); }} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(row.id_usuario)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        hover
                    />
                )}
            </DataSection>
        </div>
    );
}
