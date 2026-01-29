-- Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'coordinador', 'observador', 'operador');
CREATE TYPE public.report_type AS ENUM ('apertura', 'media_jornada', 'cierre');
CREATE TYPE public.report_status AS ENUM ('pendiente', 'validado', 'rechazado');
CREATE TYPE public.incidencia_category AS ENUM ('violencia', 'falta_material', 'otros');
CREATE TYPE public.incidencia_severity AS ENUM ('baja', 'media', 'alta');

-- Create tables
CREATE TABLE public.ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    nivel TEXT NOT NULL, -- 'departamento', 'municipio', 'localidad'
    parent_id UUID REFERENCES public.ubicaciones(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nombre TEXT NOT NULL,
    ci TEXT UNIQUE NOT NULL,
    rol public.user_role NOT NULL DEFAULT 'observador',
    telefono TEXT,
    ubicacion_id UUID REFERENCES public.ubicaciones(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recintos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    geolocalizacion POINT, -- Using PostgreSQL point for lat/lng
    mesas_habilitadas INTEGER DEFAULT 0,
    ubicacion_id UUID REFERENCES public.ubicaciones(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observador_id UUID REFERENCES public.usuarios(id) NOT NULL,
    recinto_id UUID REFERENCES public.recintos(id) NOT NULL,
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_captura TIMESTAMP WITH TIME ZONE NOT NULL, -- Crucial for Offline-First
    tipo_reporte public.report_type NOT NULL,
    datos_formulario JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado public.report_status NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.incidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
    categoria public.incidencia_category NOT NULL,
    descripcion TEXT NOT NULL,
    severidad public.incidencia_severity NOT NULL DEFAULT 'baja',
    url_evidencia_foto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.grabaciones_voice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
    sid_llamada TEXT UNIQUE NOT NULL,
    url_audio TEXT NOT NULL,
    duracion_seg INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recintos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (example)
-- Only admins can see all users
CREATE POLICY "Admins can see all users" ON public.usuarios
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.usuarios WHERE rol = 'admin'));

-- Users can see their own profile
CREATE POLICY "Users can see own profile" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

-- Observadores can only insert their own reports
CREATE POLICY "Observadores can insert reports" ON public.reportes
    FOR INSERT WITH CHECK (auth.uid() = observador_id);

-- Everyone can see recintos
CREATE POLICY "Anyone can view recintos" ON public.recintos
    FOR SELECT TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX idx_reportes_recinto ON public.reportes(recinto_id);
CREATE INDEX idx_reportes_observador ON public.reportes(observador_id);
CREATE INDEX idx_reportes_estado ON public.reportes(estado);
CREATE INDEX idx_reportes_fecha_envio ON public.reportes(fecha_envio DESC);
