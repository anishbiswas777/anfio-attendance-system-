-- Attendance & Team Management System
-- Migration 0001: Initial Schema, Constraints, Indexes, Triggers & Default Settings

create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.user_role as enum ('ADMIN', 'MANAGER', 'EMPLOYEE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.attendance_status as enum ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY', 'HALF_DAY');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum ('PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null;
end $$;

-- Updated-at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  manager_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (linked 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_code text unique,
  full_name text not null,
  email text not null unique,
  phone text,
  department_id uuid references public.departments(id) on delete set null,
  designation text,
  manager_id uuid references public.profiles(id) on delete set null,
  joining_date date,
  role public.user_role not null default 'EMPLOYEE',
  account_status public.account_status not null default 'PENDING',
  avatar_url text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add FK from departments.manager_id to profiles.id after profiles exists
do $$ begin
  alter table public.departments
    add constraint departments_manager_id_fkey
    foreign key (manager_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- Attendance
create table if not exists public.attendance (
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
  check (late_minutes >= 0),
  check (check_out is null or check_in is null or check_out >= check_in)
);

-- Leave Types
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  annual_limit numeric(6,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Leave Requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id),
  start_date date not null,
  end_date date not null,
  total_days numeric(6,2) not null,
  is_half_day boolean not null default false,
  reason text not null,
  attachment_url text,
  status public.request_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (total_days > 0)
);

-- Late Reports
create table if not exists public.late_reports (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  attendance_id uuid references public.attendance(id) on delete set null,
  report_date date not null,
  expected_arrival text,
  actual_arrival text,
  reason text not null,
  description text,
  attachment_url text,
  status public.request_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Holidays
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Audit Logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- App Settings
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists attendance_employee_date_idx
  on public.attendance(employee_id, attendance_date desc);

create index if not exists attendance_date_idx
  on public.attendance(attendance_date desc);

create index if not exists leave_employee_date_idx
  on public.leave_requests(employee_id, start_date desc);

create index if not exists leave_status_idx
  on public.leave_requests(status, created_at desc);

create index if not exists late_employee_date_idx
  on public.late_reports(employee_id, report_date desc);

create index if not exists late_status_idx
  on public.late_reports(status, created_at desc);

create index if not exists profiles_department_idx
  on public.profiles(department_id);

create index if not exists profiles_manager_idx
  on public.profiles(manager_id);

create index if not exists profiles_status_idx
  on public.profiles(account_status);

create index if not exists notifications_user_idx
  on public.notifications(user_id, created_at desc);

create index if not exists audit_logs_created_idx
  on public.audit_logs(created_at desc);

-- Updated-at triggers
drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

drop trigger if exists trg_leave_requests_updated_at on public.leave_requests;
create trigger trg_leave_requests_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_late_reports_updated_at on public.late_reports;
create trigger trg_late_reports_updated_at
  before update on public.late_reports
  for each row execute function public.set_updated_at();

-- Default Application Settings
insert into public.app_settings(key, value)
values
  ('office_start_time', '"09:30"'),
  ('office_end_time', '"18:30"'),
  ('grace_period_minutes', '10'),
  ('late_threshold_minutes', '10'),
  ('half_day_threshold_minutes', '240'),
  ('timezone', '"Asia/Kolkata"'),
  ('weekend_days', '[0, 6]'),
  ('allow_past_leave', 'false'),
  ('allow_overlapping_leave', 'false'),
  ('team_show_checkin_time', 'true'),
  ('manager_can_approve_leave', 'true'),
  ('manager_can_approve_late', 'true')
on conflict (key) do nothing;

-- Default Leave Types
insert into public.leave_types(name, code, annual_limit)
values
  ('Casual Leave', 'CL', 12),
  ('Sick Leave', 'SL', 10),
  ('Earned Leave', 'EL', 15),
  ('Half Day', 'HD', null),
  ('Work From Home', 'WFH', null),
  ('Other', 'OTHER', null)
on conflict (code) do nothing;
