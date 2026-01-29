'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    FileText,
    AlertTriangle,
    Map as MapIcon,
    Menu,
    Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function MobileNav() {
    const pathname = usePathname()
    const [isManager, setIsManager] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        async function checkRole() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('rol')
                    .eq('id', user.id)
                    .single()

                if (profile && ['admin', 'coordinador', 'supervisor'].includes(profile.rol?.toLowerCase())) {
                    setIsManager(true)
                }
            }
        }
        checkRole()
    }, [supabase])

    const navItems = [
        {
            label: 'Resumen',
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true
        },
        ...(isManager ? [{
            label: 'Red',
            href: '/dashboard/red',
            icon: Users
        }] : []),
        {
            label: 'Apertura',
            href: '/dashboard/reportar/apertura',
            icon: FileText
        },
        {
            label: 'Incidencias',
            href: '/dashboard/reportar/incidencia',
            icon: AlertTriangle
        }
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#020617]/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,1rem)] md:hidden">
            <div className="flex items-center justify-around p-2">
                {navItems.map((item) => {
                    const active = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-full ${active
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} className={active ? 'fill-current' : ''} />
                            <span className="text-[10px] font-bold mt-1 tracking-wide">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
