"use server";

import { prisma } from '@/lib/prisma';
import { Usuario } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper to sanitize user object (remove password)
const sanitizeUser = (u: any): Usuario => ({
    id_usuario: u.id_usuario,
    usuario: u.usuario,
    clave: u.clave,     // Returnclave as requested for admin visibility
    rol: u.rol,
    nombre: u.nombre,
    id_personal: u.id_personal,
    personal: u.personal
});

export async function getUsuariosAll(): Promise<Usuario[]> {
    const users = await prisma.usuario.findMany({
        include: { personal: true }
    });
    return users.map(sanitizeUser);
}

export async function createUsuario(data: {
    usuario: string;
    clave: string;
    rol: string;
    nombre: string;
    id_personal?: number;
}): Promise<Usuario> {
    const user = await prisma.usuario.create({
        data: {
            usuario: data.usuario,
            clave: data.clave, // Hash this in production!
            rol: data.rol,
            nombre: data.nombre,
            id_personal: data.id_personal ? Number(data.id_personal) : null
        },
        include: { personal: true }
    });
    revalidatePath('/configuracion/usuarios');
    return sanitizeUser(user);
}

export async function updateUsuario(id: number, data: Partial<Usuario>): Promise<Usuario> {
    const updateData: any = {
        usuario: data.usuario,
        rol: data.rol,
        nombre: data.nombre,
        id_personal: data.id_personal ? Number(data.id_personal) : null
    };

    if (data.clave) {
        updateData.clave = data.clave; // Hash this!
    }

    const user = await prisma.usuario.update({
        where: { id_usuario: id },
        data: updateData,
        include: { personal: true }
    });
    revalidatePath('/configuracion/usuarios');
    return sanitizeUser(user);
}

export async function deleteUsuario(id: number): Promise<void> {
    await prisma.usuario.delete({ where: { id_usuario: id } });
    revalidatePath('/configuracion/usuarios');
}

export async function validateLogin(username: string, password: string): Promise<Usuario | null> {
    const user = await prisma.usuario.findFirst({
        where: {
            usuario: username,
            clave: password // Should be hashed in production
        },
        include: { personal: true }
    });

    if (!user) return null;
    return sanitizeUser(user);
}
