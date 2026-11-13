# Architecture

Browser
  |
  v
Next.js App Router
  |
  +--> Server actions / route handlers
  |
  +--> Supabase Auth
  |
  +--> Supabase PostgreSQL
          |
          +--> RLS
          +--> Attendance
          +--> Leave
          +--> Late reports
          +--> Notifications
          +--> Audit logs

## Principle

Authentication identifies the user.
Authorization decides what the user can do.
Database RLS is the final data-access boundary.
Application/server validation is the business-rule boundary.
UI permissions are only a usability layer.
