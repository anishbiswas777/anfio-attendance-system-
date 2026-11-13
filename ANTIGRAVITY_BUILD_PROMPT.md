# ANTIGRAVITY MASTER BUILD PROMPT

You are a senior full-stack engineer, product designer, QA engineer and security engineer.
Build the Attendance & Team Management System in this repository as a complete, production-ready
web application. Do not stop at mockups, placeholder pages, static JSON, fake buttons, or
non-functional CRUD.

## Primary objective
Create a secure office attendance/team-management application where employees can register,
wait for admin approval, log in, manage their profile/password, check in/out, submit late
reports and leave requests, view approved team attendance/leave/late information, and where
admins/managers can review, approve, correct, report on and manage the entire system.

## Technology
Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- Zod for validation
- React Hook Form where useful
- date-fns or an equivalent date library
- Server-side authorization for sensitive mutations
- Vercel-compatible deployment

Do not introduce unnecessary dependencies.

## Non-negotiable engineering rules
1. No fake/mock data in production paths.
2. Every button must perform a real action or be clearly disabled with a reason.
3. Every form needs validation, loading state, success state and useful error state.
4. Never store plaintext passwords.
5. Never trust role/employee_id values supplied by the browser.
6. Enforce authorization in the database with RLS and in server-side application logic.
7. Employees must never be able to edit another employee's attendance or requests.
8. Approved leave should affect attendance calculations correctly.
9. Attendance corrections must create audit-log records.
10. Admin-only operations must be protected on both UI and backend.
11. Handle timezone consistently. Default office timezone: Asia/Kolkata, configurable later.
12. Use database constraints to prevent duplicate attendance for the same employee/date.
13. Prevent invalid date ranges and overlapping leave where policy disallows it.
14. Do not expose service-role secrets to the browser.
15. Do not commit `.env` files containing secrets.

## User roles
ADMIN:
- Full system access
- Approve/reject employee registrations
- Manage employees, departments, managers and roles
- Review/approve/reject leave and late reports
- Correct attendance
- Configure office timings, grace period, holidays and policies
- View reports and audit logs

MANAGER:
- View assigned team
- Review team leave/late requests where configured
- View team attendance and analytics
- No access to global admin settings unless explicitly authorized

EMPLOYEE:
- Register
- Login/logout
- Forgot/change password
- Manage allowed profile fields
- Check in/out
- View own attendance/history/calendar
- Submit/view own late reports
- Apply/view own leave
- View approved team-level attendance/leave/late information according to policy

## Registration workflow
New user registration must create a pending employee/account state.
The user must not receive normal employee access until approved by an admin.
Admin can approve or reject with an optional reason.
On approval, activate the employee account and role safely.

## Attendance
Implement:
- Check in
- Check out
- Current-day status
- Working-hours calculation
- Late-minute calculation based on office start time + grace period
- Attendance history
- Calendar view
- Admin correction
- Audit trail
- Duplicate check-in prevention
- Safe handling of missing checkout

Default example settings:
office_start = 09:30
office_end = 18:30
grace_period_minutes = 10
timezone = Asia/Kolkata

Do not hard-code these values in business logic; load them from settings.

## Late reports
Employee submits:
- date
- expected arrival
- actual arrival
- reason
- description
- optional attachment

Statuses:
PENDING, APPROVED, REJECTED

Admin/authorized manager can review.
Keep reviewer, review time and rejection reason.

## Leave
Implement:
- leave types
- start/end date
- total days
- reason
- optional attachment
- PENDING/APPROVED/REJECTED
- approval metadata
- validation against invalid dates
- configurable overlap policy
- approved leave reflected in attendance/status

## Team visibility
Employees may see only the team information that company policy permits.
At minimum show approved leave and basic attendance status.
Do not expose sensitive private reasons, attachments or personal information unnecessarily.

## Dashboard
Employee dashboard:
- today's attendance
- check-in/out actions
- monthly present/late/leave/absent summary
- pending requests
- team status
- notifications

Admin dashboard:
- total employees
- present today
- late today
- on leave
- absent
- pending registrations
- pending late reports
- pending leave requests
- useful charts and recent activity

## Database
Use the SQL blueprint in `database/schema.sql` as the starting point.
Create proper foreign keys, indexes, unique constraints, timestamps and RLS policies.
Use migrations where supported by the project structure.

Core tables:
profiles
departments
attendance
late_reports
leave_types
leave_requests
holidays
notifications
audit_logs
app_settings

You may add supporting tables when justified.

## Security
Implement RLS policies based on authenticated user identity and role.
Do not rely only on frontend route protection.
Validate all server mutations.
Protect admin routes.
Use secure password-reset flow.
Do not leak sensitive fields in team queries.

## UX/UI
Create a polished modern SaaS-style interface:
- responsive desktop/tablet/mobile
- accessible forms
- consistent spacing/typography
- clear status badges
- useful empty states
- confirmation dialogs for destructive actions
- skeleton/loading states
- toast feedback
- accessible keyboard navigation
- dark/light mode
- professional office-product aesthetic

Do not over-design. Prioritize clarity and speed.

## Routes
Implement a clean route structure similar to:
/
 /login
 /register
 /forgot-password
 /reset-password
 /dashboard
 /attendance
 /attendance/history
 /late-reports
 /leave
 /team
 /profile
 /settings

Admin:
 /admin
 /admin/registrations
 /admin/employees
 /admin/attendance
 /admin/late-reports
 /admin/leave
 /admin/departments
 /admin/holidays
 /admin/reports
 /admin/audit-logs
 /admin/settings

## Testing
You are NOT finished until:
- TypeScript passes
- lint passes
- production build passes
- unit tests cover date/time and attendance calculations
- integration tests cover auth/permissions and core workflows
- RLS policies are tested
- registration approval workflow is tested
- attendance duplicate prevention is tested
- leave approval and attendance interaction is tested
- late report workflow is tested
- unauthorized access is tested

Fix all errors found during testing. Do not merely report them.

## Seed/demo
Create a safe development seed strategy with:
- one admin
- one manager
- several employees
- departments
- sample leave types
- sample holidays

Do not hard-code demo credentials into production code.

## Error handling
Use meaningful errors. Never show raw database errors to ordinary users.
Log useful server-side diagnostics without exposing secrets.

## Documentation
Update README with:
- setup
- Supabase configuration
- environment variables
- database migration steps
- local development
- test commands
- deployment
- first-admin bootstrap
- troubleshooting

## Final acceptance checklist
Before declaring completion, verify:
[ ] registration works
[ ] admin approval works
[ ] login/logout works
[ ] password reset works
[ ] employee profile works
[ ] check-in works
[ ] check-out works
[ ] late calculation works
[ ] late report works
[ ] leave request works
[ ] leave approval works
[ ] team visibility works
[ ] admin employee management works
[ ] attendance correction works
[ ] audit log works
[ ] notifications work
[ ] reports work
[ ] RLS blocks unauthorized access
[ ] mobile UI works
[ ] no placeholder functionality remains
[ ] no TypeScript errors
[ ] no lint errors
[ ] production build succeeds
[ ] tests pass

If something is ambiguous, choose the safest production-grade implementation and document the
decision rather than leaving a TODO. Continue iterating until the application is genuinely
functional and tested.
