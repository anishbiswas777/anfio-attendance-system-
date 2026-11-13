import { z } from "zod";

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z
      .string()
      .trim()
      .min(7, "Please enter a valid phone number")
      .max(20, "Phone number is too long"),
    employee_code: z
      .string()
      .trim()
      .min(2, "Employee ID is required")
      .max(30, "Employee ID is too long")
      .regex(/^[A-Za-z0-9_-]+$/, "Employee ID can only contain letters, numbers, hyphens, and underscores"),
    department_id: z.string().uuid("Please select a valid department"),
    designation: z
      .string()
      .trim()
      .min(2, "Designation is required")
      .max(80, "Designation is too long"),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid joining date"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  phone: z.string().trim().min(7, "Valid phone number required").max(20),
  designation: z.string().trim().min(2, "Designation is required").max(80),
});

export const leaveRequestSchema = z
  .object({
    leave_type_id: z.string().uuid("Please select a leave type"),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
    is_half_day: z.boolean().default(false),
    reason: z
      .string()
      .trim()
      .min(5, "Please provide a reason (at least 5 characters)")
      .max(1000, "Reason is too long"),
    attachment_url: z.string().optional().nullable(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date cannot be before start date",
    path: ["end_date"],
  })
  .refine((data) => !data.is_half_day || data.start_date === data.end_date, {
    message: "Half-day leave must be on a single day",
    path: ["end_date"],
  });

export const lateReportSchema = z.object({
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  expected_arrival: z.string().trim().min(1, "Expected arrival time is required"),
  actual_arrival: z.string().trim().min(1, "Actual arrival time is required"),
  reason: z.string().trim().min(2, "Please select a reason"),
  description: z.string().trim().max(1000).optional().nullable(),
  attachment_url: z.string().optional().nullable(),
});

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    rejection_reason: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) =>
      data.decision !== "REJECTED" ||
      (data.rejection_reason && data.rejection_reason.length >= 3),
    {
      message: "Please provide a rejection reason (at least 3 characters)",
      path: ["rejection_reason"],
    }
  );

export const attendanceCorrectionSchema = z.object({
  employee_id: z.string().uuid("Valid employee is required"),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  status: z.enum(["PRESENT", "LATE", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY"]),
  remarks: z.string().trim().min(3, "Correction reason is required").max(500),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Department name is required").max(80),
  description: z.string().trim().max(300).optional().nullable(),
  manager_id: z.string().uuid().optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const holidaySchema = z.object({
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  name: z.string().trim().min(2, "Holiday name is required").max(100),
  description: z.string().trim().max(300).optional().nullable(),
});

export const officeSettingsSchema = z.object({
  office_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  office_end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  grace_period_minutes: z.coerce.number().int().min(0).max(120),
  late_threshold_minutes: z.coerce.number().int().min(0).max(180),
  half_day_threshold_minutes: z.coerce.number().int().min(60).max(480),
  timezone: z.string().trim().min(3),
  weekend_days: z.array(z.number().int().min(0).max(6)),
  allow_past_leave: z.boolean(),
  allow_overlapping_leave: z.boolean(),
  team_show_checkin_time: z.boolean(),
  manager_can_approve_leave: z.boolean(),
  manager_can_approve_late: z.boolean(),
});

export const adminEmployeeUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional().nullable(),
  employee_code: z.string().trim().min(2).max(30),
  department_id: z.string().uuid().optional().nullable().or(z.literal("")),
  designation: z.string().trim().max(80).optional().nullable(),
  manager_id: z.string().uuid().optional().nullable().or(z.literal("")),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal("")),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  account_status: z.enum(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED"]),
});
