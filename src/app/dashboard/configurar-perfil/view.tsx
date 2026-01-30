'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Shield, Key, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ConfigurarPerfil() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClient()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
            setPassword('')
            setConfirmPassword('')
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em] mb-2">
                    <Shield size={14} />
                    <span>Seguridad de la Cuenta</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter">Configurar Acceso</h1>
                <p className="text-muted-foreground text-sm font-medium">
                    Establece tu contraseña para poder ingresar directamente con tu CI y correo en el futuro.
                </p>
            </div>

            <div className="bg-[#0F1420]/60 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-md">
                {success ? (
                    <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto shadow-2xl shadow-success/20">
                            <CheckCircle2 size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">¡Contraseña Establecida!</h2>
                            <p className="text-muted-foreground">Ya puedes usar tu nueva contraseña para iniciar sesión en cualquier dispositivo.</p>
                        </div>
                        <button
                            onClick={() => setSuccess(false)}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all"
                        >
                            ENTENDIDO
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        {error && (
                            <div className="bg-danger/10 border border-danger/20 p-4 rounded-2xl flex items-center gap-3 text-danger text-xs font-bold">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nueva Contraseña</label>
                            <div className="relative">
                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    className="w-full bg-white/5 border border-white/10 pl-14 pr-5 py-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60" size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repite tu contraseña"
                                    required
                                    className="w-full bg-white/5 border border-white/10 pl-14 pr-5 py-5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <span>ACTUALIZAR CREDENCIALES</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
