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
    ArrowUpRight,
    ArrowDownRight,
    SearchX,
    Database,
    Loader2,
    Activity,
    Map as TerritoryIcon
} from 'lucide-react'
import { getPendingReports } from '@/utils/offline-db'

// Mock Data for Infrastructure (Fallback if DB is empty)
const DEFAULT_DEPT_DATA = [
    { dept_name: 'La Paz', reports_count: 0, online_count: 0, total_recintos: 1200 },
    { dept_name: 'Santa Cruz', reports_count: 0, online_count: 0, total_recintos: 1100 },
    { dept_name: 'Cochabamba', reports_count: 0, online_count: 0, total_recintos: 950 },
    { dept_name: 'Oruro', reports_count: 0, online_count: 0, total_recintos: 450 },
    { dept_name: 'Potosí', reports_count: 0, online_count: 0, total_recintos: 520 },
    { dept_name: 'Tarija', reports_count: 0, online_count: 0, total_recintos: 410 },
    { dept_name: 'Chuquisaca', reports_count: 0, online_count: 0, total_recintos: 480 },
    { dept_name: 'Beni', reports_count: 0, online_count: 0, total_recintos: 320 },
    { dept_name: 'Pando', reports_count: 0, online_count: 0, total_recintos: 120 },
]

export default function ManagementView({
    summary,
    recentActivity,
    deptStats = []
}: {
    summary: any,
    recentActivity: any[],
    deptStats?: any[]
}) {
    const [selectedDept, setSelectedDept] = useState('Todos')
    const [searchQuery, setSearchQuery] = useState('')
    const [showDeptDropdown, setShowDeptDropdown] = useState(false)
    const [timeRange, setTimeRange] = useState('Hoy')
    const [offlineReports, setOfflineReports] = useState<any[]>([])
    const [loadingOffline, setLoadingOffline] = useState(true)

    // Merge DB Stats with Default list to ensure all depts are shown
    const normalizedDeptData = useMemo(() => {
        const statsMap = new Map(deptStats.map(s => [s.dept_name, s]))
        return DEFAULT_DEPT_DATA.map(d => {
            const live = statsMap.get(d.dept_name)
            return {
                name: d.dept_name,
                reports: Number(live?.reports_count || d.reports_count),
                online: Number(live?.online_count || d.online_count),
                recintos: Number(live?.total_recintos || d.total_recintos),
                // Mock seats for now as they aren't in the RPC yet
                seats: Math.round(Number(live?.total_recintos || d.total_recintos) * 0.4)
            }
        })
    }, [deptStats])

    // Load Offline Data
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
        const interval = setInterval(loadOffline, 10000)
        return () => clearInterval(interval)
    }, [])

    // Filter Logic
    const filteredReportsData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        let data = normalizedDeptData

        if (selectedDept !== 'Todos') {
            data = data.filter(d => d.name === selectedDept)
        }

        if (query) {
            // If searching, also check if departments match the name
            return data.filter(d => d.name.toLowerCase().includes(query))
        }

        return data
    }, [selectedDept, normalizedDeptData, searchQuery])

    const filteredActivity = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        return recentActivity.filter(item => {
            if (!query) return true
            const searchStr = `${item.user_name} ${item.recinto_name} ${item.tipo_reporte} ${item.estado}`.toLowerCase()
            return searchStr.includes(query)
        })
    }, [recentActivity, searchQuery])

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Control Bar */}
            <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-[#0F1420]/80 p-5 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl relative z-40">
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                    <div className="relative">
                        <button
                            onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                            type="button"
                            className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-xs font-black hover:bg-white/10 hover:border-primary/50 transition-all min-w-[200px] justify-between shadow-xl text-white"
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
                                    {DEFAULT_DEPT_DATA.map(d => (
                                        <button
                                            key={d.dept_name}
                                            onClick={() => { setSelectedDept(d.dept_name); setShowDeptDropdown(false); }}
                                            className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between ${selectedDept === d.dept_name ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}
                                        >
                                            {d.dept_name}
                                            {selectedDept === d.dept_name && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
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

            {/* Jurisdictional Warnings */}
            {summary?.is_fallback && (
                <div className="bg-primary/10 border border-primary/30 p-5 rounded-3xl flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-2xl">
                        <MapPin size={24} className="text-primary" />
                    </div>
                    <div>
                        <p className="font-black text-white text-sm uppercase tracking-wider">Modo de Vista Global (Admin)</p>
                        <p className="text-xs text-muted-foreground">Tu cuenta no tiene un departamento asignado, por lo que visualizas las estadísticas nacionales.</p>
                    </div>
                </div>
            )}

            {/* Offline reports banner */}
            {offlineReports.length > 0 && (
                <div className="bg-accent/10 border border-accent/30 p-5 rounded-3xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/20 rounded-2xl">
                            <Database size={24} className="text-accent" />
                        </div>
                        <div>
                            <p className="font-black text-white text-sm uppercase tracking-wider">Sincronización Pendiente</p>
                            <p className="text-xs text-muted-foreground">Tienes <strong>{offlineReports.length}</strong> reportes en este dispositivo que aún no se han subido.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reportes', val: summary?.total_reportes || 0, icon: FileText, color: 'primary', trend: '+0%', isUp: true },
                    { label: 'Incidencias', val: summary?.alertas_criticas || 0, icon: ShieldAlert, color: 'accent', trend: 'Sin Alertas', isUp: true },
                    { label: 'Recintos', val: summary?.total_recintos || 0, icon: TerritoryIcon, color: 'success', trend: '85% Cobertura', isUp: true },
                    { label: 'En Línea', val: summary?.observadores_online || 0, icon: Activity, color: 'blue-500', trend: 'Tiempo Real', isUp: true },
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
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold opacity-60">CARGA DE DATOS POR DEPARTAMENTO</p>
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
                                        style={{ width: `${Math.min(100, (d.reports / 50) * 100 + 1)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Presence & Capacity Monitor */}
                <div className="bg-[#0F1420]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                <Users size={18} className="text-blue-400" />
                                Estado de Conexión
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold opacity-60">OBSERVADORES EN LÍNEA POR REGIÓN</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span>ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {filteredReportsData.map((d) => (
                            <div key={d.name} className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-white/60">{d.name}</span>
                                    <span className="text-blue-400 font-bold">{d.online} CONECTADOS</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (d.online / 100) * 100)}%` }}
                                    />
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
                            <h4 className="text-xl font-black text-white uppercase tracking-widest">Transmisión de Campo</h4>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black opacity-60">
                                {filteredActivity.length} ACTIVIDADES RECIENTES
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] border-b border-white/5">
                                <th className="px-8 py-6">Hora</th>
                                <th className="px-8 py-6">Observador</th>
                                <th className="px-8 py-6">Recinto</th>
                                <th className="px-8 py-6 text-center">Tipo</th>
                                <th className="px-8 py-6 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredActivity.length > 0 ? (
                                filteredActivity.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-all group border-l-4 border-transparent hover:border-primary">
                                        <td className="px-8 py-7">
                                            <span className="font-mono text-sm font-bold text-white">
                                                {new Date(row.fecha_envio || row.fecha_captura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                    {row.user_name?.[0] || 'U'}
                                                </div>
                                                <span className="font-black text-sm text-foreground">{row.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className="font-bold text-sm text-white/80">{row.recinto_name}</span>
                                        </td>
                                        <td className="px-8 py-7 text-center">
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${row.tipo_reporte === 'incidencia' ? 'border-accent/40 text-accent bg-accent/5' : 'border-primary/40 text-primary bg-primary/5'
                                                }`}>
                                                {row.tipo_reporte}
                                            </span>
                                        </td>
                                        <td className="px-8 py-7 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className={`w-2 h-2 rounded-full ${row.estado === 'validado' ? 'bg-success' : 'bg-orange-500 animate-pulse'}`} />
                                                <span className="text-[10px] font-black uppercase text-white/60">{row.estado}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-5 opacity-20">
                                            <SearchX size={80} className="text-muted-foreground" />
                                            <p className="text-xl font-black tracking-widest uppercase">Sin reportes registrados</p>
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
