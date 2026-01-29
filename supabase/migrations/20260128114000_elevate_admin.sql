-- Migration to elevate a specific user to SuperAdmin
-- Email: rolangutiali.rg@gmail.com

UPDATE public.usuarios 
SET rol = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'rolangutiali.rg@gmail.com'
);
