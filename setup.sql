-- منظومة مدرسة الدلنجات الصناعية بنات
-- Migration آمن نسبيًا: لا يحذف جداول أو سجلات. خذ نسخة احتياطية قبل تشغيله.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  employee_id text,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists role text not null default 'viewer';
alter table public.profiles add column if not exists employee_id text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create table if not exists public.employees (
 id uuid primary key default gen_random_uuid(), full_name text not null, employee_no text, job_title text,
 specialization text, qualification text, phone text, email text, hire_date date,
 employment_status text default 'على رأس العمل', notes text, created_at timestamptz not null default now()
);
alter table public.employees add column if not exists full_name text;
alter table public.employees add column if not exists employee_no text;
alter table public.employees add column if not exists job_title text;
alter table public.employees add column if not exists specialization text;
alter table public.employees add column if not exists qualification text;
alter table public.employees add column if not exists phone text;
alter table public.employees add column if not exists email text;
alter table public.employees add column if not exists hire_date date;
alter table public.employees add column if not exists employment_status text default 'على رأس العمل';
alter table public.employees add column if not exists notes text;
alter table public.employees add column if not exists created_at timestamptz not null default now();

create table if not exists public.students (
 id uuid primary key default gen_random_uuid(), full_name text not null, student_number text, grade text,
 section text, specialty text, phone text, guardian_phone text, status text default 'مقيدة', notes text,
 created_at timestamptz not null default now()
);
alter table public.students add column if not exists full_name text;
alter table public.students add column if not exists student_number text;
alter table public.students add column if not exists grade text;
alter table public.students add column if not exists section text;
alter table public.students add column if not exists specialty text;
alter table public.students add column if not exists phone text;
alter table public.students add column if not exists guardian_phone text;
alter table public.students add column if not exists status text default 'مقيدة';
alter table public.students add column if not exists notes text;
alter table public.students add column if not exists created_at timestamptz not null default now();

create table if not exists public.attendance (
 id uuid primary key default gen_random_uuid(), student_id text, student_name text, student_number text,
 attendance_date date not null default current_date, status text not null, notes text, created_at timestamptz not null default now()
);
alter table public.attendance add column if not exists student_id text;
alter table public.attendance add column if not exists student_name text;
alter table public.attendance add column if not exists student_number text;
alter table public.attendance add column if not exists attendance_date date default current_date;
alter table public.attendance add column if not exists status text;
alter table public.attendance add column if not exists notes text;
alter table public.attendance add column if not exists created_at timestamptz not null default now();

create table if not exists public.leaves (
 id uuid primary key default gen_random_uuid(), employee_id text, employee_name text, leave_type text not null,
 start_date date not null, end_date date not null, status text not null default 'قيد المراجعة', notes text,
 created_at timestamptz not null default now()
);
alter table public.leaves add column if not exists employee_id text;
alter table public.leaves add column if not exists employee_name text;
alter table public.leaves add column if not exists leave_type text;
alter table public.leaves add column if not exists start_date date;
alter table public.leaves add column if not exists end_date date;
alter table public.leaves add column if not exists status text default 'قيد المراجعة';
alter table public.leaves add column if not exists notes text;
alter table public.leaves add column if not exists created_at timestamptz not null default now();

create table if not exists public.training_courses (
 id uuid primary key default gen_random_uuid(), title text not null, provider text, start_date date, end_date date,
 duration_days integer, participants text, notes text, created_at timestamptz not null default now()
);
alter table public.training_courses add column if not exists title text;
alter table public.training_courses add column if not exists provider text;
alter table public.training_courses add column if not exists start_date date;
alter table public.training_courses add column if not exists end_date date;
alter table public.training_courses add column if not exists duration_days integer;
alter table public.training_courses add column if not exists participants text;
alter table public.training_courses add column if not exists notes text;
alter table public.training_courses add column if not exists created_at timestamptz not null default now();

create table if not exists public.staff_schedules (
 id uuid primary key default gen_random_uuid(), day_of_week text not null, period_no integer not null,
 class_name text not null, subject text not null, employee_id text, employee_name text, notes text,
 created_at timestamptz not null default now()
);
alter table public.staff_schedules add column if not exists day_of_week text;
alter table public.staff_schedules add column if not exists period_no integer;
alter table public.staff_schedules add column if not exists class_name text;
alter table public.staff_schedules add column if not exists subject text;
alter table public.staff_schedules add column if not exists employee_id text;
alter table public.staff_schedules add column if not exists employee_name text;
alter table public.staff_schedules add column if not exists notes text;
alter table public.staff_schedules add column if not exists created_at timestamptz not null default now();

-- Helper avoids recursive RLS checks on profiles.
create or replace function public.is_school_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid() and lower(coalesce(p.role,'')) in ('admin','manager','principal')) $$;
revoke all on function public.is_school_admin() from public;
grant execute on function public.is_school_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.leaves enable row level security;
alter table public.training_courses enable row level security;
alter table public.staff_schedules enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.employees, public.students, public.attendance, public.leaves, public.training_courses, public.staff_schedules to authenticated;

-- Recreate only this package's policies; existing unrelated policies are preserved.
drop policy if exists school_profiles_select_self_or_admin on public.profiles;
create policy school_profiles_select_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.is_school_admin());
drop policy if exists school_profiles_update_admin on public.profiles;
create policy school_profiles_update_admin on public.profiles for update to authenticated using (public.is_school_admin()) with check (public.is_school_admin());

drop policy if exists school_employees_select on public.employees;
create policy school_employees_select on public.employees for select to authenticated using (public.is_school_admin() or exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role,''))='viewer') or exists(select 1 from public.profiles p where p.id=auth.uid() and p.employee_id::text=employees.id::text));
drop policy if exists school_employees_write on public.employees;
create policy school_employees_write on public.employees for all to authenticated using (public.is_school_admin()) with check (public.is_school_admin());

-- Data for students and school records is visible only to admins/managers/principal and read-only viewers.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['students','attendance','leaves','training_courses','staff_schedules'] LOOP
   EXECUTE format('drop policy if exists %I on public.%I', 'school_'||t||'_select', t);
   EXECUTE format('create policy %I on public.%I for select to authenticated using (public.is_school_admin() or exists(select 1 from public.profiles p where p.id=auth.uid() and lower(coalesce(p.role, ''''))=''viewer''))', 'school_'||t||'_select', t);
   EXECUTE format('drop policy if exists %I on public.%I', 'school_'||t||'_write', t);
   EXECUTE format('create policy %I on public.%I for all to authenticated using (public.is_school_admin()) with check (public.is_school_admin())', 'school_'||t||'_write', t);
 END LOOP;
END $$;

-- Important: after running this script, confirm the existing administrator profile has role='admin'.
-- Do not create public sign-up or put a service_role key in the website.
