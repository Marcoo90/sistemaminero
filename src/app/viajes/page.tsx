// 1. Convertimos la página en un Server Component (sin "use client")
// para que acepte estas configuraciones de servidor:
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import ViajesClientContent from './ViajesClientContent';

export default function Page() {
    return <ViajesClientContent />;
}
