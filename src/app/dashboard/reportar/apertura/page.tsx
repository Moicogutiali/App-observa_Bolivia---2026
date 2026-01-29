'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    MapPin,
    Save,
    Wifi,
    WifiOff,
    RotateCcw,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { saveReportOffline } from '@/utils/offline-db'

export default function AperturaPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [online, setOnline] = useState(true)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [recintos, setRecintos] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        recinto_id: '',
        mesas_habilitadas: '',
        mesas_abiertas: '',
        hay_material: 'true',
        hay_jurados: 'true',
        novedades: ''
    })

    useEffect(() => {
        setOnline(navigator.onLine)
        const handleOnline = () => setOnline(true)
        const handleOffline = () => setOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Fetch mock recintos (in a real app, this would be from Supabase)
        const fetchRecintos = async () => {
            const { data } = await supabase.from('recintos')
                .select('*')
                .order('nombre', { ascending: true })

            if (data && data.length > 0) {
                setRecintos(data)
            } else {
                setRecintos([
                    { id: 'mock-1', nombre: 'Recinto de Prueba (Cargar SQL)' }
                ])
            }
        }
        fetchRecintos()

        // Get GPS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.log('GPS access skipped')
            )
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const reportPayload = {
            observador_id: user.id,
            recinto_id: formData.recinto_id,
            tipo_reporte: 'apertura' as const,
            fecha_captura: new Date().toISOString(),
            datos_formulario: formData,
            location: location ? { latitude: location.lat, longitude: location.lng } : undefined
        }

        try {
            if (online) {
                const { error } = await supabase.from('reportes').insert([{
                    observador_id: reportPayload.observador_id,
                    recinto_id: reportPayload.recinto_id,
                    tipo_reporte: 'apertura',
                    fecha_captura: reportPayload.fecha_captura,
                    datos_formulario: reportPayload.datos_formulario,
                    estado: 'pendiente'
                }])

                if (error) throw error
                alert('Reporte enviado exitosamente en línea.')
            } else {
                await saveReportOffline(reportPayload)
                alert('Sin conexión. El reporte se guardó localmente y se sincronizará automáticamente al recuperar señal.')
            }
            router.push('/dashboard')
        } catch (err: any) {
            console.error('Submit error:', err)
            // If the error is about a missing foreign key (like using mock IDs), explain it
            const errorMessage = err.message || 'Error desconocido'
            const isFKError = errorMessage.includes('violates foreign key constraint')

            if (isFKError) {
                alert(`Error de Integridad: El recinto seleccionado es de "prueba" y no existe en la base de datos real. Por favor, crea recintos reales en Supabase o usa datos válidos.\n\nDetalle: ${errorMessage}`)
            } else {
                alert(`Error al enviar: ${errorMessage}. El reporte se ha guardado de forma segura en el dispositivo para sincronización posterior.`)
            }

            await saveReportOffline(reportPayload)
            router.push('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="glass sticky top-0 z-50 p-4 flex items-center justify-between border-b border-border/50">
                <button onClick={() => router.back()} className="p-2 hover:bg-foreground/5 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold tracking-tight">Reporte de Apertura</h1>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${online ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
                    {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span>{online ? 'En Línea' : 'Offline'}</span>
                </div>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-8">
                {/* Progress Card */}
                <div className="glass p-6 rounded-3xl space-y-4 border-l-4 border-primary">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold flex items-center space-x-2">
                            <MapPin className="text-primary" size={20} />
                            <span>Verificación de Ubicación</span>
                        </h2>
                        {location ? (
                            <CheckCircle2 className="text-success" size={24} />
                        ) : (
                            <RotateCcw className="text-accent animate-spin" size={20} />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {location
                            ? `Coordenadas capturadas: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                            : 'Capturando señal satelital...'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    <div className="space-y-4">
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Detalles del Recinto</label>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-semibold">Seleccionar Recinto</span>
                                {recintos.some(r => r.id.toString().includes('mock')) && (
                                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center space-x-1">
                                        <AlertTriangle size={10} />
                                        <span>MODO PRUEBA</span>
                                    </span>
                                )}
                            </div>
                            <select
                                required
                                className={`w-full bg-background border rounded-2xl p-4 outline-none focus:ring-2 appearance-none transition-all ${formData.recinto_id.toString().includes('mock') ? 'border-accent/50 focus:ring-accent' : 'border-border focus:ring-primary'}`}
                                value={formData.recinto_id}
                                onChange={(e) => setFormData({ ...formData, recinto_id: e.target.value })}
                            >
                                <option value="">Seleccione un recinto...</option>
                                {recintos.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre} {r.id.toString().includes('mock') ? '(DEMO)' : ''}</option>
                                ))}
                            </select>
                            {formData.recinto_id.toString().includes('mock') && (
                                <p className="text-[10px] text-accent font-medium px-1">
                                    Aviso: Los datos demo no se guardarán en la base de datos central.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-xs font-semibold px-1">Mesas Habilitadas</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.mesas_habilitadas}
                                    onChange={(e) => setFormData({ ...formData, mesas_habilitadas: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-semibold px-1">Mesas Abiertas</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.mesas_abiertas}
                                    onChange={(e) => setFormData({ ...formData, mesas_abiertas: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between p-4 glass rounded-2xl border border-border/50">
                                <span className="text-sm font-medium">¿Llegó todo el material electoral?</span>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hay_material: 'true' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.hay_material === 'true' ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5'}`}
                                    >SÍ</button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hay_material: 'false' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.hay_material === 'false' ? 'bg-danger text-white shadow-lg' : 'bg-foreground/5'}`}
                                    >NO</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 glass rounded-2xl border border-border/50">
                                <span className="text-sm font-medium">¿Están presentes los jurados?</span>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hay_jurados: 'true' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.hay_jurados === 'true' ? 'bg-primary text-white shadow-lg' : 'bg-foreground/5'}`}
                                    >SÍ</button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hay_jurados: 'false' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.hay_jurados === 'false' ? 'bg-danger text-white shadow-lg' : 'bg-foreground/5'}`}
                                    >NO</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <span className="text-xs font-semibold px-1">Novedades / Observaciones</span>
                            <textarea
                                className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                                placeholder="Describa cualquier incidencia relevante..."
                                value={formData.novedades}
                                onChange={(e) => setFormData({ ...formData, novedades: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-foreground text-background font-bold py-5 rounded-3xl shadow-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Enviar Reporte de Apertura</span>
                            </>
                        )}
                    </button>
                </form>
            </main>

            {/* Offline Alert Sticky */}
            {!online && (
                <div className="fixed bottom-4 left-6 right-6 glass border-l-4 border-accent p-4 rounded-2xl shadow-2xl flex items-center space-x-4 animate-bounce">
                    <AlertTriangle className="text-accent" size={24} />
                    <div className="text-xs">
                        <p className="font-bold">Modo Offline Activo</p>
                        <p className="text-muted-foreground">Tu reporte se guardará localmente.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
