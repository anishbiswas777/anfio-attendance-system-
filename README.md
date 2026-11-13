# Anfio — Attendance & Team Management System

Production-ready Employee Attendance, Leave, Late Report, and Team Management System built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase (Auth, PostgreSQL, Row Level Security, Storage).

## Features

- **Authentication & Onboarding**: Employee registration (`PENDING` status), Admin approval/rejection with optional reason, Login/Logout, Forgot Password, Reset Password, Change Password, and Suspended/Rejected account blocking.
- **Attendance**: Timezone-accurate Check-In & Check-Out (`Asia/Kolkata` default, configurable), automated late-minute & working-hour calculation, duplicate check-in prevention (`UNIQUE(employee_id, attendance_date)`), interactive monthly calendar, and audited Admin attendance corrections.
- **Leave & Late Reports**: Leave requests with weekend/holiday-aware day calculation, overlap & past-date policy checks, half-day support, optional secure attachments, and Manager/Admin approval workflows with rejection reasons.
- **Team Visibility**: Privacy-first `/team` view powered by `get_team_overview()` RPC — shows permitted status and approved leave type without exposing private leave reasons or attachments.
- **Admin Portal**: Live KPI dashboard, department attendance breakdown, employee management (search, filter, pagination, role/manager/department/status updates), department & holiday management, configurable office settings, immutable audit logs, and CSV / Excel / PDF report exports.
- **Security**: Supabase Auth + server-side session & role checks + PostgreSQL Row Level Security (RLS) + restricted profile column protection trigger + private storage buckets.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TIMEZONE=Asia/Kolkata
```

> **Security:** Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Supabase Setup

1. Create a new Supabase project.
2. Open the **SQL Editor** in Supabase and run the migrations in order:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
3. Optionally run `supabase/seed.sql` to populate initial departments and sample holidays.
4. In **Authentication → URL Configuration**, add your site URL and redirect URLs:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-domain.vercel.app/api/auth/callback`
5. Verify that the `avatars` and `attachments` private buckets were created in **Storage**.

## First Admin Bootstrap

Public registration always assigns `role = 'EMPLOYEE'` and `account_status = 'PENDING'`. Create the initial administrator securely using the bootstrap script:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
ADMIN_EMAIL="admin@company.com" \
ADMIN_PASSWORD="StrongPassword123" \
ADMIN_NAME="System Administrator" \
node scripts/bootstrap-admin.mjs
```

## Installation & Development

```bash
npm install
npm run dev
```

## Testing & Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

## Deployment (Vercel + Supabase)

1. Push the repository to GitHub.
2. Import the project in **Vercel**.
3. Set all environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.
