'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
    BarChart3,
    Calendar,
    ChevronDown,
    Download,
    Filter,
    MapPin,
    MoreHorizontal,
    RefreshCw,
    Search,
    TrendingUp,
    Users,
    ShieldAlert,
    FileText,
    Map,
    ArrowUpRight,
    ArrowDownRight,
    SearchX,
    Database,
    Loader2
} from 'lucide-react'
import { getPendingReports } from '@/utils/offline-db'

// Mock Data for Infrastructure (This should ideally come from DB)
const DEPARTMENT_DATA = [
    { name: 'La Paz', reports: 120, alerts: 12, seats: 450, recintos: 1200 },
    { name: 'Santa Cruz', reports: 145, alerts: 5, seats: 380, recintos: 1100 },
    { name: 'Cochabamba', reports: 98, alerts: 8, seats: 320, recintos: 950 },
    { name: 'Oruro', reports: 45, alerts: 2, seats: 150, recintos: 450 },
    { name: 'Potosí', reports: 32, alerts: 1, seats: 180, recintos: 520 },
    { name: 'Tarija', reports: 56, alerts: 3, seats: 140, recintos: 410 },
    { name: 'Chuquisaca', reports: 41, alerts: 0, seats: 160, recintos: 480 },
    { name: 'Beni', reports: 28, alerts: 4, seats: 110, recintos: 320 },
    { name: 'Pando', reports: 12, alerts: 1, seats: 45, recintos: 120 },
]

const MUNICIPALITY_DATA: Record<string, any[]> = {
    'La Paz': [
        { name: 'La Paz (Cercado)', reports: 85, seats: 220, recintos: 650 },
        { name: 'El Alto', reports: 60, seats: 180, recintos: 450 },
        { name: 'Viacha', reports: 12, seats: 30, recintos: 60 },
    ],
    'Santa Cruz': [
        { name: 'Santa Cruz de la Sierra', reports: 110, seats: 250, recintos: 750 },
        { name: 'Montero', reports: 25, seats: 60, recintos: 150 },
        { name: 'Warnes', reports: 15, seats: 40, recintos: 100 },
    ],
}

