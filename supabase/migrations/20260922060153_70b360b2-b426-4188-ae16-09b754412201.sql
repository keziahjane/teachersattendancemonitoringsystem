ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.departments SET is_active = false WHERE name = 'CBA';

GRANT SELECT ON public.departments TO authenticated;