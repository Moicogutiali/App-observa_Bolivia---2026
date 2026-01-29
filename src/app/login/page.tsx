'use client'

import React, { useState, Suspense } from 'react'
import { login, signup } from './actions'
import { useSearchParams } from 'next/navigation'
import { UserPlus, LogIn, ShieldCheck, MapPin, AlertCircle, ArrowLeft, User } from 'lucide-react'

function LoginForm() {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4">
            <div className="w-full max-w-md">
                <div className="glass rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden text-foreground">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl opacity-50" />

                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4 text-white">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Observa Bolivia</h1>
                        <p className="text-muted-foreground">Sistema de Observación Electoral 2026</p>
                    </div>

                    {(error || message) && (
                        <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm animate-in fade-in slide-in-from-top-2 ${error ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                            <AlertCircle size={18} />
                            <span>{error || message}</span>
                        </div>
                    )}

                    <form
                        action={async (formData) => {
                            setLoading(true)
                            if (mode === 'login') await login(formData)
                            else await signup(formData)
                            setLoading(false)
                        }}
                        className="space-y-6"
                    >
                        {mode === 'signup' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium px-1">Nombre Completo</label>
                                    <input
                                        name="nombre"
                                        type="text"
                                        placeholder="ej. Juan Perez"
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium px-1">Cédula de Identidad (CI)</label>
                                    <input
                                        name="ci"
                                        type="text"
                                        placeholder="ej. 1234567 LP"
                                        className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Correo Institucional</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="ej. obs@observabolivia.bo"
                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium px-1">Contraseña</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full ${mode === 'login' ? 'bg-primary shadow-primary/20' : 'bg-accent shadow-accent/20'} text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-50`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                                    <span>{mode === 'login' ? 'Ingresar al Portal' : 'Registrar Cuenta'}</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                        >
                            {mode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>

                    <div className="pt-6 border-t border-border/50 text-center">
                        <div className="flex items-center justify-center text-xs text-muted-foreground space-x-4">
                            <div className="flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>Georreferenciación Activa</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <ShieldCheck size={12} />
                                <span>Encriptación SSL</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Fundación CONSTRUIR © 2026
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
            <LoginForm />
        </Suspense>
    )
}
