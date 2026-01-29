-- Helper function to get the full hierarchy path for a location
CREATE OR REPLACE FUNCTION public.get_location_path(target_location_id UUID)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    nivel TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE location_path AS (
        SELECT u.id, u.nombre, u.nivel, u.parent_id
        FROM public.ubicaciones u
        WHERE u.id = target_location_id
        UNION ALL
        SELECT u.id, u.nombre, u.nivel, u.parent_id
        FROM public.ubicaciones u
        INNER JOIN location_path lp ON u.id = lp.parent_id
    )
    SELECT lp.id, lp.nombre, lp.nivel
    FROM location_path lp
    ORDER BY CASE 
        WHEN lp.nivel = 'departamento' THEN 1
        WHEN lp.nivel = 'municipio' THEN 2
        WHEN lp.nivel = 'asiento' THEN 3
        ELSE 4
    END ASC;
END;
$$;
