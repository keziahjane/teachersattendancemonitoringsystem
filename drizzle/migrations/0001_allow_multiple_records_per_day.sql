DROP INDEX IF EXISTS public.attendance_one_per_teacher_per_day;
CREATE UNIQUE INDEX IF NOT EXISTS attendance_unique_teacher_day_room_time ON public.attendance_records (teacher_id, date_submitted, room_assignment, time_arrival, time_out) NULLS NOT DISTINCT;
CREATE OR REPLACE FUNCTION public.recorded_slots(_date date)
RETURNS TABLE(teacher_id uuid, room_assignment text, time_arrival time, time_out time) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT teacher_id, room_assignment, time_arrival, time_out FROM public.attendance_records WHERE date_submitted = _date
$$;
REVOKE EXECUTE ON FUNCTION public.recorded_slots(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.recorded_slots(date) TO authenticated;