-- PILOT DATA FOR TESTING (As Observer)
-- This creates a test hierarchy and assigns a recinto to the current user

DO $$
DECLARE
    dept_id UUID;
    prov_id UUID;
    mun_id UUID;
    asiento_id UUID;
    recinto_id UUID;
    user_id UUID;
BEGIN
    -- 1. Get User ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'rolangutiali.rg@gmail.com';

    IF user_id IS NULL THEN
        RAISE NOTICE 'User not found, please register first.';
        RETURN;
    END IF;

    -- 2. Create Hierarchy
    INSERT INTO public.ubicaciones (nombre, tipo) 
    VALUES ('LA PAZ', 'departamento') RETURNING id INTO dept_id;

    INSERT INTO public.ubicaciones (nombre, tipo, parent_id) 
    VALUES ('MURILLO', 'provincia', dept_id) RETURNING id INTO prov_id;

    INSERT INTO public.ubicaciones (nombre, tipo, parent_id) 
    VALUES ('LA PAZ', 'municipio', prov_id) RETURNING id INTO mun_id;

    INSERT INTO public.ubicaciones (nombre, tipo, parent_id) 
    VALUES ('CENTRO CIUDAD', 'asiento', mun_id) RETURNING id INTO asiento_id;

    -- 3. Create Recinto
    INSERT INTO public.recintos (nombre, ubicacion_id, direccion)
    VALUES ('UNIDAD EDUCATIVA PILOTO', asiento_id, 'Av. Camacho Esq. Loayza')
    RETURNING id INTO recinto_id;

    -- 4. Assign User to this Jurisdiction (As Seat Supervisor or Observer)
    -- In this case, we assign the user to the seat so they can see the recinto
    UPDATE public.usuarios 
    SET ubicacion_id = asiento_id,
        rol = 'observador' -- Keeping it as observer for current testing
    WHERE id = user_id;

    RAISE NOTICE 'Pilot data created and assigned to rolangutiali.rg@gmail.com';
END $$;
