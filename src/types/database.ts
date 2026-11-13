export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "HALF_DAY";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  employee_code: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  designation: string | null;
  manager_id: string | null;
  joining_date: string | null;
  role: UserRole;
  account_status: AccountStatus;
  avatar_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  department?: Department | null;
  manager?: Pick<Profile, "id" | "full_name" | "email" | "designation"> | null;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  working_minutes: number | null;
  late_minutes: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  employee?: Pick<
    Profile,
    "id" | "full_name" | "employee_code" | "email" | "designation" | "department_id"
  > & {
    department?: Pick<Department, "id" | "name"> | null;
  };
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  annual_limit: number | null;
  is_active: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  reason: string;
  attachment_url: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType | null;
  employee?: Pick<
    Profile,
    "id" | "full_name" | "employee_code" | "email" | "designation" | "department_id"
  > & {
    department?: Pick<Department, "id" | "name"> | null;
  };
  reviewer?: Pick<Profile, "id" | "full_name"> | null;
}

export interface LateReport {
  id: string;
  employee_id: string;
  attendance_id: string | null;
  report_date: string;
  expected_arrival: string | null;
  actual_arrival: string | null;
  reason: string;
  description: string | null;
  attachment_url: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: Pick<
    Profile,
    "id" | "full_name" | "employee_code" | "email" | "designation" | "department_id"
  > & {
    department?: Pick<Department, "id" | "name"> | null;
  };
  reviewer?: Pick<Profile, "id" | "full_name"> | null;
}

export interface Holiday {
  id: string;
  holiday_date: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  actor?: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
}

export interface OfficeSettings {
  office_start_time: string;
  office_end_time: string;
  grace_period_minutes: number;
  late_threshold_minutes: number;
  half_day_threshold_minutes: number;
  timezone: string;
  weekend_days: number[];
  allow_past_leave: boolean;
  allow_overlapping_leave: boolean;
  team_show_checkin_time: boolean;
  manager_can_approve_leave: boolean;
  manager_can_approve_late: boolean;
}

export interface TeamOverviewMember {
  employee_id: string;
  full_name: string;
  designation: string | null;
  department_id: string | null;
  department_name: string | null;
  avatar_url: string | null;
  attendance_status: string;
  check_in: string | null;
  late_minutes: number;
  on_approved_leave: boolean;
  leave_type_name: string | null;
}
