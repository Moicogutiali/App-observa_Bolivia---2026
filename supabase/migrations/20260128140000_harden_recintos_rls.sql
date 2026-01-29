-- Hardening RLS for RECINTOS
-- This ensures users only see recintos within their jurisdiction
DROP POLICY IF EXISTS "Anyone can view recintos" ON public.recintos;

CREATE POLICY "Hierarchical select recintos" ON public.recintos
    FOR SELECT TO authenticated
    USING (
        public.check_user_jurisdiction(auth.uid(), ubicacion_id)
    );
