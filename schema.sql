-- مدرسة الدلنجات الصناعية بنات — Supabase PostgreSQL schema
-- شغّل الملف كاملًا من SQL Editor بحساب مالك المشروع.
begin;
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'employee' check (role in ('admin','employee')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
create or replace function public.is_employee()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','employee'));
$$;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  employee_no text unique,
  job_title text,
  specialization text,
  qualification text,
  phone text,
  email text,
  hire_date date,
  employment_status text not null default 'على رأس العمل',
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique,
  full_name text not null,
  grade text not null check (grade in ('الأول','الثاني','الثالث')),
  section text,
  specialization text not null,
  enrollment_status text not null default 'مقيدة',
  birth_date date,
  guardian_name text,
  guardian_phone text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('حضور','غياب','تأخير','إذن')),
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

create table if not exists public.staff_leaves (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'قيد المراجعة',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create table if not exists public.staff_disciplinary_records (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  record_date date not null default current_date,
  record_type text not null check (record_type in ('جزاء','تنبيه','شكر','ملاحظة')),
  details text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  course_name text not null,
  provider text,
  start_date date,
  end_date date,
  hours integer check (hours is null or hours >= 0),
  certificate_no text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  day_of_week text not null,
  period_no integer,
  subject_or_task text not null,
  class_or_location text,
  academic_year text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_students_name on public.students(full_name);
create index if not exists idx_students_grade_section on public.students(grade, section);
create index if not exists idx_attendance_date on public.attendance(attendance_date desc);
create index if not exists idx_attendance_student on public.attendance(student_id);
create index if not exists idx_staff_name on public.staff(full_name);

alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.staff_leaves enable row level security;
alter table public.staff_disciplinary_records enable row level security;
alter table public.training_courses enable row level security;
alter table public.staff_schedules enable row level security;

-- profiles: المستخدم يقرأ ملفه فقط؛ المدير يدير كل الملفات. لا تسمح للمستخدم بتغيير دوره بنفسه.
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles for insert to authenticated with check (public.is_admin());
drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles for delete to authenticated using (public.is_admin());

-- staff: ملف العاملين إداري ومقيد بحساب الإدارة.
drop policy if exists staff_admin_all on public.staff;
create policy staff_admin_all on public.staff for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- students: الموظفون المسجلون يمكنهم الاطلاع وإدخال وتعديل البيانات المدرسية؛ الحذف للإدارة فقط.
drop policy if exists students_staff_select on public.students;
create policy students_staff_select on public.students for select to authenticated using (public.is_employee());
drop policy if exists students_staff_insert on public.students;
create policy students_staff_insert on public.students for insert to authenticated with check (public.is_employee());
drop policy if exists students_staff_update on public.students;
create policy students_staff_update on public.students for update to authenticated using (public.is_employee()) with check (public.is_employee());
drop policy if exists students_admin_delete on public.students;
create policy students_admin_delete on public.students for delete to authenticated using (public.is_admin());

-- attendance: الموظفون يديرون الحضور؛ الإدارة لها كامل الصلاحيات.
drop policy if exists attendance_staff_select on public.attendance;
create policy attendance_staff_select on public.attendance for select to authenticated using (public.is_employee());
drop policy if exists attendance_staff_insert on public.attendance;
create policy attendance_staff_insert on public.attendance for insert to authenticated with check (public.is_employee());
drop policy if exists attendance_staff_update on public.attendance;
create policy attendance_staff_update on public.attendance for update to authenticated using (public.is_employee()) with check (public.is_employee());
drop policy if exists attendance_admin_delete on public.attendance;
create policy attendance_admin_delete on public.attendance for delete to authenticated using (public.is_admin());

-- السجلات الوظيفية الحساسة متاحة للإدارة فقط في الإصدار التأسيسي.
drop policy if exists leaves_admin_all on public.staff_leaves;
create policy leaves_admin_all on public.staff_leaves for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists discipline_admin_all on public.staff_disciplinary_records;
create policy discipline_admin_all on public.staff_disciplinary_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists courses_admin_all on public.training_courses;
create policy courses_admin_all on public.training_courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists schedules_admin_all on public.staff_schedules;
create policy schedules_admin_all on public.staff_schedules for all to authenticated using (public.is_admin()) with check (public.is_admin());

commit;
