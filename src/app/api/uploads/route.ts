import { NextResponse } from "next/server";
import { requireApiActiveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED_BUCKETS = new Set(["avatars", "attachments"]);
const AVATAR_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ATTACHMENT_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const auth = await requireApiActiveUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const bucket = String(formData.get("bucket") ?? "attachments");
    const file = formData.get("file");

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Invalid storage bucket." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Please select a file to upload." }, { status: 400 });
    }

    const allowedMimes = bucket === "avatars" ? AVATAR_MIMES : ATTACHMENT_MIMES;
    const maxBytes = bucket === "avatars" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;

    if (!allowedMimes.has(file.type)) {
      return NextResponse.json(
        {
          error:
            bucket === "avatars"
              ? "Avatar must be JPG, PNG, or WebP."
              : "Attachment must be JPG, PNG, WebP, or PDF.",
        },
        { status: 400 }
      );
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            bucket === "avatars"
              ? "Avatar must be 2 MB or smaller."
              : "Attachment must be 5 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const ext = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "");
    const path = `${auth.profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json(
        { error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }

    if (bucket === "avatars") {
      await admin
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", auth.profile.id);
    }

    const { data: signed } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    return NextResponse.json({
      path,
      signedUrl: signed?.signedUrl ?? null,
    });
  } catch (err) {
    console.error("[uploads POST] Error:", err);
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }
}
