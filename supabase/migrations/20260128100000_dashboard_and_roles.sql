-- Update user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Update ubicaciones levels
-- Current levels: 'departamento', 'municipio', 'localidad'
-- We'll add 'asiento'

-- Create a view for Dashboard Statistics
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
    (SELECT count(*) FROM public.reportes) as total_reportes,
    (SELECT count(*) FROM public.incidencias WHERE severidad = 'alta') as alertas_criticas,
    (SELECT count(*) FROM public.usuarios WHERE rol = 'observador') as observadores_activos,
    (SELECT count(*) FROM public.recintos) as total_recintos,
    (SELECT count(*) FROM public.reportes WHERE estado = 'validado') as reportes_validados;

-- Create a function to get stats based on user role and hierarchy
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_val public.user_role;
    user_ubicacion_id UUID;
    result JSONB;
BEGIN
    -- Get user info
    SELECT rol, ubicacion_id INTO user_role_val, user_ubicacion_id
    FROM public.usuarios
    WHERE id = user_id_param;

    IF user_role_val = 'admin' THEN
        SELECT jsonb_build_object(
            'total_reportes', (SELECT count(*) FROM public.reportes),
            'alertas_criticas', (SELECT count(*) FROM public.incidencias WHERE severidad = 'alta'),
            'total_observadores', (SELECT count(*) FROM public.usuarios WHERE rol = 'observador'),
            'total_recintos', (SELECT count(*) FROM public.recintos)
        ) INTO result;
    
    ELSIF user_role_val = 'coordinador' THEN
        -- Coordinator sees everything in their department (ubicacion_id)
        SELECT jsonb_build_object(
            'total_reportes', (
                SELECT count(r.*) 
                FROM public.reportes r
                JOIN public.recintos rec ON r.recinto_id = rec.id
                WHERE rec.ubicacion_id IN (
                    WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                )
            ),
            'alertas_criticas', (
                SELECT count(i.*) 
                FROM public.incidencias i
                JOIN public.reportes r ON i.reporte_id = r.id
                JOIN public.recintos rec ON r.recinto_id = rec.id
                WHERE rec.ubicacion_id IN (
                    WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                ) AND i.severidad = 'alta'
            ),
            'total_observadores', (
                SELECT count(*) FROM public.usuarios 
                WHERE rol = 'observador' AND ubicacion_id IN (
                     WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                )
            ),
            'total_recintos', (
                SELECT count(*) FROM public.recintos 
                WHERE ubicacion_id IN (
                     WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                )
            )
        ) INTO result;

    ELSIF user_role_val = 'supervisor' THEN
        -- Supervisor sees everything in their electoral seat
        SELECT jsonb_build_object(
            'total_reportes', (
                SELECT count(r.*) 
                FROM public.reportes r
                JOIN public.recintos rec ON r.recinto_id = rec.id
                WHERE rec.ubicacion_id = user_ubicacion_id
            ),
            'alertas_criticas', (
                SELECT count(i.*) 
                FROM public.incidencias i
                JOIN public.reportes r ON i.reporte_id = r.id
                JOIN public.recintos rec ON r.recinto_id = rec.id
                WHERE rec.ubicacion_id = user_ubicacion_id AND i.severidad = 'alta'
            ),
            'total_observadores', (
                SELECT count(*) FROM public.usuarios 
                WHERE rol = 'observador' AND ubicacion_id = user_ubicacion_id
            ),
            'total_recintos', (
                SELECT count(*) FROM public.recintos 
                WHERE ubicacion_id = user_ubicacion_id
            )
        ) INTO result;

    ELSE -- Observador
        SELECT jsonb_build_object(
            'total_reportes', (SELECT count(*) FROM public.reportes WHERE observador_id = user_id_param),
            'alertas_criticas', (SELECT count(i.*) FROM public.incidencias i JOIN public.reportes r ON i.reporte_id = r.id WHERE r.observador_id = user_id_param AND i.severidad = 'alta'),
            'total_observadores', 1,
            'total_recintos', (SELECT count(DISTINCT recinto_id) FROM public.reportes WHERE observador_id = user_id_param)
        ) INTO result;
    END IF;

    RETURN result;
END;
$$;

-- Function to get recent reports based on hierarchy
CREATE OR REPLACE FUNCTION public.get_recent_reports(user_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
    user_name TEXT,
    recinto_name TEXT,
    tipo_reporte public.report_type,
    estado public.report_status,
    fecha_envio TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_val public.user_role;
    user_ubicacion_id UUID;
BEGIN
    -- Get user info
    SELECT rol, ubicacion_id INTO user_role_val, user_ubicacion_id
    FROM public.usuarios
    WHERE id = user_id_param;

    IF user_role_val = 'admin' THEN
        RETURN QUERY
        SELECT u.nombre as user_name, rec.nombre as recinto_name, r.tipo_reporte, r.estado, r.fecha_envio
        FROM public.reportes r
        JOIN public.usuarios u ON r.observador_id = u.id
        JOIN public.recintos rec ON r.recinto_id = rec.id
        ORDER BY r.fecha_envio DESC
        LIMIT limit_param;
    
    ELSIF user_role_val = 'coordinador' THEN
        RETURN QUERY
        SELECT u.nombre as user_name, rec.nombre as recinto_name, r.tipo_reporte, r.estado, r.fecha_envio
        FROM public.reportes r
        JOIN public.usuarios u ON r.observador_id = u.id
        JOIN public.recintos rec ON r.recinto_id = rec.id
        WHERE rec.ubicacion_id IN (
            WITH RECURSIVE sub_locations AS (
                SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                UNION ALL
                SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
            ) SELECT id FROM sub_locations
        )
        ORDER BY r.fecha_envio DESC
        LIMIT limit_param;

    ELSIF user_role_val = 'supervisor' THEN
        RETURN QUERY
        SELECT u.nombre as user_name, rec.nombre as recinto_name, r.tipo_reporte, r.estado, r.fecha_envio
        FROM public.reportes r
        JOIN public.usuarios u ON r.observador_id = u.id
        JOIN public.recintos rec ON r.recinto_id = rec.id
        WHERE rec.ubicacion_id = user_ubicacion_id
        ORDER BY r.fecha_envio DESC
        LIMIT limit_param;

    ELSE -- Observador
        RETURN QUERY
        SELECT u.nombre as user_name, rec.nombre as recinto_name, r.tipo_reporte, r.estado, r.fecha_envio
        FROM public.reportes r
        JOIN public.usuarios u ON r.observador_id = u.id
        JOIN public.recintos rec ON r.recinto_id = rec.id
        WHERE r.observador_id = user_id_param
        ORDER BY r.fecha_envio DESC
        LIMIT limit_param;
    END IF;
END;
$$;
