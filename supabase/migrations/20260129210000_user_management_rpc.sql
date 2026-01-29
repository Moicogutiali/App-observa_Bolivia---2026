-- Function to get managed users based on hierarchy
-- Used for the "Red de Observadores" screen
CREATE OR REPLACE FUNCTION public.get_managed_users(manager_id UUID)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    email TEXT,
    rol public.user_role,
    ci TEXT,
    telefono TEXT,
    ubicacion_nombre TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    m_rol public.user_role;
    m_ub_id UUID;
BEGIN
    -- Get manager info
    SELECT u.rol, u.ubicacion_id INTO m_rol, m_ub_id
    FROM public.usuarios u
    WHERE u.id = manager_id;

    IF m_rol = 'admin' THEN
        RETURN QUERY
        SELECT 
            u.id, u.nombre, au.email, u.rol, u.ci, u.telefono, 
            ub.nombre as ubicacion_nombre, u.last_seen_at, u.created_at
        FROM public.usuarios u
        LEFT JOIN auth.users au ON u.id = au.id
        LEFT JOIN public.ubicaciones ub ON u.ubicacion_id = ub.id
        ORDER BY u.created_at DESC;
    
    ELSIF m_rol = 'coordinador' THEN
        RETURN QUERY
        SELECT 
            u.id, u.nombre, au.email, u.rol, u.ci, u.telefono, 
            ub.nombre as ubicacion_nombre, u.last_seen_at, u.created_at
        FROM public.usuarios u
        LEFT JOIN auth.users au ON u.id = au.id
        LEFT JOIN public.ubicaciones ub ON u.ubicacion_id = ub.id
        WHERE u.ubicacion_id IN (
            WITH RECURSIVE sub AS (
                SELECT id FROM public.ubicaciones WHERE id = m_ub_id
                UNION ALL
                SELECT child.id FROM public.ubicaciones child INNER JOIN sub ON child.parent_id = sub.id
            ) SELECT id FROM sub
        )
        AND u.rol != 'admin' -- Coordinator can't see/manage admins
        ORDER BY u.created_at DESC;

    ELSIF m_rol = 'supervisor' THEN
        RETURN QUERY
        SELECT 
            u.id, u.nombre, au.email, u.rol, u.ci, u.telefono, 
            ub.nombre as ubicacion_nombre, u.last_seen_at, u.created_at
        FROM public.usuarios u
        LEFT JOIN auth.users au ON u.id = au.id
        LEFT JOIN public.ubicaciones ub ON u.ubicacion_id = ub.id
        WHERE u.ubicacion_id = m_ub_id
        AND u.rol = 'observador' -- Supervisor only manages observers in their area
        ORDER BY u.created_at DESC;
    
    END IF;
END;
$$;
