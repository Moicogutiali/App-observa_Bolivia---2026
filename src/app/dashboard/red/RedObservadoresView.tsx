'use client'

import React, { useState, useMemo } from 'react'
import {
    Users,
    Search,
    UserPlus,
    Filter,
    ChevronDown,
    MoreHorizontal,
    Mail,
    Phone,
    MapPin,
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    AlertCircle,
    Send
} from 'lucide-react'
import Link from 'next/link'
import { inviteUser, deleteUser } from './actions'

interface UserNetwork {
    id: string
    nombre: string
    email: string
    rol: string
    ci: string
    telefono: string
    ubicacion_nombre: string
    last_seen_at: string
    created_at: string
}

interface Location {
    id: string
    nombre: string
    nivel: string
}

export default function RedObservadoresView({
    users,
    managerRole,
    managerLocation,
    locations = []
}: {
    users: UserNetwork[],
    managerRole: string,
    managerLocation?: string,
    locations: Location[]
}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRole, setSelectedRole] = useState('Todos')
    const [isInviting, setIsInviting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const filteredUsers = useMemo(() => {
        console.log('RedObservadoresView: Total users received:', users.length);
        console.log('RedObservadoresView: First user sample:', users[0]);

        return users.filter(u => {
            const query = searchQuery.toLowerCase().trim()
            if (!query && selectedRole === 'Todos') return true

            const matchesSearch =
                !query ||
                (u.nombre || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query) ||
                (u.ci || '').toLowerCase().includes(query) ||
                (u.id || '').toLowerCase().includes(query)

            // If there's a search query, we search in ALL roles to avoid confusion
            const matchesRole = (query.length > 0) || selectedRole === 'Todos' ||
                (u.rol || '').toLowerCase() === selectedRole.toLowerCase()

            return matchesSearch && matchesRole
        })
    }, [users, searchQuery, selectedRole])

    const canCreateRole = useMemo(() => {
        const role = managerRole.toLowerCase()
        if (role === 'admin') return ['coordinador', 'supervisor', 'observador']
        if (role === 'coordinador') return ['supervisor', 'observador']
        if (role === 'supervisor') return ['observador']
        return []
    }, [managerRole])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await inviteUser(formData)

        if (result.error) {
            setError(result.error)
            setIsSubmitting(false)
        } else {
            setSuccess(true)
            setIsSubmitting(false)
            // Reset after 3 seconds
            setTimeout(() => {
                setIsInviting(false)
                setSuccess(false)
            }, 3000)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
                        <Users size={14} />
                        <span>Gestión de Talento</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Red de Observadores</h1>
                    <p className="text-muted-foreground text-sm max-w-md font-medium">
                        Control de mando para la administración de la jerarquía territorial de monitoreo.
                    </p>
                </div>

                {canCreateRole.length > 0 && (
                    <button
                        onClick={() => { setIsInviting(true); setSuccess(false); setError(null); }}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <UserPlus size={18} />
                        <span>INVITAR INTEGRANTE</span>
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-[#0F1420]/80 p-4 rounded-3xl border border-white/10 flex flex-col xl:flex-row gap-4 backdrop-blur-3xl shadow-2xl items-center">
                <div className="relative flex-grow w-full">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, CI o correo..."
                        className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-white placeholder:text-muted-foreground/40"
                    />
                </div>

                <div className="flex gap-4 w-full xl:w-auto">
                    <div className="relative flex-grow xl:flex-grow-0">
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full xl:w-[200px] bg-white/5 border border-white/10 pl-6 pr-12 py-4 rounded-2xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer hover:bg-white/10 transition-all"
                        >
                            <option value="Todos" className="bg-[#111625]">Todos los Roles</option>
                            <option value="Coordinador" className="bg-[#111625]">Coordinadores</option>
                            <option value="Supervisor" className="bg-[#111625]">Supervisores</option>
                            <option value="Observador" className="bg-[#111625]">Observadores</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>

                    <button className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center">
                        <Filter size={18} className="text-white" />
                    </button>
                </div>
            </div>

            {/* Password Setup Notice */}
            <div className="bg-primary/10 border border-primary/20 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-primary animate-in slide-in-from-top duration-500 backdrop-blur-sm shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                        <Shield size={20} className="text-primary" />
                    </div>
                    <span className="leading-tight">Los integrantes invitados reciben un enlace de acceso directo. Deben configurar su contraseña en su perfil para ingresos futuros.</span>
                </div>
                <Link
                    href="/dashboard/configurar-perfil"
                    className="bg-primary/20 hover:bg-primary/30 text-primary px-5 py-2.5 rounded-xl transition-all uppercase tracking-widest font-black text-[10px] whitespace-nowrap"
                >
                    Configurar mi cuenta
                </Link>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="group bg-[#0F1420]/40 border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 relative overflow-hidden shadow-xl">
                            {/* Role Badge */}
                            <div className="absolute top-6 right-6">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${user.rol?.toLowerCase() === 'admin' ? 'bg-danger/10 text-danger border-danger/20' :
                                    user.rol?.toLowerCase() === 'coordinador' ? 'bg-primary/10 text-primary border-primary/20' :
                                        user.rol?.toLowerCase() === 'supervisor' ? 'bg-accent/10 text-accent border-accent/20' :
                                            'bg-success/10 text-success border-success/20'
                                    }`}>
                                    {user.rol || 'observador'}
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-black text-xl text-primary ring-1 ring-white/10 shadow-lg group-hover:scale-110 transition-transform">
                                        {(user.nombre?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-white text-lg group-hover:text-primary transition-colors truncate">{user.nombre}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.last_seen_at && new Date(user.last_seen_at).getTime() > Date.now() - 15 * 60000 ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">ID: {user.id?.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                            <Mail size={14} className="text-primary/60" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Email</p>
                                            <p className="text-xs text-white/80 font-medium truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                            <MapPin size={14} className="text-accent/60" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Jurisdicción</p>
                                            <p className="text-xs text-white/80 font-medium truncate">{user.ubicacion_nombre || 'No asignada'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                            <Clock size={14} className="text-success/60" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Actividad</p>
                                            <p className="text-xs text-white/80 font-medium truncate">
                                                {user.last_seen_at ? `Hace ${Math.round((Date.now() - new Date(user.last_seen_at).getTime()) / 60000)} min` : 'Sin actividad'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex gap-2">
                                    <button className="flex-grow bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-white">
                                        Ver Expediente
                                    </button>
                                    {(managerRole === 'admin' || managerRole === 'coordinador') && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(`¿Estás seguro de que deseas eliminar a ${user.nombre}? Esta acción borrará su acceso y su perfil.`)) {
                                                    const res = await deleteUser(user.id);
                                                    if (res?.error) alert(res.error);
                                                }
                                            }}
                                            className="px-4 bg-danger/5 hover:bg-danger/10 text-danger/60 hover:text-danger py-3 rounded-xl transition-colors"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center space-y-6">
                        <Users size={80} className="mx-auto text-muted-foreground/20" />
                        <div className="space-y-2">
                            <p className="text-2xl font-black uppercase tracking-[0.2em] text-white/40">
                                {users.length === 0 ? 'Sin Conexión con la Base' : 'Sin Coincidencias'}
                            </p>
                            <p className="text-sm font-medium text-muted-foreground/60 max-w-md mx-auto">
                                {users.length === 0
                                    ? 'No se han podido cargar los integrantes de la red. Verifica tus permisos o la conexión.'
                                    : `No hay registros que coincidan con "${searchQuery}" en la categoría ${selectedRole}. Prueba seleccionando "Todos los Roles".`}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedRole('Todos'); }}
                                    className="mt-4 px-6 py-2 bg-primary/20 text-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary/30 transition-all"
                                >
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal - Fully Functional */}
            {isInviting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-[#111625] border border-white/10 w-full max-w-xl rounded-[3rem] p-10 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">

                        {/* Status Message */}
                        {success && (
                            <div className="absolute inset-0 bg-[#111625] z-50 flex flex-col items-center justify-center text-center p-10 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-success mb-6 shadow-2xl shadow-success/20">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-3xl font-black text-white tracking-tight mb-2">¡Invitación Enviada!</h2>
                                <p className="text-muted-foreground max-w-xs mx-auto">Se han generado las credenciales y enviado al correo electrónico del nuevo integrante.</p>
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-white tracking-tighter">Nueva Alta</h2>
                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Protocolo de Integración Territorial</p>
                            </div>
                            <button onClick={() => setIsInviting(false)} className="p-3 hover:bg-white/5 rounded-full transition-colors text-muted-foreground">
                                <XCircle size={28} />
                            </button>
                        </div>

                        {error && (
                            <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl flex items-center gap-3 text-danger text-xs font-bold animate-pulse">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Rol Operativo</label>
                                    <select name="rol" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-black text-white outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                        {canCreateRole.map(role => (
                                            <option key={role} value={role} className="bg-[#111625]">{role.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Jurisdicción</label>
                                    <select name="ubicacion_id" required className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-black text-white outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                        <option value="" className="bg-[#111625]">Seleccionar...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id} className="bg-[#111625]">
                                                {loc.nombre} ({loc.nivel.slice(0, 3).toUpperCase()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Identidad (Nombre y CI)</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <input
                                            name="nombre"
                                            type="text"
                                            required
                                            placeholder="Nombre Completo"
                                            className="col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                        />
                                        <input
                                            name="ci"
                                            type="text"
                                            required
                                            placeholder="C.I."
                                            className="bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Comunicaciones (Email y Telf)</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="correo@ejemplo.com"
                                            className="col-span-2 bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                        />
                                        <input
                                            name="telefono"
                                            type="tel"
                                            placeholder="Celular"
                                            className="bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span className="text-base tracking-tight">FORMALIZAR INTEGRACIÓN</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
