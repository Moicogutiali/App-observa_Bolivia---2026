import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user } = await updateSession(request)

    // Protected routes logic
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isLogin = request.nextUrl.pathname === '/login'

    if (isDashboard && !user) {
        const url = new URL('/login', request.url)
        const response = NextResponse.redirect(url)
        // Copy cookies from supabaseResponse to the redirect response
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value)
        })
        return response
    }

    if (isLogin && user) {
        const url = new URL('/dashboard', request.url)
        const response = NextResponse.redirect(url)
        // Copy cookies from supabaseResponse to the redirect response
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value)
        })
        return response
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
