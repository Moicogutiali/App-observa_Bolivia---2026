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
    Clock,
    PlusCircle,
    ChevronRight,
    TrendingUp,
    ShieldAlert,
    Activity
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import MobileNav from '@/components/dashboard/MobileNav'
import ManagementView from './ManagementView'

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
        limit_param: 10 // Increased for Management visibility
    })

    const isManagement = ['admin', 'coordinador', 'supervisor'].includes(profile?.rol?.toLowerCase() || '')
    const isAdmin = profile?.rol?.toLowerCase() === 'admin'

    const stats = [
        {
            label: 'Reportes Registrados',
            val: summary?.total_reportes?.toLocaleString() || '0',
            color: 'primary',
            trend: isAdmin ? 'Total Nacional' : 'En tu jurisdicción',
            icon: FileText
        },
        {
            label: 'Alertas Críticas',
            val: summary?.alertas_criticas?.toLocaleString() || '0',
            color: 'accent',
            trend: 'Severidad Alta',
            icon: ShieldAlert
        },
        {
            label: isAdmin ? 'Recintos Monitoreados' : 'Recintos Asignados',
            val: summary?.total_recintos?.toLocaleString() || '0',
            color: 'success',
            trend: 'Cobertura',
            icon: MapIcon
        },
        {
            label: isAdmin ? 'Voluntarios Activos' : 'Observadores',
            val: summary?.total_observadores?.toLocaleString() || '0',
            color: 'blue-400',
            trend: 'En Red',
            icon: Users
        }
    ]

    return (
        <div className="min-h-screen flex bg-[#0B0F19] text-foreground font-sans selection:bg-primary/30">
            {/* Sidebar - Desktop Only */}
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
                    <Link href="/dashboard" className="flex items-center justify-between group px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold transition-all border border-primary/20 shadow-inner shadow-primary/5">
                        <div className="flex items-center space-x-3">
                            <LayoutDashboard size={20} />
                            <span>Resumen</span>
                        </div>
                        <ChevronRight size={16} className="opacity-50" />
                    </Link>
                    <Link href="/dashboard/reportar/apertura" className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all hover:pl-5">
                        <div className="flex items-center space-x-3">
                            <FileText size={20} />
                            <span>Apertura de Mesas</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                    <Link href="/dashboard/reportar/incidencia" className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all hover:pl-5">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle size={20} />
                            <span>Incidencias</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>

                    <div className="my-6 border-t border-white/5" />

                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-3 py-2">Herramientas</div>
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-muted-foreground/50 cursor-not-allowed hover:bg-white/5 disabled">
                        <Users size={20} />
                        <span>Red Observadores</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-muted-foreground/50 cursor-not-allowed hover:bg-white/5 disabled">
                        <MapIcon size={20} />
                        <span>Geomapa 2026</span>
                    </a>
                </nav>

                <div className="p-6">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black shadow-lg shadow-black/40 ring-2 ring-white/10">
                                {profile?.nombre?.[0] || user.email?.[0].toUpperCase()}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold truncate text-sm text-foreground">{profile?.nombre || 'Consultor'}</p>
                                <p className="text-[10px] text-muted-foreground truncate font-mono uppercase tracking-widest">{profile?.rol || 'observador'}</p>
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
            <main className="flex-grow p-4 md:p-8 lg:p-10 space-y-8 md:space-y-10 overflow-y-auto relative pb-32 md:pb-10 w-full max-w-[100vw] overflow-x-hidden">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div className="space-y-4 max-w-2xl">
                        <Breadcrumbs items={breadcrumbItems} />
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                                {isManagement ? 'Panel de Control' : 'Panel de Gestión'}
                            </h1>
                            <p className="text-muted-foreground font-medium text-xs md:text-sm max-w-md">
                                {isManagement
                                    ? 'Monitoreo estratégico en tiempo real. Elecciones Subnacionales 2026.'
                                    : 'Control de integridad y reporte de campo desde tu jurisdicción asignada.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-success/10 text-success border border-success/20 px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-lg shadow-success/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_currentColor]" />
                        <Clock size={14} />
                        <span>SISTEMA ACTIVO</span>
                    </div>
                </header>

                {/* Dashboard Content Switcher */}
                {isManagement ? (
                    <ManagementView summary={summary} recentActivity={recentReports || []} />
                ) : (
                    <>
                        {/* Stats Grid - High Contrast & Adjusted for Mobile */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className={`p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 bg-[#0F1420]/50 backdrop-blur-md hover:bg-white/5 transition-all group relative overflow-hidden`}>
                                    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all text-${stat.color}`}>
                                        <stat.icon size={48} />
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 md:mb-4 truncate">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl md:text-4xl font-black tracking-tighter mb-2 md:mb-3 text-foreground">{stat.val}</p>
                                    <span className={`text-[9px] md:text-[10px] font-black text-${stat.color} bg-${stat.color}/10 border border-${stat.color}/20 px-2 py-1 rounded-md inline-flex items-center`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Action Cards - Responsive Sizes */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <Link href="/dashboard/reportar/apertura" className="group p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-gradient-to-br from-[#1c2235] to-[#0f1219] border border-white/5 relative overflow-hidden shadow-2xl hover:shadow-primary/10 transition-all">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all pointer-events-none" />
                                <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start justify-between gap-4 h-full">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                                        <PlusCircle size={24} className="md:w-9 md:h-9" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 text-white group-hover:text-primary transition-colors">Apertura de Mesa</h3>
                                        <p className="text-xs md:text-base text-muted-foreground font-medium">Inicia la jornada reportando arribo de material.</p>
                                    </div>
                                    <div className="hidden md:flex items-center text-primary font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform mt-auto">
                                        <span>NUEVO REPORTE</span>
                                        <ChevronRight size={16} className="ml-2" />
                                    </div>
                                    <ChevronRight size={24} className="text-white/20 md:hidden" />
                                </div>
                            </Link>

                            <Link href="/dashboard/reportar/incidencia" className="group p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-gradient-to-br from-[#2a1717] to-[#0f1219] border border-white/5 relative overflow-hidden shadow-2xl hover:shadow-accent/10 transition-all">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all pointer-events-none" />
                                <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start justify-between gap-4 h-full">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-accent rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-accent/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shrink-0">
                                        <AlertTriangle size={24} className="md:w-9 md:h-9" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 text-white group-hover:text-accent transition-colors">Incidencias Críticas</h3>
                                        <p className="text-xs md:text-base text-muted-foreground font-medium">Reporta irregularidades graves con evidencia.</p>
                                    </div>
                                    <div className="hidden md:flex items-center text-accent font-black uppercase tracking-widest text-xs group-hover:translate-x-2 transition-transform mt-auto">
                                        <span>REGISTRAR ALERTA</span>
                                        <ChevronRight size={16} className="ml-2" />
                                    </div>
                                    <ChevronRight size={24} className="text-white/20 md:hidden" />
                                </div>
                            </Link>
                        </section>

                        {/* Latest Activity - Improved Table */}
                        <section className="rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#0F1420]/30 backdrop-blur-md">
                            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/[0.02]">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        <Activity size={20} className="text-primary" />
                                    </div>
                                    <h3 className="font-black text-lg md:text-xl tracking-tight uppercase text-white">
                                        Actividad Reciente
                                    </h3>
                                </div>
                                <div className="flex space-x-2 items-center px-3 py-1 bg-white/5 rounded-full">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">En vivo</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                            <th className="px-6 py-4 md:px-8 md:py-5">Usuario</th>
                                            <th className="px-6 py-4 md:px-8 md:py-5">Recinto</th>
                                            <th className="px-6 py-4 md:px-8 md:py-5 text-center">Tipo</th>
                                            <th className="px-6 py-4 md:px-8 md:py-5 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentReports && recentReports.length > 0 ? (
                                            recentReports.map((row: any, i: number) => (
                                                <tr key={i} className="hover:bg-white/5 transition-all group">
                                                    <td className="px-6 py-4 md:px-8 md:py-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-[10px] ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
                                                                {row.user_name?.[0] || 'U'}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{row.user_name}</span>
                                                                <span className="text-[10px] text-muted-foreground md:hidden">{new Date(row.fecha_captura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 md:px-8 md:py-6 text-muted-foreground font-medium text-xs md:text-sm">{row.recinto_name}</td>
                                                    <td className="px-6 py-4 md:px-8 md:py-6 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black tracking-widest border ${row.tipo_reporte === 'incidencia' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                                            {row.tipo_reporte?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 md:px-8 md:py-6 text-center">
                                                        <div className={`w-2 h-2 rounded-full mx-auto ${row.estado === 'validado' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'}`} title={row.estado} />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground font-medium italic">
                                                    No hay actividad reciente en tu jurisdicción.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                <div className="h-20 md:hidden" /> {/* Spacer for Mobile Nav */}
            </main>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    )
}
