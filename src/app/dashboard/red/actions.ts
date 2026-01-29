'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// This function requires SUPABASE_SERVICE_ROLE_KEY for administrative Auth operations
async function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations are disabled.')
    }

    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function inviteUser(formData: FormData) {
    const supabase = await createClient()

    // 1. Check if the current user has permission
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', currentUser.id)
        .single()

    const managerRole = profile?.rol?.toLowerCase()
    if (!['admin', 'coordinador', 'supervisor'].includes(managerRole)) {
        return { error: 'Permisos insuficientes' }
    }

    // 2. Extract Data
    const email = formData.get('email') as string
    const nombre = formData.get('nombre') as string
    const rol = formData.get('rol') as string
    const ci = formData.get('ci') as string
    const telefono = formData.get('telefono') as string
    const ubicacion_id = formData.get('ubicacion_id') as string

    // 3. Admin Operation
    try {
        const adminSupabase = await getAdminClient()

        // A. Invite user (sends email)
        const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
            data: {
                nombre,
                ci,
            },
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        })

        if (inviteError) throw inviteError

        // B. The trigger typically creates the profile, but we might want to update it immediately
        // or ensure it exists with the correct role and location
        const { error: profileError } = await adminSupabase
            .from('usuarios')
            .upsert({
                id: inviteData.user.id,
                nombre,
                ci,
                rol,
                telefono,
                ubicacion_id: ubicacion_id || null,
            })

        if (profileError) throw profileError

        revalidatePath('/dashboard/red')
        return { success: true }

    } catch (e: any) {
        console.error('Error inviting user:', e.message)
        return { error: e.message || 'Error al invitar usuario' }
    }
}
