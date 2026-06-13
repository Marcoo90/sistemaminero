"use server";

import { prisma } from '@/lib/prisma';
import { Usuario } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper to serialize personal dates (Prisma returns Date objects which can't cross server-client boundary)
const serializePersonal = (personal: any) => {
    if (!personal) return undefined;
    return {
        ...personal,
        fecha_ingreso: personal.fecha_ingreso ? personal.fecha_ingreso.toISOString() : null,
        fecha_registro: personal.fecha_registro ? personal.fecha_registro.toISOString() : null,
    };
};

// Helper to sanitize user object
const sanitizeUser = (u: any): Usuario => ({
    id_usuario: u.id_usuario,
    usuario: u.usuario,
    clave: u.clave,     // Return clave as requested for admin visibility
    rol: u.rol,
    nombre: u.nombre,
    id_personal: u.id_personal,
    personal: serializePersonal(u.personal)
});

export async function getUsuariosAll(): Promise<Usuario[]> {
    try {
        const users = await prisma.usuario.findMany({
            include: { personal: true }
        });
        return users.map(sanitizeUser);
    } catch (error: any) {
        console.error("Error al obtener usuarios:", error);
        return [];
    }
}

export async function createUsuario(data: {
    usuario: string;
    clave: string;
    rol: string;
    nombre: string;
    id_personal?: number | string;
}): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
    try {
        // Validate required fields
        if (!data.usuario || !data.clave || !data.nombre || !data.rol) {
            return { success: false, error: 'Todos los campos obligatorios deben ser completados.' };
        }

        // Check if username already exists
        const existing = await prisma.usuario.findFirst({
            where: { usuario: data.usuario }
        });
        if (existing) {
            return { success: false, error: `El usuario "${data.usuario}" ya existe en el sistema.` };
        }

        // Check if personal is already linked to another user
        const personalId = data.id_personal ? Number(data.id_personal) : null;
        if (personalId) {
            const personalLinked = await prisma.usuario.findFirst({
                where: { id_personal: personalId }
            });
            if (personalLinked) {
                return { success: false, error: 'Este personal ya tiene un usuario asignado.' };
            }
        }

        const user = await prisma.usuario.create({
            data: {
                usuario: data.usuario,
                clave: data.clave,
                rol: data.rol,
                nombre: data.nombre,
                id_personal: personalId
            },
            include: { personal: true }
        });
        revalidatePath('/configuracion/usuarios');
        return { success: true, usuario: sanitizeUser(user) };
    } catch (error: any) {
        console.error("Error al crear usuario:", error);
        return { success: false, error: error?.message || 'Error inesperado al crear el usuario.' };
    }
}

export async function updateUsuario(id: number, data: Partial<Usuario>): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
    try {
        const updateData: any = {
            usuario: data.usuario,
            rol: data.rol,
            nombre: data.nombre,
            id_personal: data.id_personal ? Number(data.id_personal) : null
        };

        if (data.clave) {
            updateData.clave = data.clave;
        }

        const user = await prisma.usuario.update({
            where: { id_usuario: id },
            data: updateData,
            include: { personal: true }
        });
        revalidatePath('/configuracion/usuarios');
        return { success: true, usuario: sanitizeUser(user) };
    } catch (error: any) {
        console.error("Error al actualizar usuario:", error);
        return { success: false, error: error?.message || 'Error inesperado al actualizar el usuario.' };
    }
}

export async function deleteUsuario(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.usuario.delete({ where: { id_usuario: id } });
        revalidatePath('/configuracion/usuarios');
        return { success: true };
    } catch (error: any) {
        console.error("Error al eliminar usuario:", error);
        return { success: false, error: error?.message || 'Error inesperado al eliminar el usuario.' };
    }
}

export async function validateLogin(username: string, password: string): Promise<Usuario | null> {
    try {
        const user = await prisma.usuario.findFirst({
            where: {
                usuario: username,
                clave: password
            },
            include: { personal: true }
        });

        if (!user) return null;
        return sanitizeUser(user);
    } catch (error: any) {
        console.error("Error al validar login:", error);
        return null;
    }
}
