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
-- Attendance & Team Management System
-- Migration 0002: Row Level Security (RLS), Helper Functions, Triggers & Storage Policies

-- ============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS (prevent RLS recursion & centralize auth)
-- ============================================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_status()
returns public.account_status
language sql
stable
security definer
set search_path = public
as $$
  select account_status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select account_status = 'ACTIVE' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'ADMIN' and account_status = 'ACTIVE' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_manager_of(target_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select exists (
        select 1
        from public.profiles mgr
        join public.profiles emp on emp.id = target_employee_id
        left join public.departments d on d.id = emp.department_id
        where mgr.id = auth.uid()
          and mgr.account_status = 'ACTIVE'
          and mgr.role in ('MANAGER', 'ADMIN')
          and (
            mgr.role = 'ADMIN'
            or emp.manager_id = mgr.id
            or d.manager_id = mgr.id
          )
      )
    ),
    false
  );
$$;

-- ============================================================================
-- 2. PROFILE COLUMN PROTECTION TRIGGER
-- Prevents non-admins from escalating role, account_status, department, manager, etc.
-- ============================================================================

create or replace function public.protect_profile_restricted_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow service role / postgres migrations (auth.uid() is null) or active admins
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.account_status is distinct from old.account_status
     or new.department_id is distinct from old.department_id
     or new.manager_id is distinct from old.manager_id
     or new.employee_code is distinct from old.employee_code
     or new.joining_date is distinct from old.joining_date
     or new.rejection_reason is distinct from old.rejection_reason
  then
    raise exception 'Permission denied: only administrators can modify role, account status, department, manager, employee ID, or joining date';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_restricted_columns();

-- ============================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================================

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_requests enable row level security;
alter table public.late_reports enable row level security;
alter table public.holidays enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

-- ============================================================================
-- 4. DEPARTMENTS POLICIES
-- ============================================================================

drop policy if exists "departments_public_read_active" on public.departments;
create policy "departments_public_read_active"
  on public.departments for select
  using (is_active = true or public.is_admin());

drop policy if exists "departments_admin_insert" on public.departments;
create policy "departments_admin_insert"
  on public.departments for insert
  with check (public.is_admin());

drop policy if exists "departments_admin_update" on public.departments;
create policy "departments_admin_update"
  on public.departments for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "departments_admin_delete" on public.departments;
create policy "departments_admin_delete"
  on public.departments for delete
  using (public.is_admin());

-- ============================================================================
-- 5. PROFILES POLICIES
-- ============================================================================

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "profiles_select_manager_team" on public.profiles;
create policy "profiles_select_manager_team"
  on public.profiles for select
  using (public.is_active_user() and public.is_manager_of(id));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id and public.is_active_user())
  with check (auth.uid() = id and public.is_active_user());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 6. ATTENDANCE POLICIES
-- ============================================================================

drop policy if exists "attendance_select_own" on public.attendance;
create policy "attendance_select_own"
  on public.attendance for select
  using (auth.uid() = employee_id and public.is_active_user());

drop policy if exists "attendance_select_manager_team" on public.attendance;
create policy "attendance_select_manager_team"
  on public.attendance for select
  using (public.is_active_user() and public.is_manager_of(employee_id));

drop policy if exists "attendance_select_admin" on public.attendance;
create policy "attendance_select_admin"
  on public.attendance for select
  using (public.is_admin());

drop policy if exists "attendance_insert_own" on public.attendance;
create policy "attendance_insert_own"
  on public.attendance for insert
  with check (auth.uid() = employee_id and public.is_active_user());

drop policy if exists "attendance_update_own_checkout" on public.attendance;
create policy "attendance_update_own_checkout"
  on public.attendance for update
  using (auth.uid() = employee_id and public.is_active_user() and check_out is null)
  with check (auth.uid() = employee_id and public.is_active_user());

drop policy if exists "attendance_admin_all" on public.attendance;
create policy "attendance_admin_all"
  on public.attendance for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 7. LEAVE TYPES POLICIES
