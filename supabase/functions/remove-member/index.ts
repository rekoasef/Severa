import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtenemos el usuario que está haciendo la petición
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Acción no autorizada.")

    // Obtenemos los datos enviados desde la app
    const { pantry_id, user_id_to_remove } = await req.json()

    // Creamos un cliente con permisos de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificación de seguridad: ¿Es el que llama el dueño de la alacena?
    const { data: pantry, error: pantryError } = await supabaseAdmin
      .from('pantries')
      .select('owner_id')
      .eq('id', pantry_id)
      .single()

    if (pantryError) throw pantryError;
    if (pantry.owner_id !== user.id) {
      throw new Error('Solo el dueño de la alacena puede eliminar miembros.')
    }

    // Verificación de seguridad: No se puede eliminar al propio dueño
    if (pantry.owner_id === user_id_to_remove) {
      throw new Error('No puedes eliminar al dueño de la alacena.')
    }

    // Si todo es correcto, procedemos a eliminar al miembro
    const { error: deleteError } = await supabaseAdmin
      .from('pantry_members')
      .delete()
      .match({ pantry_id: pantry_id, user_id: user_id_to_remove })

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: 'Miembro eliminado con éxito.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error en la función remove-member:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})