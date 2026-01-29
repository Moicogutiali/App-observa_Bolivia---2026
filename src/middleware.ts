import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user } = await updateSession(request)

    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isLogin = request.nextUrl.pathname === '/login'

    // If trying to access dashboard but not logged in
    if (isDashboard && !user) {
        const url = new URL('/login', request.url)
        // Pass the original URL as a redirect parameter for better UX
        url.searchParams.set('next', request.nextUrl.pathname)

        const response = NextResponse.redirect(url)
        // CRITICAL: Copy all cookies from the session update to the redirect response
        // This ensures the auth state is preserved during the jump
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, {
                ...cookie,
                path: '/',
                sameSite: 'lax',
                secure: true,
                httpOnly: true
            })
        })
        return response
    }

    // If already logged in and trying to go to login page
    if (isLogin && user) {
        const url = new URL('/dashboard', request.url)
        const response = NextResponse.redirect(url)

        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, {
                ...cookie,
                path: '/',
                sameSite: 'lax',
                secure: true,
                httpOnly: true
            })
        })
        return response
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
