'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

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
        // Dynamically detect host to avoid localhost/vercel mismatch
        const headerList = await headers()
        const host = headerList.get('host') || ''

        // Priority: 
        // 1. If host header is present and NOT localhost, use it
        // 2. Else if NEXT_PUBLIC_APP_URL is NOT localhost, use it
        // 3. Else fallback to the known Vercel URL
        let baseUrl = ''
        if (host && !host.includes('localhost')) {
            const protocol = 'https'
            baseUrl = `${protocol}://${host}`
        } else {
            const envUrl = process.env.NEXT_PUBLIC_APP_URL || ''
            if (envUrl && !envUrl.includes('localhost')) {
                baseUrl = envUrl
            } else {
                baseUrl = 'https' + '://' + 'app-observa-bolivia-2026.vercel.app'
            }
        }

        const inviteRedirectUrl = `${baseUrl.replace(/\/$/, '')}/dashboard`

        const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
            data: {
                nombre,
                ci,
            },
            redirectTo: inviteRedirectUrl
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

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    // 1. Check permission
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'No autenticado' }

    const { data: profile } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', currentUser.id)
        .single()

    if (profile?.rol?.toLowerCase() !== 'admin') {
        return { error: 'Solo los administradores pueden eliminar usuarios' }
    }

    try {
        const adminSupabase = await getAdminClient()

        // Delete from public.usuarios first (since no cascade is set)
        await adminSupabase.from('usuarios').delete().eq('id', userId)

        // Then delete from Auth
        const { error } = await adminSupabase.auth.admin.deleteUser(userId)

        if (error) throw error

        revalidatePath('/dashboard/red')
        return { success: true }
    } catch (e: any) {
        console.error('Error deleting user:', e.message)
        return { error: e.message || 'Error al eliminar usuario' }
    }
}
