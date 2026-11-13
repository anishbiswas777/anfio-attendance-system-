# Test Plan

## Authentication
- Register creates pending account/profile.
- Pending user cannot access employee dashboard.
- Approved user can login.
- Rejected/suspended user is blocked.
- Forgot password works.
- Password change works.

## Attendance
- Check-in creates exactly one record.
- Second check-in is rejected safely.
- Check-out calculates working time.
- Late minutes use configured office start + grace period.
- Duplicate attendance cannot be created.
- Missing checkout can be corrected by authorized user.
- Employee cannot edit another employee's record.

## Leave
- Invalid date range rejected.
- Valid request enters PENDING.
- Employee cannot approve own request.
- Admin approval changes status.
- Rejection requires/records reason.
- Approved leave appears correctly in attendance/team views.

## Late report
- Employee can submit.
- Admin can approve/reject.
- Employee cannot alter another report.
- Reviewed metadata is stored.

## Security
- RLS blocks cross-user access.
- Admin routes reject non-admin users.
- Manager scope is limited to assigned team.
- Service-role key never reaches client bundle.

## UI
- Mobile navigation works.
- Forms have loading/error/success states.
- Empty states are meaningful.
- Keyboard navigation works.
- No broken links/buttons.

## Build gates
- npm run lint
- npm run typecheck
- npm run test
- npm run test:e2e
- npm run build
