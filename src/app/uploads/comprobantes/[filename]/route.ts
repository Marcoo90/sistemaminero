import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const filename = (await params).filename;
        // Construimos la ruta física al archivo en el servidor
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'comprobantes', filename);

        // Verificamos si existe el archivo físicamente
        if (!fs.existsSync(filePath)) {
            console.error(`Archivo no encontrado en el disco: ${filePath}`);
            return new NextResponse('Archivo no encontrado', { status: 404 });
        }

        // Leemos el archivo
        const fileBuffer = fs.readFileSync(filePath);

        // Determinamos el Content-Type basado en la extensión
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error sirviendo el comprobante:', error);
        return new NextResponse('Error interno del servidor', { status: 500 });
    }
}
