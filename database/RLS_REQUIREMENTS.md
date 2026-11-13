# RLS Requirements

Implement and test RLS before production.

## Profiles
- Authenticated users can read their own profile.
- Employees can read limited approved team profile fields.
- Admins can read/write all profiles.
- Managers can read their assigned team.
- Employees cannot change role, account_status, department_id or manager_id directly.

## Attendance
- Employee can select/insert/update only their own attendance through approved workflows.
- Admin can manage all.
- Manager can read assigned team.
- Attendance uniqueness must be enforced by `(employee_id, attendance_date)`.

## Leave
- Employee can create/read/update their own pending requests.
- Employee cannot approve/reject any request.
- Admin can manage all.
- Manager can review assigned team according to policy.

## Late reports
- Employee can create/read their own.
- Admin can manage all.
- Manager can review assigned team.

## Notifications
- User can read/update read state of their own notifications.
- Admin/server workflows can create notifications.

## Audit logs
- Normal employees must not write arbitrary audit logs.
- Server-side trusted operations should create logs.
- Admin can read audit logs.

Never use a client-supplied role as an authorization source.
