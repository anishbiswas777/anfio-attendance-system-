import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { reviewDecisionSchema } from "@/lib/validations/schemas";
import { createAuditLog } from "@/lib/audit/logger";
import { notifyUser } from "@/lib/notifications/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();

    // Allow rejection with optional reason for registrations
    const decision = body?.decision;
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json(
        { error: "Decision must be APPROVED or REJECTED." },
        { status: 400 }
      );
    }

    if (decision === "REJECTED" && body?.rejection_reason) {
      const check = reviewDecisionSchema.safeParse({
        decision: "REJECTED",
        rejection_reason: body.rejection_reason,
      });
      if (!check.success) {
        return NextResponse.json(
          { error: check.error.issues[0]?.message || "Invalid rejection reason." },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();
    const { data: target, error: fetchError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !target) {
      return NextResponse.json(
        { error: "Registration record not found." },
        { status: 404 }
      );
    }

    if (target.account_status !== "PENDING") {
      return NextResponse.json(
        { error: "This registration has already been processed." },
        { status: 409 }
      );
    }

    const nextStatus = decision === "APPROVED" ? "ACTIVE" : "REJECTED";
    const rejectionReason =
      decision === "REJECTED" ? String(body?.rejection_reason || "").trim() || null : null;

    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({
        account_status: nextStatus,
        rejection_reason: rejectionReason,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Unable to update registration status." },
        { status: 500 }
      );
    }

    await Promise.all([
      createAuditLog({
        actorId: auth.profile.id,
        action:
          decision === "APPROVED"
            ? "REGISTRATION_APPROVED"
            : "REGISTRATION_REJECTED",
        entityType: "profile",
        entityId: id,
        oldData: { account_status: "PENDING" },
        newData: { account_status: nextStatus, rejection_reason: rejectionReason },
      }),
      notifyUser({
        userId: id,
        title:
          decision === "APPROVED"
            ? "Account Approved"
            : "Registration Rejected",
        message:
          decision === "APPROVED"
            ? "Welcome! Your employee account has been approved. You can now access the dashboard."
            : `Your registration was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        type: decision === "APPROVED" ? "SUCCESS" : "ERROR",
        link: decision === "APPROVED" ? "/dashboard" : undefined,
      }),
    ]);

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error("[admin registrations PATCH] Error:", err);
    return NextResponse.json(
      { error: "Unable to process registration." },
      { status: 500 }
    );
  }
}