export default function ManagementView({ summary, recentActivity }: { summary: any, recentActivity: any[] }) {
    const [selectedDept, setSelectedDept] = useState('Todos')
    const [searchQuery, setSearchQuery] = useState('')
    const [showDeptDropdown, setShowDeptDropdown] = useState(false)
    const [timeRange, setTimeRange] = useState('Hoy')
    const [offlineReports, setOfflineReports] = useState<any[]>([])
    const [loadingOffline, setLoadingOffline] = useState(true)

    // Load Offline Data (to explain why totals might be 0)
    useEffect(() => {
        const loadOffline = async () => {
            try {
                const pending = await getPendingReports()
                setOfflineReports(pending)
            } catch (e) {
                console.error('Error loading offline reports:', e)
            } finally {
                setLoadingOffline(false)
            }
        }
        loadOffline()
        // Refresh every 10s if we have offline data
        const interval = setInterval(loadOffline, 10000)
        return () => clearInterval(interval)
    }, [])

    // Filter Logic
    const filteredReportsData = useMemo(() => {
        if (selectedDept === 'Todos') return DEPARTMENT_DATA
        return DEPARTMENT_DATA.filter(d => d.name === selectedDept)
    }, [selectedDept])

    const filteredActivity = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        return recentActivity.filter(item => {
            if (!query) return true
            return (
                item.user_name?.toLowerCase().includes(query) ||
                item.recinto_name?.toLowerCase().includes(query) ||
                item.tipo_reporte?.toLowerCase().includes(query) ||
                item.estado?.toLowerCase().includes(query)
            )
        })
    }, [recentActivity, searchQuery])

    const currentMunicipalities = useMemo(() => {
        if (selectedDept === 'Todos') return []
        return MUNICIPALITY_DATA[selectedDept] || [
            { name: `${selectedDept} Capital`, reports: 0, seats: 100, recintos: 200 },
        ]
    }, [selectedDept])

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Control Bar - Fixed Search Issues */}
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-[#0F1420]/80 p-5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl relative z-40">
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                    <div className="relative">
                        <button
                            onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                            type="button"
                            className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-xs font-black hover:bg-white/10 hover:border-primary/50 transition-all min-w-[200px] justify-between shadow-xl"
                        >
                            <span className="flex items-center gap-2">
                                <div className="p-1 bg-primary/20 rounded-md">
                                    <MapPin size={12} className="text-primary" />
                                </div>
                                {selectedDept}
                            </span>
                            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-300 ${showDeptDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDeptDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDeptDropdown(false)} />
                                <div className="absolute top-full left-0 mt-3 w-64 bg-[#161B2A] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3 z-50 max-h-80 overflow-y-auto backdrop-blur-3xl animate-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => { setSelectedDept('Todos'); setShowDeptDropdown(false); }}
                                        className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between ${selectedDept === 'Todos' ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                                    >
                                        <span>Todos los Departamentos</span>
                                        {selectedDept === 'Todos' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </button>
                                    <div className="h-px bg-white/5 my-2 mx-5" />
                                    {DEPARTMENT_DATA.map(d => (
                                        <button
                                            key={d.name}
                                            onClick={() => { setSelectedDept(d.name); setShowDeptDropdown(false); }}
                                            className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between ${selectedDept === d.name ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                                        >
                                            {d.name}
                                            {selectedDept === d.name && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                        {['Hoy', 'Semana'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === range ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto relative z-50">
                    <div className="relative flex-grow xl:w-[400px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowDeptDropdown(false)}
                            placeholder="Buscar recinto, observador o estado..."
                            className="bg-white/5 border border-white/20 pl-12 pr-4 py-3.5 rounded-2xl text-sm w-full focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all shadow-2xl placeholder:text-muted-foreground/40 font-bold text-white"
                        />
                    </div>
                </div>
            </div>

            {/* ERROR/ALERT: Missing Data Explanation */}
            {offlineReports.length > 0 && (
                <div className="bg-accent/10 border border-accent/30 p-5 rounded-3xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/20 rounded-2xl">
                            <Database size={24} className="text-accent" />
                        </div>
                        <div>
                            <p className="font-black text-white text-sm uppercase tracking-wider">Registros Pendientes de Sincronía</p>
                            <p className="text-xs text-muted-foreground">Hay <strong>{offlineReports.length}</strong> reportes guardados en este dispositivo que aún no se han enviado al servidor.</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        <RefreshCw size={14} /> Sincronizar Ahora
                    </button>
                </div>
            )}

            {summary?.total_reportes === 0 && offlineReports.length === 0 && !loadingOffline && (
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-1 flex-grow">
                        <p className="font-black text-white uppercase tracking-[0.1em]">¿No ves tus reportes?</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Asegúrate de haber seleccionado un <strong>Recinto Real</strong>. Los recintos marcados como (DEMO) no guardan datos en el servidor.
                            También verifica que tu cuenta tenga un <strong>Departamento Asignado</strong> en el panel de Administración.
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        Solicitar Soporte
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reportes', val: summary?.total_reportes || 0, icon: FileText, color: 'primary', trend: '+0%', isUp: true },
                    { label: 'Incidencias', val: summary?.alertas_criticas || 0, icon: ShieldAlert, color: 'accent', trend: 'Sin Alertas', isUp: true },
                    { label: 'Recintos', val: summary?.total_recintos || 0, icon: Map, color: 'success', trend: '85% Cobertura', isUp: true },
                    { label: 'Voluntarios', val: summary?.total_observadores || 0, icon: Users, color: 'blue-500', trend: 'Activos', isUp: true },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[#0F1420]/60 border border-white/5 p-6 rounded-3xl flex flex-col justify-between h-40 group hover:border-white/20 transition-all relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-10 transition-all -rotate-6 group-hover:rotate-0">
                            <kpi.icon size={80} className={`text-${kpi.color}`} />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                                <h3 className="text-4xl font-black tabular-nums tracking-tighter text-white">{kpi.val}</h3>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-auto relative z-10">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${kpi.val > 0 ? 'text-success border-success/20 bg-success/10' : 'text-muted-foreground border-white/5 bg-white/5'}`}>
                                {kpi.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reports Monitor */}
                <div className="bg-[#0F1420]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                <BarChart3 size={18} className="text-primary" />
                                Monitor Territorial
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold opacity-60">CARGA DE DATOS NACIONAL</p>
                        </div>
                        <TrendingUp size={18} className="text-success" />
                    </div>

                    <div className="space-y-6">
                        {filteredReportsData.map((d) => (
                            <div key={d.name} className="group/bar">
                                <div className="flex justify-between text-[11px] font-bold mb-2 uppercase tracking-widest">
                                    <span className="text-muted-foreground group-hover/bar:text-white transition-colors">{d.name}</span>
                                    <span className="text-white">{d.reports} <span className="text-[9px] opacity-40">REPS</span></span>
                                </div>
                                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner flex ring-1 ring-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary/60 to-primary group-hover/bar:from-primary group-hover/bar:to-blue-400 transition-all duration-700"
                                        style={{ width: `${(d.reports / 150) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Geography Infrastructure */}
                <div className="bg-[#0F1420]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                <Map size={18} className="text-accent" />
                                Infraestructura
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold opacity-60">DISTRIBUCIÓN DE ASIENTOS Y RECINTOS</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-accent">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                <span>ASIEN</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-success">
                                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                <span>RECIN</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {filteredReportsData.map((d) => (
                            <div key={d.name} className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-white/60">{d.name}</span>
                                    <div className="flex gap-4">
                                        <span className="text-accent">{d.seats}</span>
                                        <span className="text-success">{d.recintos}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent/30 group-hover:bg-accent/60 transition-all duration-700" style={{ width: `${(d.seats / 500) * 100}%` }} />
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-success/30 group-hover:bg-success/60 transition-all duration-700" style={{ width: `${(d.recintos / 1300) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* LIVE DATA TABLE */}
            <div className="bg-[#0F1420]/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <RefreshCw size={24} className="text-blue-400 animate-spin-slow" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">Transmisión en Vivo</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-60">
                                {filteredActivity.length} REGISTROS ACTIVOS
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] border-b border-white/5">
                                <th className="px-8 py-6">Sincronía</th>
                                <th className="px-8 py-6">Usuario / Jurisdicción</th>
                                <th className="px-8 py-6">Asiento / Recinto</th>
                                <th className="px-8 py-6 text-center">Tipo Reporte</th>
                                <th className="px-8 py-6 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredActivity.length > 0 ? (
                                filteredActivity.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-primary">
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                    {new Date(row.fecha_captura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Hoy</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xs ring-1 ring-white/10 text-primary uppercase shadow-lg">
                                                    {row.user_name?.[0] || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{row.user_name}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">OBSERVADOR</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base text-white/80">{row.recinto_name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">DISTRITO NACIONAL</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 text-center">
                                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${row.tipo_reporte === 'incidencia'
                                                    ? 'bg-accent/10 border-accent/40 text-accent shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                                                    : 'bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                                }`}>
                                                {row.tipo_reporte}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${row.estado === 'validado' ? 'text-success' : 'text-orange-500'}`}>
                                                    {row.estado}
                                                </span>
                                                <div className={`w-3 h-3 rounded-full ${row.estado === 'validado' ? 'bg-success shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.6)]'}`} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-5 opacity-20">
                                            <SearchX size={80} className="text-muted-foreground" />
                                            <p className="text-2xl font-black tracking-widest uppercase">Sin resultados</p>
                                            {searchQuery && <p className="text-sm font-bold">"{searchQuery}" no coincide con ningún registro</p>}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="h-20" />
        </div>
    )
}
