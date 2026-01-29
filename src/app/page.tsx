import Link from 'next/link'
import { ArrowRight, BarChart3, PhoneCall, ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="text-primary" size={24} />
          <span className="font-bold text-xl tracking-tight">Observa Bolivia</span>
        </div>
        <Link
          href="/login"
          className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          Acceder
        </Link>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-6 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Subnacionales 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-accent">
            Tecnología para la Transparencia Electoral
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Plataforma integral de observación ciudadana con capacidades offline,
            geolocalización en tiempo real y análisis estadístico avanzado.
          </p>
          <div className="pt-8">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 bg-foreground text-background px-8 py-4 rounded-full text-lg font-bold hover:opacity-90 transition-all shadow-xl"
            >
              <span>Comenzar Registro</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-primary/5">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl space-y-4 hover:translate-y-[-4px] transition-all">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold">Offline-First</h3>
              <p className="text-muted-foreground">Registra reportes sin conexión a internet. Sincronización automática al recuperar señal.</p>
            </div>

            <div className="glass p-8 rounded-3xl space-y-4 hover:translate-y-[-4px] transition-all">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg">
                <PhoneCall size={24} />
              </div>
              <h3 className="text-xl font-bold">Call Center 800</h3>
              <p className="text-muted-foreground">Respaldo por voz para zonas de baja cobertura con integración VoIP y registro centralizado.</p>
            </div>

            <div className="glass p-8 rounded-3xl space-y-4 hover:translate-y-[-4px] transition-all">
              <div className="w-12 h-12 bg-success rounded-2xl flex items-center justify-center text-white mb-2 shadow-lg">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold">Real-Time Data</h3>
              <p className="text-muted-foreground">Dashboards interactivos con latencia mínima para la toma de decisiones estratégicas.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="p-12 border-t border-border/50 text-center text-muted-foreground">
        <div className="max-w-4xl mx-auto space-y-4">
          <p>© 2026 Fundación CONSTRUIR. Todos los derechos reservados.</p>
          <p className="text-xs">Financiado por la Unión Europea y el Fondo Canadiense.</p>
        </div>
      </footer>
    </div>
  )
}
