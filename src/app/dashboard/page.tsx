import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/login/actions'
import {
    Users,
    Map as MapIcon,
    FileText,
    AlertTriangle,
    LogOut,
    LayoutDashboard,
    CheckCircle2,
    Clock,
    PlusCircle,
    FileCheck,
    ChevronRight
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('⛔ Error cargando perfil:', profileError.message)
    }

    // Fetch location hierarchy for breadcrumbs
    let breadcrumbItems = []
    if (profile?.ubicacion_id) {
        const { data: path } = await supabase.rpc('get_location_path', {
            target_location_id: profile.ubicacion_id
        })
        if (path) breadcrumbItems = path
    }

    // Fetch dynamic stats from the RPC function
    const { data: summary } = await supabase.rpc('get_dashboard_summary', {
        user_id_param: user.id
    })

    // Fetch recent activity
    const { data: recentReports } = await supabase.rpc('get_recent_reports', {
        user_id_param: user.id,
        limit_param: 5
    })

    const stats = [
        {
            label: 'Reportes Registrados',
            val: summary?.total_reportes?.toLocaleString() || '0',
            color: 'primary',
            trend: profile?.rol === 'admin' ? 'Total Nacional' : 'En tu jurisdicción'
        },
        {
            label: 'Alertas Críticas',
            val: summary?.alertas_criticas?.toLocaleString() || '0',
            color: 'accent',
            trend: 'Severidad Alta'
        },
        {
            label: profile?.rol === 'admin' ? 'Despliegue' : 'Recintos Asignados',
            val: summary?.total_recintos?.toLocaleString() || '0',
            color: 'success',
            trend: 'Activos'
        },
        {
            label: 'Observadores',
            val: summary?.total_observadores?.toLocaleString() || '0',
            color: 'blue-400',
            trend: 'En Red'
        }
    ]

    return (
        <div className="min-h-screen flex bg-background/50">
            {/* Sidebar - Enhanced Dark Design */}
            <aside className="w-72 bg-[#020617]/80 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8">
                    <div className="flex items-center space-x-3 text-primary font-black text-2xl tracking-tighter">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <LayoutDashboard size={24} />
                        </div>
                        <span>OBSERVA</span>
                    </div>
                </div>

                <nav className="flex-grow px-6 space-y-1.5">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-3 py-6">Navegación</div>
                    <Link href="/dashboard" className="flex items-center justify-between group px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold transition-all">
                        <div className="flex items-center space-x-3">
                            <LayoutDashboard size={20} />
                            <span>Resumen</span>
                        </div>
                        <ChevronRight size={16} className="opacity-50" />
                    </Link>
                    <Link href="/dashboard/reportar/apertura" className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                        <div className="flex items-center space-x-3">
                            <FileText size={20} />
                            <span>Apertura de Mesas</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                    <Link href="/dashboard/reportar/incidencia" className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle size={20} />
                            <span>Incidencias</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                    <div className="pt-4 opacity-50">
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-muted-foreground cursor-not-allowed">
                            <Users size={20} />
                            <span>Red Observadores</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-muted-foreground cursor-not-allowed">
                            <MapIcon size={20} />
                            <span>Geomapa 2026</span>
                        </a>
                    </div>
                </nav>

                <div className="p-6">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4 shadow-2xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black shadow-lg">
                                {profile?.nombre?.[0] || user.email?.[0].toUpperCase()}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold truncate text-sm">{profile?.nombre || 'Consultor'}</p>
                                <p className="text-[10px] text-muted-foreground truncate font-mono uppercase tracking-widest">{profile?.rol || 'observador'}</p>
                            </div>
                        </div>
                        <form action={logout}>
                            <button className="w-full flex items-center justify-center space-x-2 py-3 text-xs font-black text-danger/80 hover:text-danger hover:bg-danger/10 rounded-xl transition-all border border-danger/20">
                                <LogOut size={14} />
                                <span>CERRAR SESIÓN</span>
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-4 md:p-10 space-y-10 overflow-y-auto relative">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Breadcrumbs items={breadcrumbItems} />
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tighter">Panel de Gestión</h1>
                            <p className="text-muted-foreground font-medium text-lg">
                                Control de integridad: <span className="text-primary font-bold">Elecciones Subnacionales 2026</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-success/10 text-success border border-success/20 px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <Clock size={16} />
                        <span>SISTEMA ACTIVO</span>
                    </div>
                </header>

                {/* Action Cards - Premium Glass */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link href="/dashboard/reportar/apertura" className="group glass-card p-10 rounded-[3rem] overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                            <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <PlusCircle size={36} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight mb-2">Apertura de Mesa</h3>
                                <p className="text-muted-foreground font-medium">Inicia la jornada reportando arribo de material y jurados.</p>
                            </div>
                            <div className="flex items-center text-primary font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform">
                                <span>NUEVO REPORTE</span>
                                <ChevronRight size={16} className="ml-2" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/reportar/incidencia" className="group glass-card p-10 rounded-[3rem] overflow-hidden relative border-accent/10">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all" />
                        <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
                            <div className="w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-accent/40 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                <AlertTriangle size={36} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tight mb-2">Incidencias Críticas</h3>
                                <p className="text-muted-foreground font-medium">Reporta irregularidades, retrasos o eventos graves con evidencia.</p>
                            </div>
                            <div className="flex items-center text-accent font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform">
                                <span>REGISTRAR ALERTA</span>
                                <ChevronRight size={16} className="ml-2" />
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Stats Grid - High Contrast */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className={`p-8 rounded-[2rem] border-l-8 glass-card border-${stat.color} hover:bg-white/5 transition-all`}>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
                                {stat.label}
                            </p>
                            <p className="text-4xl font-black tracking-tighter mb-2">{stat.val}</p>
                            <p className={`text-[10px] font-black text-${stat.color} bg-${stat.color}/10 px-2 py-1 rounded-md inline-block`}>
                                {stat.trend}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Latest Activity - Dark Table */}
                <section className="glass-card rounded-[2.5rem] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-black text-xl tracking-tight uppercase">Actividad en Tiempo Real</h3>
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Actualizando hoy</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Observador de Campo</th>
                                    <th className="px-8 py-5">Recinto Destino</th>
                                    <th className="px-8 py-5 text-center">Tipo</th>
                                    <th className="px-8 py-5 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentReports && recentReports.length > 0 ? (
                                    recentReports.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-[10px]">
                                                        {row.user_name?.[0] || 'U'}
                                                    </div>
                                                    <span className="font-bold group-hover:text-primary transition-colors">{row.user_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-muted-foreground font-medium">{row.recinto_name}</td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${row.tipo_reporte === 'incidencia' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                                                    {row.tipo_reporte?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${row.estado === 'validado' ? 'bg-success' : 'bg-accent shadow-lg shadow-accent/50'}`} />
                                                    <span className="text-[10px] font-black tracking-widest opacity-80">{row.estado?.toUpperCase()}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-10 text-center text-muted-foreground font-medium italic">
                                            No hay actividad reciente en tu jurisdicción.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    )
}
