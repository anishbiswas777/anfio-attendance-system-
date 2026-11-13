#!/usr/bin/env node
/**
 * Secure First-Admin Bootstrap Script
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="System Admin" node scripts/bootstrap-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_NAME || "System Administrator";
const employeeCode = process.env.ADMIN_CODE || "ADMIN-001";

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const { data: existingAdmin } = await admin
    .from("profiles")
    .select("id, email")
    .eq("role", "ADMIN")
    .limit(1)
    .maybeSingle();

  if (existingAdmin) {
    console.log(`An ADMIN already exists (${existingAdmin.email}). Skipping bootstrap.`);
    process.exit(0);
  }

  const { data: createdAuth, error: authErr } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authErr || !createdAuth.user) {
    console.error("Failed to create auth user:", authErr?.message);
    process.exit(1);
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: createdAuth.user.id,
    employee_code: employeeCode,
    full_name: fullName,
    email: email.toLowerCase(),
    designation: "System Administrator",
    joining_date: new Date().toISOString().slice(0, 10),
    role: "ADMIN",
    account_status: "ACTIVE",
  });

  if (profileErr) {
    console.error("Failed to create admin profile:", profileErr.message);
    await admin.auth.admin.deleteUser(createdAuth.user.id);
    process.exit(1);
  }

  console.log(`First ADMIN created successfully: ${email}`);
}

run();
