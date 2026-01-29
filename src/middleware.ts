import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isLogin = request.nextUrl.pathname === '/login'

    // RE-INJECT COOKIES FOR MOBILE SESSIONS
    const injectCookies = (res: NextResponse) => {
        supabaseResponse.cookies.getAll().forEach(c => {
            res.cookies.set(c.name, c.value, {
                path: '/',
                sameSite: 'lax',
                secure: true,
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7 // 1 week
            })
        })
    }

    if (isDashboard && !user) {
        const url = new URL('/login', request.url)
        url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        const response = NextResponse.redirect(url)
        injectCookies(response)
        return response
    }

    if (isLogin && user) {
        const response = NextResponse.redirect(new URL('/dashboard', request.url))
        injectCookies(response)
        return response
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
