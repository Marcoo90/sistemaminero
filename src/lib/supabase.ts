import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo (SOLO PARA USO EN SERVIDOR)
// Este cliente salta las políticas RLS. 
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("ADVERTENCIA: SUPABASE_SERVICE_ROLE_KEY no está definida. Las subidas de archivos podrían fallar.");
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