-- ============================================================================

drop policy if exists "leave_types_read_active" on public.leave_types;
create policy "leave_types_read_active"
  on public.leave_types for select
  using (auth.uid() is not null and (is_active = true or public.is_admin()));

drop policy if exists "leave_types_admin_all" on public.leave_types;
create policy "leave_types_admin_all"
  on public.leave_types for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 8. LEAVE REQUESTS POLICIES
-- ============================================================================

drop policy if exists "leave_select_own" on public.leave_requests;
create policy "leave_select_own"
  on public.leave_requests for select
  using (auth.uid() = employee_id and public.is_active_user());

drop policy if exists "leave_select_manager_team" on public.leave_requests;
create policy "leave_select_manager_team"
  on public.leave_requests for select
  using (public.is_active_user() and public.is_manager_of(employee_id));

drop policy if exists "leave_select_admin" on public.leave_requests;
create policy "leave_select_admin"
  on public.leave_requests for select
  using (public.is_admin());

drop policy if exists "leave_insert_own" on public.leave_requests;
create policy "leave_insert_own"
  on public.leave_requests for insert
  with check (
    auth.uid() = employee_id
    and public.is_active_user()
    and status = 'PENDING'
  );

drop policy if exists "leave_update_own_pending" on public.leave_requests;
create policy "leave_update_own_pending"
  on public.leave_requests for update
  using (
    auth.uid() = employee_id
    and public.is_active_user()
    and status = 'PENDING'
  )
  with check (
    auth.uid() = employee_id
    and public.is_active_user()
    and status = 'PENDING'
  );

drop policy if exists "leave_delete_own_pending" on public.leave_requests;
create policy "leave_delete_own_pending"
  on public.leave_requests for delete
  using (
    auth.uid() = employee_id
    and public.is_active_user()
    and status = 'PENDING'
  );

drop policy if exists "leave_manager_review" on public.leave_requests;
create policy "leave_manager_review"
  on public.leave_requests for update
  using (
    public.is_active_user()
    and public.is_manager_of(employee_id)
    and employee_id <> auth.uid()
  )
  with check (
    public.is_active_user()
    and public.is_manager_of(employee_id)
    and employee_id <> auth.uid()
  );

drop policy if exists "leave_admin_all" on public.leave_requests;
create policy "leave_admin_all"
  on public.leave_requests for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 9. LATE REPORTS POLICIES
-- ============================================================================

drop policy if exists "late_select_own" on public.late_reports;
create policy "late_select_own"
  on public.late_reports for select
  using (auth.uid() = employee_id and public.is_active_user());

drop policy if exists "late_select_manager_team" on public.late_reports;
create policy "late_select_manager_team"
  on public.late_reports for select
  using (public.is_active_user() and public.is_manager_of(employee_id));

drop policy if exists "late_select_admin" on public.late_reports;
create policy "late_select_admin"
  on public.late_reports for select
  using (public.is_admin());

drop policy if exists "late_insert_own" on public.late_reports;
create policy "late_insert_own"
  on public.late_reports for insert
  with check (
    auth.uid() = employee_id
    and public.is_active_user()
    and status = 'PENDING'
  );

drop policy if exists "late_manager_review" on public.late_reports;
create policy "late_manager_review"
  on public.late_reports for update
  using (
    public.is_active_user()
    and public.is_manager_of(employee_id)
    and employee_id <> auth.uid()
  )
  with check (
    public.is_active_user()
    and public.is_manager_of(employee_id)
    and employee_id <> auth.uid()
  );

drop policy if exists "late_admin_all" on public.late_reports;
create policy "late_admin_all"
  on public.late_reports for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 10. HOLIDAYS POLICIES
-- ============================================================================

drop policy if exists "holidays_read_authenticated" on public.holidays;
create policy "holidays_read_authenticated"
  on public.holidays for select
  using (public.is_active_user() or public.is_admin());

