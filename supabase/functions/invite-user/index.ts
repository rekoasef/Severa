import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pantry_id, invitee_email } = await req.json()

    // Validar que los datos necesarios fueron enviados
    if (!pantry_id || !invitee_email) {
      throw new Error('Faltan datos en la petición (pantry_id o invitee_email).')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // CORRECCIÓN: Usamos el método de administración para buscar al usuario por email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      email: invitee_email,
    });
    
    if (userError) throw userError;
    if (!users || users.length === 0) {
      throw new Error('Usuario no encontrado.');
    }
    const invitee = users[0]; // El usuario encontrado

    // Verificamos si ya existe una invitación o membresía
    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from('pantry_members')
      .select('id')
      .eq('pantry_id', pantry_id)
      .eq('user_id', invitee.id)
      .maybeSingle()

    if (existingMemberError) throw existingMemberError;
    if (existingMember) {
      throw new Error('Este usuario ya es miembro o tiene una invitación pendiente.')
    }

    // Insertamos la nueva invitación
    const { error: insertError } = await supabaseAdmin
      .from('pantry_members')
      .insert({
        pantry_id: pantry_id,
        user_id: invitee.id,
      })
    
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: '¡Invitación enviada con éxito!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error en la función invite-user:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})