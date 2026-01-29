'use client'

import React, { useState } from 'react'
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
    Map
} from 'lucide-react'

// Mock Data for Departments
const DEPARTMENT_DATA = [
    { name: 'La Paz', reports: 120, alerts: 12, coverage: 85 },
    { name: 'Santa Cruz', reports: 145, alerts: 5, coverage: 92 },
    { name: 'Cochabamba', reports: 98, alerts: 8, coverage: 78 },
    { name: 'Oruro', reports: 45, alerts: 2, coverage: 65 },
    { name: 'Potosí', reports: 32, alerts: 1, coverage: 60 },
    { name: 'Tarija', reports: 56, alerts: 3, coverage: 88 },
    { name: 'Chuquisaca', reports: 41, alerts: 0, coverage: 82 },
    { name: 'Beni', reports: 28, alerts: 4, coverage: 55 },
    { name: 'Pando', reports: 12, alerts: 1, coverage: 40 },
]

export default function ManagementView({ summary, recentActivity }: { summary: any, recentActivity: any[] }) {
    const [selectedDept, setSelectedDept] = useState('Todos')
    const [timeRange, setTimeRange] = useState('Hoy')

    const filteredData = selectedDept === 'Todos'
        ? DEPARTMENT_DATA
        : DEPARTMENT_DATA.filter(d => d.name === selectedDept)

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <div className="relative group">
                        <button className="flex items-center space-x-2 bg-[#0F1420] border border-white/10 px-4 py-2 rounded-lg text-xs font-semibold hover:border-primary/50 transition-all min-w-[140px] justify-between">
                            <span className="flex items-center gap-2"><MapPin size={14} className="text-muted-foreground" /> {selectedDept}</span>
                            <ChevronDown size={14} className="text-muted-foreground" />
                        </button>
                        {/* Dropdown Mock */}
                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#0F1420] border border-white/10 rounded-lg shadow-xl py-2 hidden group-hover:block z-50 max-h-60 overflow-y-auto">
                            <button onClick={() => setSelectedDept('Todos')} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-muted-foreground hover:text-white">Todos</button>
                            {DEPARTMENT_DATA.map(d => (
                                <button key={d.name} onClick={() => setSelectedDept(d.name)} className="w-full text-left px-4 py-2 text-xs hover:bg-white/5 text-muted-foreground hover:text-white">{d.name}</button>
                            ))}
                        </div>
                    </div>

                    <button className="flex items-center space-x-2 bg-[#0F1420] border border-white/10 px-4 py-2 rounded-lg text-xs font-semibold hover:border-primary/50 transition-all">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span>{timeRange}</span>
                    </button>

                    <button className="flex items-center space-x-2 bg-[#0F1420] border border-white/10 px-4 py-2 rounded-lg text-xs font-semibold hover:border-primary/50 transition-all">
                        <Filter size={14} className="text-muted-foreground" />
                        <span>Filtros</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar recinto o usuario..."
                            className="bg-[#0F1420] border border-white/10 pl-9 pr-4 py-2 rounded-lg text-xs w-full focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>
                    <button className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all">
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* KPI Cards - Professional Dense */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0F1420]/60 border border-white/5 p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all"><FileText size={64} /></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reportes Totales</p>
                            <h3 className="text-2xl font-bold mt-1 tabular-nums">{summary?.total_reportes || 0}</h3>
                        </div>
                        <span className="text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <TrendingUp size={10} /> +12%
                        </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                        <div className="bg-primary h-full w-[65%]" />
                    </div>
                </div>

                <div className="bg-[#0F1420]/60 border border-white/5 p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-accent/20 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all"><ShieldAlert size={64} className="text-accent" /></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Incidencias</p>
                            <h3 className="text-2xl font-bold mt-1 tabular-nums text-white">{summary?.alertas_criticas || 0}</h3>
                        </div>
                        <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            {summary?.alertas_criticas > 0 ? 'Atención' : 'Normal'}
                        </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                        <div className="bg-accent h-full w-[15%]" />
                    </div>
                </div>

                <div className="bg-[#0F1420]/60 border border-white/5 p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-success/20 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all"><Map size={64} className="text-success" /></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cobertura</p>
                            <h3 className="text-2xl font-bold mt-1 tabular-nums">85.4%</h3>
                        </div>
                        <span className="text-[10px] text-white/50 px-1.5 py-0.5 rounded">
                            {summary?.total_recintos || 0} Recintos
                        </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                        <div className="bg-success h-full w-[85%]" />
                    </div>
                </div>

                <div className="bg-[#0F1420]/60 border border-white/5 p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-blue-500/20 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-all"><Users size={64} className="text-blue-500" /></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Voluntarios</p>
                            <h3 className="text-2xl font-bold mt-1 tabular-nums">{summary?.total_observadores || 0}</h3>
                        </div>
                        <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Users size={10} /> Activos
                        </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-full w-[45%]" />
                    </div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-[#0F1420]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" />
                            Reportes por Departamento
                        </h4>
                        <button className="p-1 hover:bg-white/5 rounded"><MoreHorizontal size={16} className="text-muted-foreground" /></button>
                    </div>

                    {/* CSS Bar Chart */}
                    <div className="space-y-4">
                        {filteredData.map((dept) => (
                            <div key={dept.name} className="group">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="font-semibold text-muted-foreground group-hover:text-white transition-colors">{dept.name}</span>
                                    <span className="text-white/60">{dept.reports} reportes</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                        className="h-full bg-primary/80 group-hover:bg-primary transition-all rounded-full"
                                        style={{ width: `${(dept.reports / 150) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Alerts / Quick List */}
                <div className="bg-[#0F1420]/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldAlert size={16} className="text-accent" />
                            Alertas Recientes
                        </h4>
                        <button className="text-[10px] text-primary hover:underline">Ver todas</button>
                    </div>

                    <div className="flex-grow space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {/* Mock Alerts if generic activity doesn't have alerts */}
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">CRÍTICO</span>
                                    <span className="text-[9px] text-muted-foreground">Hace {i * 15 + 5} min</span>
                                </div>
                                <p className="text-xs font-semibold text-white/90 mb-1">Retraso en apertura de mesa #40{i}</p>
                                <p className="text-[10px] text-muted-foreground">Recinto: Colegio San Simón - LP</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Activity Table */}
            <div className="bg-[#0F1420]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <RefreshCw size={16} className="text-blue-400" />
                        Transmisión de Datos en Vivo
                    </h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Hora</th>
                                <th className="px-6 py-3">Usuario Rep.</th>
                                <th className="px-6 py-3">Ubicación</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentActivity.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-3 font-mono text-muted-foreground">
                                        {new Date(item.fecha_captura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-white">{item.user_name}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{item.recinto_name}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${item.tipo_reporte === 'incidencia'
                                            ? 'border-red-500/20 text-red-500 bg-red-500/10'
                                            : 'border-blue-500/20 text-blue-500 bg-blue-500/10'
                                            }`}>
                                            {item.tipo_reporte}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${item.estado === 'validado' ? 'bg-success' : 'bg-orange-500 animate-pulse'}`} />
                                            <span className="text-[10px] text-muted-foreground capitalize">{item.estado}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
