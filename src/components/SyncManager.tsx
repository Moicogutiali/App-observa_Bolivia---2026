'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, AlertCircle, Wifi, Database } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getPendingReports, deletePendingReport } from '@/utils/offline-db'

export default function SyncManager() {
    const [syncing, setSyncing] = useState(false)
    const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | 'idle'>('idle')
    const [pendingCount, setPendingCount] = useState(0)
    const supabase = createClient()

    const base64ToBlob = (base64: string) => {
        try {
            const parts = base64.split(';base64,')
            if (parts.length < 2) return null
            const contentType = parts[0].split(':')[1]
            const raw = window.atob(parts[1])
            const rawLength = raw.length
            const uInt8Array = new Uint8Array(rawLength)
            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i)
            }
            return new Blob([uInt8Array], { type: contentType })
        } catch (e) {
            console.error('Base64 conversion error:', e)
            return null
        }
    }

    const syncData = async () => {
        const pending = await getPendingReports()
        setPendingCount(pending.length)

        if (pending.length === 0 || syncing || !navigator.onLine) return

        setSyncing(true)
        setLastSyncStatus('idle')
        let successCount = 0

        for (const report of pending) {
            try {
                // --- AUTO-CLEANUP LOGIC ---
                // If the report uses a mock ID, delete it and continue.
                // Mock IDs cause UUID validation errors in Postgres.
                if (report.recinto_id.includes('mock-')) {
                    console.warn('Purging invalid mock report from sync queue:', report.id)
                    if (report.id) await deletePendingReport(report.id)
                    continue
                }

                let imageUrl = null

                // 1. Handle image if present
                if (report.image_data) {
                    const blob = base64ToBlob(report.image_data)
                    if (blob) {
                        const fileName = `${report.observador_id}/sync-${Date.now()}.jpg`
                        const { error: uploadError } = await supabase.storage
                            .from('incidencias')
                            .upload(fileName, blob)

                        if (!uploadError) {
                            const { data: { publicUrl } } = supabase.storage.from('incidencias').getPublicUrl(fileName)
                            imageUrl = publicUrl
                        }
                    }
                }

                // 2. Insert main report
                const { data: reportData, error: reportError } = await supabase.from('reportes').insert([{
                    observador_id: report.observador_id,
                    recinto_id: report.recinto_id,
                    tipo_reporte: report.tipo_reporte,
                    fecha_captura: report.fecha_captura,
                    datos_formulario: report.datos_formulario,
                    estado: 'pendiente'
                }]).select().single()

                if (reportError) throw reportError

                // 3. Insert incident detail
                if (report.datos_formulario?.is_incidencia && reportData) {
                    const { error: incError } = await supabase.from('incidencias').insert([{
                        reporte_id: reportData.id,
                        categoria: report.datos_formulario.categoria || 'otros',
                        descripcion: report.datos_formulario.descripcion || 'Sincronizado',
                        severidad: report.datos_formulario.severidad || 'baja',
                        url_evidencia_foto: imageUrl
                    }])
                    if (incError) throw incError
                }

                // 4. Success! Delete from local DB
                if (report.id) await deletePendingReport(report.id)
                successCount++
            } catch (err: any) {
                console.error('Sync failed for report item:', err)
                setLastSyncStatus('error')
                break
            }
        }

        setSyncing(false)
        if (successCount > 0) {
            setLastSyncStatus('success')
            setTimeout(() => setLastSyncStatus('idle'), 5000)
        }

        const remaining = await getPendingReports()
        setPendingCount(remaining.length)
    }

    useEffect(() => {
        syncData()
        const handleOnline = () => syncData()
        window.addEventListener('online', handleOnline)
        const interval = setInterval(syncData, 30000)

        return () => {
            window.removeEventListener('online', handleOnline)
            clearInterval(interval)
        }
    }, [])

    if (pendingCount === 0 && lastSyncStatus === 'idle') return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-right-4 duration-500">
            <div className={`p-5 rounded-[2rem] shadow-2xl border backdrop-blur-xl flex items-center space-x-4 min-w-[280px] transition-all
        ${lastSyncStatus === 'error' ? 'bg-danger/20 border-danger/50 text-white' :
                    lastSyncStatus === 'success' ? 'bg-success/20 border-success/50 text-white' :
                        'bg-primary/20 border-primary/30 text-white'}`}
            >
                <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${syncing ? 'bg-primary/40' : 'bg-white/10'}`}>
                        {syncing ? (
                            <RefreshCw className="animate-spin text-white" size={24} />
                        ) : lastSyncStatus === 'success' ? (
                            <CheckCircle2 className="text-success" size={24} />
                        ) : lastSyncStatus === 'error' ? (
                            <AlertCircle className="text-danger" size={24} />
                        ) : (
                            <Database className="text-primary-foreground" size={24} />
                        )}
                    </div>
                    {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#020617]">
                            {pendingCount}
                        </span>
                    )}
                </div>

                <div className="flex-grow">
                    <p className="text-sm font-bold leading-tight">
                        {syncing ? 'Sincronizando...' :
                            lastSyncStatus === 'success' ? 'Sincronizado' :
                                lastSyncStatus === 'error' ? 'Fallo en Sincronía' :
                                    'Datos Pendientes'}
                    </p>
                    <p className="text-[10px] opacity-80 uppercase tracking-widest font-black mt-1">
                        {syncing ? 'Subiendo reportes' :
                            lastSyncStatus === 'error' ? 'Dato inválido detectado' :
                                `${pendingCount} registros locales`}
                    </p>
                </div>
            </div>
        </div>
    )
}