drop policy if exists "holidays_admin_all" on public.holidays;
create policy "holidays_admin_all"
  on public.holidays for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 11. NOTIFICATIONS POLICIES
-- ============================================================================

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all"
  on public.notifications for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 12. AUDIT LOGS POLICIES (Only Admin can read; writes happen via trusted server/service role)
-- ============================================================================

drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select"
  on public.audit_logs for select
  using (public.is_admin());

-- ============================================================================
-- 13. APP SETTINGS POLICIES
-- ============================================================================

drop policy if exists "app_settings_read_active" on public.app_settings;
create policy "app_settings_read_active"
  on public.app_settings for select
  using (public.is_active_user() or public.is_admin());

drop policy if exists "app_settings_admin_all" on public.app_settings;
create policy "app_settings_admin_all"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- 14. SAFE TEAM OVERVIEW RPC (Exposes only permitted fields, no private reasons/attachments)
-- ============================================================================

create or replace function public.get_team_overview(target_date date)
returns table (
  employee_id uuid,
  full_name text,
  designation text,
  department_id uuid,
  department_name text,
  avatar_url text,
  attendance_status text,
  check_in timestamptz,
  late_minutes integer,
  on_approved_leave boolean,
  leave_type_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  show_checkin boolean := true;
begin
  if not public.is_active_user() then
    raise exception 'Unauthorized';
  end if;

  select coalesce((value)::boolean, true)
  into show_checkin
  from public.app_settings
  where key = 'team_show_checkin_time';

  return query
  select
    p.id as employee_id,
    p.full_name,
    p.designation,
    p.department_id,
    d.name as department_name,
    p.avatar_url,
    case
      when exists (
        select 1 from public.holidays h where h.holiday_date = target_date
      ) and a.id is null then 'HOLIDAY'
      when lr.id is not null then 'LEAVE'
      when a.id is not null then a.status::text
      else 'NOT_CHECKED_IN'
    end as attendance_status,
    case when show_checkin then a.check_in else null end as check_in,
    coalesce(a.late_minutes, 0) as late_minutes,
    (lr.id is not null) as on_approved_leave,
    lt.name as leave_type_name
  from public.profiles p
  left join public.departments d on d.id = p.department_id
  left join public.attendance a on a.employee_id = p.id and a.attendance_date = target_date
  left join public.leave_requests lr on lr.employee_id = p.id
    and lr.status = 'APPROVED'
    and target_date between lr.start_date and lr.end_date
  left join public.leave_types lt on lt.id = lr.leave_type_id
  where p.account_status = 'ACTIVE'
  order by p.full_name asc;
end;
$$;

-- ============================================================================
-- 15. STORAGE BUCKETS & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('attachments', 'attachments', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "avatars_read_authenticated" on storage.objects;
create policy "avatars_read_authenticated"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatars_upload_own" on storage.objects;
create policy "avatars_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments_read_owner_or_reviewer" on storage.objects;
create policy "attachments_read_owner_or_reviewer"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and auth.uid() is not null
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or public.is_manager_of(((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "attachments_upload_own" on storage.objects;
create policy "attachments_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
-- Development Seed Data (Departments & Sample Holidays)
-- Run this in Supabase SQL Editor after migrations 0001 and 0002.

insert into public.departments (name, description, is_active)
values
  ('Development', 'Software Engineering and Product', true),
  ('Sales', 'Business Development and Account Management', true),
  ('Marketing', 'Brand, Growth, and Communications', true),
  ('HR', 'People Operations and Talent', true),
  ('Finance', 'Accounting and Financial Planning', true),
  ('Operations', 'Workplace and IT Operations', true)
on conflict (name) do nothing;

insert into public.holidays (holiday_date, name, description)
values
  ('2026-01-26', 'Republic Day', 'National Holiday'),
  ('2026-08-15', 'Independence Day', 'National Holiday'),
  ('2026-10-02', 'Gandhi Jayanti', 'National Holiday'),
  ('2026-11-08', 'Diwali', 'Office Holiday')
on conflict (holiday_date) do nothing;
