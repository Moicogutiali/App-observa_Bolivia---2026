'use client'

import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'observa_bolivia_db'
const STORE_NAME = 'pending_reports'

export interface PendingReport {
    id?: number
    observador_id: string
    recinto_id: string
    tipo_reporte: 'apertura' | 'media_jornada' | 'cierre'
    fecha_captura: string
    datos_formulario: any
    location?: {
        latitude: number
        longitude: number
    }
}

let dbPromise: Promise<IDBPDatabase> | null = null

if (typeof window !== 'undefined') {
    dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
            }
        },
    }).catch(err => {
        console.error('IndexedDB error (likely permission denied):', err)
        return null as any
    })
}

export async function saveReportOffline(report: PendingReport) {
    if (!dbPromise) {
        console.warn('Offline DB not available. Report cannot be saved locally.')
        return
    }
    try {
        const db = await dbPromise
        if (!db) return
        return db.add(STORE_NAME, report)
    } catch (e) {
        console.error('Failed to save offline:', e)
    }
}

export async function getPendingReports() {
    if (!dbPromise) return []
    const db = await dbPromise
    return db.getAll(STORE_NAME)
}

export async function deletePendingReport(id: number) {
    if (!dbPromise) return
    const db = await dbPromise
    return db.delete(STORE_NAME, id)
}
