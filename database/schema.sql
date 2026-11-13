-- Attendance & Team Management System
-- PostgreSQL / Supabase starter schema

create extension if not exists pgcrypto;

create type public.user_role as enum ('ADMIN', 'MANAGER', 'EMPLOYEE');
create type public.account_status as enum ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
create type public.attendance_status as enum ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY', 'HALF_DAY');
create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique,
  full_name text not null,
  email text not null,
  phone text,
  department_id uuid references public.departments(id),
  designation text,
  manager_id uuid references public.profiles(id),
  joining_date date,
  role public.user_role not null default 'EMPLOYEE',
  account_status public.account_status not null default 'PENDING',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status public.attendance_status not null default 'PRESENT',
  working_minutes integer,
  late_minutes integer not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, attendance_date),
  check (working_minutes is null or working_minutes >= 0),
  check (late_minutes >= 0)
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  annual_limit numeric(6,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  total_days numeric(6,2) not null,
  reason text not null,
  attachment_url text,
  status public.request_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (total_days > 0)
);

create table public.late_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  attendance_id uuid references public.attendance(id) on delete set null,
  report_date date not null,
  expected_arrival timestamptz,
  actual_arrival timestamptz,
  reason text not null,
  description text,
  attachment_url text,
  status public.request_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create index attendance_employee_date_idx
  on public.attendance(employee_id, attendance_date desc);

create index leave_employee_date_idx
  on public.leave_requests(employee_id, start_date desc);

create index late_employee_date_idx
  on public.late_reports(employee_id, report_date desc);

create index profiles_department_idx
  on public.profiles(department_id);

create index notifications_user_idx
  on public.notifications(user_id, created_at desc);

insert into public.app_settings(key, value)
values
  ('office_start_time', '"09:30"'),
  ('office_end_time', '"18:30"'),
  ('grace_period_minutes', '10'),
  ('timezone', '"Asia/Kolkata"')
on conflict (key) do nothing;

insert into public.leave_types(name, code)
values
  ('Casual Leave', 'CL'),
  ('Sick Leave', 'SL'),
  ('Earned Leave', 'EL'),
  ('Half Day', 'HD'),
  ('Work From Home', 'WFH')
on conflict (code) do nothing;

-- NOTE:
-- RLS policies should be completed in the Supabase migration layer after
-- the auth/profile bootstrap function is established. Do not ship with
-- unrestricted tables. See ANTIGRAVITY_BUILD_PROMPT.md.
