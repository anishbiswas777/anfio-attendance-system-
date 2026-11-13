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
