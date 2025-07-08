import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database.types' // Crearemos este archivo a continuación

// Creamos un cliente de Supabase para ser usado en el lado del cliente (navegador)
export const supabase = createPagesBrowserClient<Database>()