"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Usuario } from '@/types';
import { validateLogin as validateLoginDB } from '@/services/usuarioService';

interface AuthContextType {
    user: User | null;
    login: (username: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    hasAccess: (path: string) => boolean;
    canEdit: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('mining_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else if (pathname !== '/login') {
            router.push('/login');
        }
    }, [pathname, router]);

    const login = async (username: string, pass: string): Promise<boolean> => {
        try {
            const dbUser = await validateLoginDB(username, pass);

            if (dbUser) {
                const userData: User = {
                    id: dbUser.id_usuario,
                    username: dbUser.usuario,
                    role: dbUser.rol,
                    name: dbUser.nombre,
                    id_personal: dbUser.id_personal
                };

                setUser(userData);
                sessionStorage.setItem('mining_user', JSON.stringify(userData));
                router.push('/');
                return true;
            }

            // Temporary fallback for admin access
            if (username === 'admin' && pass === 'admin') {
                const adminData: User = {
                    id: 0,
                    username: 'admin',
                    role: 'admin',
                    name: 'Administrador (Respaldo)',
                };
                setUser(adminData);
                sessionStorage.setItem('mining_user', JSON.stringify(adminData));
                router.push('/');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('mining_user');
        router.push('/login');
    };

    const hasAccess = (path: string): boolean => {
        if (!user) return false;
        const role = user.role;
        if (role === 'admin') return true;
        if (role === 'gerente' || role === 'gerencia') return path !== '/configuracion/usuarios';
        if (role === 'conductor') return path === '/viajes' || path === '/';

        // Modules groups breakdown
        const logisticsItems = ['/logistica', '/equipos', '/vehiculos', '/combustible', '/almacen'];
        const adminItems = ['/vales', '/ordenes', '/proveedores', '/viajes'];
        const sharedItems = ['/', '/reportes'];

        const isLogisticsAccess = logisticsItems.some(item => path.startsWith(item));
        const isAdminAccess = adminItems.some(item => path.startsWith(item));
        const isSharedAccess = sharedItems.some(item => path === item || path.startsWith(item + '/')) || path === '/';

        if (role === 'logistica' || role === 'asistante_administrativo') {
            return isLogisticsAccess || isAdminAccess || isSharedAccess;
        }

        if (role === 'almacenero') {
            // Updated: Almacenero can see logistics/admin modules EXCEPT VIAJES. 
            // They can see Personal (Read-only)
            const isAdminNoViajes = adminItems.some(item => item !== '/viajes' && path.startsWith(item));
            return isLogisticsAccess || isAdminNoViajes || isSharedAccess || path.startsWith('/personal');
        }

        return false;
    };

    const canEdit = (path: string): boolean => {
        if (!user) return false;
        const role = user.role;
        if (role === 'admin') return true;
        if (role === 'gerente' || role === 'gerencia') return false; // Strictly view only

        if (role === 'almacenero') {
            // Personal is read-only except EPP section
            if (path.startsWith('/personal')) {
                return path.startsWith('/personal/epp');
            }
            return true; // Can edit in logistics/admin (but hasAccess restricts via /viajes)
        }

        if (role === 'conductor') {
            return path === '/viajes';
        }

        return true; // Logistica, Asistente, etc can edit in their modules
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasAccess, canEdit }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
