import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ConfigurarPerfilView from './view'
import { ChevronRight, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/login/actions'
import Breadcrumbs from '@/components/Breadcrumbs'

export const dynamic = 'force-dynamic'

export default async function ConfigurarPerfilPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return redirect('/login')

    return (
        <div className="min-h-screen flex bg-[#0B0F19] text-foreground font-sans selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-72 bg-[#020617]/90 backdrop-blur-3xl border-r border-white/5 hidden md:flex flex-col sticky top-0 h-screen z-50 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center space-x-3 text-primary font-black text-2xl tracking-tighter">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-blue-600">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">OBSERVA</span>
                    </div>
                </div>

                <nav className="flex-grow px-6 space-y-2">
                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-3 py-4">Navegación Principal</div>
                    <Link href="/dashboard" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 transition-all">
                        <div className="flex items-center space-x-3">
                            <LayoutDashboard size={20} />
                            <span>Resumen</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-50 transition-all" />
                    </Link>

                    <div className="my-6 border-t border-white/5" />

                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-3 py-2">Herramientas</div>
                    <Link href="/dashboard/configurar-perfil" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold transition-all border border-primary/20 shadow-inner shadow-primary/5">
                        <div className="flex items-center space-x-3">
                            <Settings size={20} />
                            <span>Configuración</span>
                        </div>
                        <ChevronRight size={16} className="opacity-50" />
                    </Link>
                </nav>

                <div className="p-6">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black shadow-lg shadow-black/40 ring-2 ring-white/10 uppercase">
                                {profile.nombre[0]}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold truncate text-sm text-foreground">{profile.nombre}</p>
                                <p className="text-[10px] text-muted-foreground truncate font-mono uppercase tracking-widest">{profile.rol}</p>
                            </div>
                        </div>
                        <form action={logout}>
                            <button className="w-full flex items-center justify-center space-x-2 py-3 text-xs font-black text-danger/80 hover:text-white hover:bg-danger rounded-xl transition-all border border-danger/20 hover:border-danger hover:shadow-lg hover:shadow-danger/20">
                                <LogOut size={14} />
                                <span>CERRAR SESIÓN</span>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-8 lg:p-10 space-y-8 overflow-y-auto relative w-full max-w-[100vw]">
                <div className="relative z-10">
                    <Breadcrumbs items={[{ label: 'Inicio', href: '/dashboard' }, { label: 'Configurar Cuenta', href: '/dashboard/configurar-perfil' }]} />
                </div>

                <ConfigurarPerfilView />
            </main>
        </div>
    )
}
