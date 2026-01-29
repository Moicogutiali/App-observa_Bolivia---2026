'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function PresenceTracker({ userId }: { userId: string }) {
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        // 1. Initial ping
        const updatePresence = async () => {
            try {
                await supabase
                    .from('usuarios')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', userId)
            } catch (e) {
                // Silently fail, it's just presence
            }
        }

        updatePresence()

        // 2. Interval ping every 5 minutes
        const interval = setInterval(updatePresence, 1000 * 60 * 5)

        return () => clearInterval(interval)
    }, [userId, supabase])

    return null // Invisible component
}
