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
    Activity,
    Database
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import MobileNav from '@/components/dashboard/MobileNav'
import ManagementView from './ManagementView'
import PresenceTracker from '@/components/dashboard/PresenceTracker'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Parallel fetching for performance
    const [profileRes, summaryRes, activityRes, deptStatsRes] = await Promise.all([
        supabase.from('usuarios').select('*').eq('id', user.id).single(),
        supabase.rpc('get_dashboard_summary', { user_id_param: user.id }),
        supabase.rpc('get_recent_reports', { user_id_param: user.id, limit_param: 15 }),
        supabase.rpc('get_stats_by_department')
    ])

    const profile = profileRes.data
    const summary = summaryRes.data
    const recentReports = activityRes.data
    const deptStats = deptStatsRes.data

    if (profileRes.error) {
        console.error('⛔ Error cargando perfil:', profileRes.error.message)
    }

    // Fetch location hierarchy for breadcrumbs
    let breadcrumbItems = []
    if (profile?.ubicacion_id) {
        const { data: path } = await supabase.rpc('get_location_path', {
            target_location_id: profile.ubicacion_id
        })
        if (path) breadcrumbItems = path
    }

    // Fallback logic for when stats are zero
    let displaySummary = summary || { total_reportes: 0, alertas_criticas: 0, total_recintos: 0, total_observadores: 0, observadores_online: 0 }

    // If summary says 0 but we want to confirm if there is ANY data in the system
    if (displaySummary.total_reportes === 0) {
        const { count } = await supabase.from('reportes').select('id', { count: 'exact', head: true })
        if (count && count > 0) {
            displaySummary.total_reportes = count
            displaySummary.is_fallback = true // Flag to show "Global View" warning
        }
    }

    const isManagement = ['admin', 'coordinador', 'supervisor'].includes(profile?.rol?.toLowerCase() || '')
    const isAdmin = profile?.rol?.toLowerCase() === 'admin'

    const stats = [
        {
            label: 'Reportes Registrados',
            val: displaySummary.total_reportes?.toLocaleString() || '0',
            color: 'primary',
            trend: isAdmin ? 'Total Nacional' : 'En tu jurisdicción',
            icon: FileText
        },
        {
            label: 'Incidencias',
            val: displaySummary.alertas_criticas?.toLocaleString() || '0',
            color: 'accent',
            trend: 'Severidad Alta',
            icon: ShieldAlert
        },
        {
            label: isManagement ? 'En Línea' : 'Estado',
            val: displaySummary.observadores_online?.toLocaleString() || '0',
            color: 'success',
            trend: 'Observadores',
            icon: Activity
        },
        {
            label: isAdmin ? 'Voluntarios' : 'Recintos',
            val: (isAdmin ? displaySummary.total_observadores : displaySummary.total_recintos)?.toLocaleString() || '0',
            color: 'blue-400',
            trend: 'Activos',
            icon: Users
        }
    ]

    return (
        <div className="min-h-screen flex bg-[#0B0F19] text-foreground font-sans selection:bg-primary/30">
            {/* Presence Heartbeat */}
            <PresenceTracker userId={user.id} />

            {/* Sidebar - Desktop Only */}
            <aside className="w-72 bg-[#020617]/90 backdrop-blur-3xl border-r border-white/5 hidden md:flex flex-col sticky top-0 h-screen z-50 shadow-2xl">
                <div className="p-8 text-center md:text-left">
                    <div className="flex items-center space-x-3 text-primary font-black text-2xl tracking-tighter">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 bg-gradient-to-br from-primary to-blue-600">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">OBSERVA</span>
                    </div>
                </div>

                <nav className="flex-grow px-6 space-y-2">
                    <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-3 py-4">Navegación Principal</div>
                    <Link href="/dashboard" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl bg-primary/10 text-primary font-bold transition-all border border-primary/20 shadow-inner shadow-primary/5">
                        <div className="flex items-center space-x-3">
                            <LayoutDashboard size={20} />
                            <span>Resumen</span>
                        </div>
                        <ChevronRight size={16} className="opacity-50" />
                    </Link>
                    <Link href="/dashboard/reportar/apertura" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all hover:pl-5">
                        <div className="flex items-center space-x-3">
                            <FileText size={20} />
                            <span>Apertura de Mesas</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                    <Link href="/dashboard/reportar/incidencia" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all hover:pl-5">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle size={20} />
                            <span>Incidencias</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>

                    <div className="my-6 border-t border-white/5" />

                    {isManagement && (
                        <Link href="/dashboard/red" prefetch={false} className="flex items-center justify-between group px-4 py-3 rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all hover:pl-5">
                            <div className="flex items-center space-x-3">
                                <Users size={20} />
                                <span>Red Observadores</span>
                            </div>
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                        </Link>
                    )}
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-muted-foreground/50 cursor-not-allowed hover:bg-white/5 disabled">
                        <MapIcon size={20} />
                        <span>Geomapa 2026</span>
                    </a>
                </nav>

                <div className="p-6">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-black shadow-lg shadow-black/40 ring-2 ring-white/10 uppercase">
                                {profile?.nombre?.[0] || user.email?.[0]}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-bold truncate text-sm text-foreground">{profile?.nombre || 'Ecotraffic User'}</p>
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
                                    ? 'Monitoreo estratégico en tiempo real de la red territorial.'
                                    : 'Control de integridad y reporte de campo desde tu municipio.'}
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
                    <ManagementView
                        summary={displaySummary}
                        recentActivity={recentReports || []}
                        deptStats={deptStats || []}
                    />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className={`p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 bg-[#0F1420]/50 backdrop-blur-md hover:bg-white/5 transition-all group relative overflow-hidden`}>
                                    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all text-${stat.color}`}>
                                        <stat.icon size={48} />
                                    </div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 md:mb-4 truncate">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl md:text-4xl font-black tracking-tighter mb-2 md:mb-3 text-white">{stat.val}</p>
                                    <span className={`text-[9px] md:text-[10px] font-black text-muted-foreground/60 border border-white/5 bg-white/5 px-2 py-1 rounded-md inline-flex items-center`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Reports with 0 Alert */}
                        {displaySummary.is_fallback && (
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex items-center gap-6">
                                <div className="p-3 bg-primary/20 rounded-full text-primary">
                                    <Database size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-white uppercase text-xs tracking-widest">Aviso de Jurisdicción</p>
                                    <p className="text-[11px] text-muted-foreground">No tienes un municipio o recinto asignado. Estás visualizando reportes nacionales.</p>
                                </div>
                            </div>
                        )}

                        {/* Action Cards */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <Link href="/dashboard/reportar/apertura" prefetch={false} className="group p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-gradient-to-br from-[#1c2235] to-[#0f1219] border border-white/5 relative overflow-hidden shadow-2xl hover:shadow-primary/10 transition-all">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all pointer-events-none" />
                                <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start justify-between gap-4 h-full">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                                        <PlusCircle size={24} className="md:w-9 md:h-9" />
                                    </div>
                                    <div className="flex-grow text-left">
                                        <h3 className="text-xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 text-white group-hover:text-primary transition-colors">Apertura de Mesa</h3>
                                        <p className="text-xs md:text-sm text-muted-foreground font-medium">Inicia la jornada reportando arribo de material.</p>
                                    </div>
                                    <ChevronRight size={24} className="text-white/20 md:hidden" />
                                </div>
                            </Link>

                            <Link href="/dashboard/reportar/incidencia" prefetch={false} className="group p-6 md:p-10 rounded-3xl md:rounded-[3rem] bg-gradient-to-br from-[#2a1717] to-[#0f1219] border border-white/5 relative overflow-hidden shadow-2xl hover:shadow-accent/10 transition-all">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all pointer-events-none" />
                                <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start justify-between gap-4 h-full">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-accent rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-accent/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                                        <AlertTriangle size={24} className="md:w-9 md:h-9" />
                                    </div>
                                    <div className="flex-grow text-left">
                                        <h3 className="text-xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 text-white group-hover:text-accent transition-colors">Alertar Incidencia</h3>
                                        <p className="text-xs md:text-sm text-muted-foreground font-medium">Reporta anomalías críticas en tiempo real.</p>
                                    </div>
                                    <ChevronRight size={24} className="text-white/20 md:hidden" />
                                </div>
                            </Link>
                        </section>
                    </>
                )}
            </main>

            <MobileNav />
        </div>
    )
}
