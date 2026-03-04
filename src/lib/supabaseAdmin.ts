import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno.");
}

// Cliente administrativo (SOLO PARA USO EN SERVIDOR)
// Este cliente salta las políticas RLS y tiene acceso total.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
