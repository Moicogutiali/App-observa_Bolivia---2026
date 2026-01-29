-- Migration: Tracking presence and fixing dashboard summary data
-- Date: 2026-01-29

-- 1. Add presence tracking
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Improved get_dashboard_summary with Fallbacks and Presence
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_val public.user_role;
    user_ubicacion_id UUID;
    result JSONB;
    online_threshold TIMESTAMP WITH TIME ZONE := now() - interval '15 minutes';
BEGIN
    -- Get user info
    SELECT rol, ubicacion_id INTO user_role_val, user_ubicacion_id
    FROM public.usuarios
    WHERE id = user_id_param;

    -- ADMIN OR COORDINATOR WITHOUT JURISDICTION (Fallback to National)
    IF user_role_val = 'admin' OR (user_role_val = 'coordinador' AND user_ubicacion_id IS NULL) THEN
        SELECT jsonb_build_object(
            'total_reportes', (SELECT count(*) FROM public.reportes),
            'alertas_criticas', (SELECT count(*) FROM public.incidencias WHERE severidad = 'alta'),
            'total_observadores', (SELECT count(*) FROM public.usuarios WHERE rol = 'observador'),
            'total_recintos', (SELECT count(*) FROM public.recintos),
            'observadores_online', (SELECT count(*) FROM public.usuarios WHERE rol = 'observador' AND last_seen_at > online_threshold),
            'is_fallback', (user_ubicacion_id IS NULL)
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
                WHERE rol = 'observador' AND (ubicacion_id IN (
                     WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                ))
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
            ),
            'observadores_online', (
                SELECT count(*) FROM public.usuarios 
                WHERE rol = 'observador' AND last_seen_at > online_threshold AND (ubicacion_id IN (
                     WITH RECURSIVE sub_locations AS (
                        SELECT id FROM public.ubicaciones WHERE id = user_ubicacion_id
                        UNION ALL
                        SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
                    ) SELECT id FROM sub_locations
                ))
            )
        ) INTO result;

    ELSE -- Observer or Supervisor logic simplified for this update
        SELECT jsonb_build_object(
            'total_reportes', (SELECT count(*) FROM public.reportes WHERE observador_id = user_id_param),
            'alertas_criticas', (SELECT count(i.*) FROM public.incidencias i JOIN public.reportes r ON i.reporte_id = r.id WHERE r.observador_id = user_id_param AND i.severidad = 'alta'),
            'total_observadores', 1,
            'total_recintos', (SELECT count(DISTINCT recinto_id) FROM public.reportes WHERE observador_id = user_id_param),
            'observadores_online', (CASE WHEN EXISTS (SELECT 1 FROM public.usuarios WHERE id = user_id_param AND last_seen_at > online_threshold) THEN 1 ELSE 0 END)
        ) INTO result;
    END IF;

    RETURN result;
END;
$$;

-- 3. New Function for Real-Time Stats by Unit (For Bar Charts)
CREATE OR REPLACE FUNCTION public.get_stats_by_department()
RETURNS TABLE (
    dept_name TEXT,
    reports_count BIGINT,
    online_count BIGINT,
    total_recintos BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.nombre as dept_name,
        (
            SELECT count(r.id) 
            FROM public.reportes r 
            JOIN public.recintos rec ON r.recinto_id = rec.id 
            WHERE rec.ubicacion_id IN (
                WITH RECURSIVE sub AS (
                    SELECT id FROM public.ubicaciones WHERE id = u.id
                    UNION ALL
                    SELECT ub.id FROM public.ubicaciones ub INNER JOIN sub ON ub.parent_id = sub.id
                ) SELECT id FROM sub
            )
        ) as reports_count,
        (
            SELECT count(usr.id) 
            FROM public.usuarios usr
            WHERE usr.last_seen_at > (now() - interval '15 minutes')
            AND usr.ubicacion_id IN (
                WITH RECURSIVE sub AS (
                    SELECT id FROM public.ubicaciones WHERE id = u.id
                    UNION ALL
                    SELECT ub.id FROM public.ubicaciones ub INNER JOIN sub ON ub.parent_id = sub.id
                ) SELECT id FROM sub
            )
        ) as online_count,
        (
            SELECT count(rec.id) 
            FROM public.recintos rec 
            WHERE rec.ubicacion_id IN (
                WITH RECURSIVE sub AS (
                    SELECT id FROM public.ubicaciones WHERE id = u.id
                    UNION ALL
                    SELECT ub.id FROM public.ubicaciones ub INNER JOIN sub ON ub.parent_id = sub.id
                ) SELECT id FROM sub
            )
        ) as total_recintos
    FROM public.ubicaciones u
    WHERE u.nivel = 'departamento'
    ORDER BY reports_count DESC;
END;
$$;
