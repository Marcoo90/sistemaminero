"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, Bell, Shield, Database } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ConfiguracionPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState('perfil');
    const [saving, setSaving] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { hasAccess, canEdit } = useAuth();

    useEffect(() => {
        if (!hasAccess(pathname)) {
            router.push('/');
        }
    }, [pathname, hasAccess, router]);

    const isReadOnly = !canEdit(pathname);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            alert('Configuración guardada correctamente.');
        }, 1000);
    };

    return (
        <div className="container mx-auto py-6">
            <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Configuración</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Ajustes del sistema y perfil de usuario</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 3fr', gap: '2rem' }}>
                <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
                    <Button variant={activeTab === 'perfil' ? 'primary' : 'ghost'} style={{ justifyContent: 'flex-start' }} icon={User} onClick={() => setActiveTab('perfil')}>Perfil</Button>
                    <Button variant={activeTab === 'notif' ? 'primary' : 'ghost'} style={{ justifyContent: 'flex-start' }} icon={Bell} onClick={() => setActiveTab('notif')}>Notificaciones</Button>
                    <Button variant={activeTab === 'seguridad' ? 'primary' : 'ghost'} style={{ justifyContent: 'flex-start' }} icon={Shield} onClick={() => setActiveTab('seguridad')}>Seguridad</Button>
                    <Button variant={activeTab === 'db' ? 'primary' : 'ghost'} style={{ justifyContent: 'flex-start' }} icon={Database} onClick={() => setActiveTab('db')}>Base de Datos</Button>
                </div>

                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activeTab === 'perfil' && (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mi Perfil</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input label="Usuario" value={user?.username || ''} disabled />
                                <Input label="Rol" value={user?.role?.toUpperCase() || ''} disabled />
                                <Input label="Nombre Completo" defaultValue={user?.name || ''} />
                                <Input label="Correo Electrónico" placeholder="ejemplo@minera.com" />
                            </div>
                        </>
                    )}

                    {activeTab === 'notif' && (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Preferencias de Notificación</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Activar alertas por bajo combustible o mantenimientos vencidos.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked /> Alertas de mantenimiento
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="checkbox" defaultChecked /> Notificaciones de órdenes aprobadas
                                </label>
                            </div>
                        </>
                    )}

                    {activeTab === 'seguridad' && (
                        <>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Seguridad</h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <Input label="Contraseña Actual" type="password" />
                                <Input label="Nueva Contraseña" type="password" />
                                <Input label="Confirmar Contraseña" type="password" />
                            </div>
                        </>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                    {!isReadOnly && (
                        <Button style={{ width: 'fit-content' }} onClick={handleSave} isLoading={saving}>Guardar Cambios</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
