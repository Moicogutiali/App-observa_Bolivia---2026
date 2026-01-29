-- 1. Helper function for Hierarchical checks (Optimized)
-- This function returns TRUE if a location_id is within the jurisdiction of a user
CREATE OR REPLACE FUNCTION public.check_user_jurisdiction(user_id_param UUID, target_location_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u_role public.user_role;
    u_location_id UUID;
BEGIN
    -- Cache lookup (simulated via variables)
    SELECT rol, ubicacion_id INTO u_role, u_location_id
    FROM public.usuarios
    WHERE id = user_id_param;

    -- Admins have global access
    IF u_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- If no location assigned, they only see personal stuff (handled by other policies)
    IF u_location_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if target is the same or a child of user's location
    RETURN target_location_id IN (
        WITH RECURSIVE sub_locations AS (
            SELECT id FROM public.ubicaciones WHERE id = u_location_id
            UNION ALL
            SELECT u.id FROM public.ubicaciones u INNER JOIN sub_locations sl ON u.parent_id = sl.id
        ) SELECT id FROM sub_locations
    );
END;
$$;

-- 2. Hardened Policies for REPORTES
DROP POLICY IF EXISTS "Observadores can insert reports" ON public.reportes;

-- SELECT: Hierarchy based
CREATE POLICY "Hierarchical select reports" ON public.reportes
    FOR SELECT TO authenticated
    USING (
        auth.uid() = observador_id OR 
        public.check_user_jurisdiction(auth.uid(), (SELECT ubicacion_id FROM public.recintos WHERE id = recinto_id))
    );

-- INSERT: Only observers can report (and only for themselves)
CREATE POLICY "Observers can insert reports" ON public.reportes
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT rol FROM public.usuarios WHERE id = auth.uid()) = 'observador' AND
        auth.uid() = observador_id
    );

-- 3. Hardened Policies for INCIDENCIAS
-- Inherits visibility from reportes
CREATE POLICY "Hierarchical select incidencias" ON public.incidencias
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.reportes r 
            WHERE r.id = reporte_id
        )
    );

-- INSERT: Only observers for their own reports
CREATE POLICY "Observers can insert incidencias" ON public.incidencias
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reportes r 
            WHERE r.id = reporte_id AND r.observador_id = auth.uid()
        )
    );

-- 4. Hardened Policies for USUARIOS
DROP POLICY IF EXISTS "Admins can see all users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can see own profile" ON public.usuarios;

CREATE POLICY "Hierarchical select users" ON public.usuarios
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR 
        public.check_user_jurisdiction(auth.uid(), ubicacion_id)
    );

-- 5. Policies for UBICACIONES
CREATE POLICY "Anyone can view locations" ON public.ubicaciones
    FOR SELECT TO authenticated
    USING (true);
