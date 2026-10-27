CREATE UNIQUE INDEX IF NOT EXISTS attendance_one_per_teacher_per_day ON public.attendance_records (teacher_id, date_submitted);
CREATE OR REPLACE FUNCTION public.recorded_teacher_ids(_date date)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT teacher_id FROM public.attendance_records WHERE date_submitted = _date
$$;
REVOKE EXECUTE ON FUNCTION public.recorded_teacher_ids(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.recorded_teacher_ids(date) TO authenticated;