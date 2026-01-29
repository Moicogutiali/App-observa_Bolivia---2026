'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    MapPin,
    Camera,
    AlertTriangle,
    Save,
    Wifi,
    WifiOff,
    X,
    CheckCircle2,
    UploadCloud
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { saveReportOffline } from '@/utils/offline-db'

export default function IncidenciaPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [online, setOnline] = useState(true)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [recintos, setRecintos] = useState<any[]>([])
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        recinto_id: '',
        categoria: 'otros',
        severidad: 'media',
        descripcion: ''
    })

    useEffect(() => {
        setOnline(navigator.onLine)
        const handleOnline = () => setOnline(true)
        const handleOffline = () => setOnline(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        const fetchRecintos = async () => {
            const { data } = await supabase.from('recintos')
                .select('*')
                .order('nombre', { ascending: true })
            if (data && data.length > 0) setRecintos(data)
            else setRecintos([{ id: 'mock-1', nombre: 'Recinto de Prueba (Cargar SQL)' }])
        }
        fetchRecintos()

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.log('Location access not available/denied')
            )
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [supabase])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        let reportPayload = {
            observador_id: user.id,
            recinto_id: formData.recinto_id,
            tipo_reporte: 'media_jornada' as any, // Using existing enum for now
            fecha_captura: new Date().toISOString(),
            datos_formulario: { ...formData, is_incidencia: true },
            location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
            image_data: imagePreview // Store base64 for offline
        }

        try {
            if (online) {
                let imageUrl = null

                // 1. Upload Image to Storage
                if (imageFile) {
                    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('incidencias')
                        .upload(fileName, imageFile)

                    if (uploadError) {
                        console.error('Upload error:', uploadError)
                        // Continue without image or handle error
                    } else {
                        const { data: { publicUrl } } = supabase.storage.from('incidencias').getPublicUrl(fileName)
                        imageUrl = publicUrl
                    }
                }

                // 2. Insert into reportes (parent)
                const { data: reportData, error: reportError } = await supabase.from('reportes').insert([{
                    observador_id: reportPayload.observador_id,
                    recinto_id: reportPayload.recinto_id,
                    tipo_reporte: 'media_jornada',
                    fecha_captura: reportPayload.fecha_captura,
                    datos_formulario: reportPayload.datos_formulario,
                    estado: 'pendiente'
                }]).select().single()

                if (reportError) throw reportError

                // 3. Insert into incidencias (detail)
                const { error: incError } = await supabase.from('incidencias').insert([{
                    reporte_id: reportData.id,
                    categoria: formData.categoria,
                    descripcion: formData.descripcion,
                    severidad: formData.severidad,
                    url_evidencia_foto: imageUrl
                }])

                if (incError) throw incError
                alert('Incidencia registrada exitosamente.')
            } else {
                await saveReportOffline(reportPayload)
                alert('Modo Offline: La incidencia y la foto se guardaron localmente. Sincroniza al tener señal.')
            }
            router.push('/dashboard')
        } catch (err: any) {
            console.error('Incidencia error:', err)
            await saveReportOffline(reportPayload)
            alert(`Error: ${err.message}. Se guardó localmente como respaldo.`)
            router.push('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <header className="glass sticky top-0 z-50 p-4 flex items-center justify-between border-b border-border/50">
                <button onClick={() => router.back()} className="p-2 hover:bg-foreground/5 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-accent">Reportar Incidencia</h1>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${online ? 'bg-success/20 text-success' : 'bg-accent/20 text-accent'}`}>
                    {online ? <Wifi size={14} /> : <WifiOff size={14} />}
                    <span>{online ? 'Online' : 'Offline'}</span>
                </div>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-6">
                <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl flex items-start space-x-3">
                    <AlertTriangle className="text-accent shrink-0" size={20} />
                    <p className="text-xs text-accent-foreground font-medium">
                        Usa este módulo para reportar eventos que pongan en riesgo el proceso o seguridad.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Recinto Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-bold">Recinto Electoral</label>
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
                            <option value="">Seleccione el recinto...</option>
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
                            <label className="text-sm font-bold px-1">Categoría</label>
                            <select
                                className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-accent"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                <option value="violencia">Violencia</option>
                                <option value="falta_material">Falta de Material</option>
                                <option value="proselitismo">Proselitismo</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold px-1">Severidad</label>
                            <select
                                className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-accent"
                                value={formData.severidad}
                                onChange={(e) => setFormData({ ...formData, severidad: e.target.value })}
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta / Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold px-1">Descripción de los Hechos</label>
                        <textarea
                            required
                            className="w-full bg-background border border-border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-accent min-h-[120px]"
                            placeholder="¿Qué sucedió? Describa brevemente..."
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                    </div>

                    {/* Photo Upload Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold px-1">Evidencia Fotográfica</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer ${imagePreview ? 'border-primary bg-primary/5' : 'border-border hover:border-accent hover:bg-accent/5'}`}
                        >
                            {imagePreview ? (
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                                        <Camera size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold">Subir fotografía</p>
                                        <p className="text-xs text-muted-foreground">Toma una foto de la evidencia o del acta</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>

                    {/* Location status */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground px-1">
                        <MapPin size={14} className={location ? 'text-success' : 'text-accent animate-pulse'} />
                        <span>{location ? 'Ubicación verificada' : 'Verificando ubicación GPS...'}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-5 rounded-3xl shadow-xl shadow-accent/20 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] disabled:opacity-70"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UploadCloud size={20} />
                                <span>Enviar Incidencia Crítica</span>
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    )
}
