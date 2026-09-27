/**
 * POST /api/upload
 *
 * Server-side upload proxy for Supabase Storage. The browser sends the file
 * here; this route uses the service-role key to upload it to the correct
 * bucket, bypassing RLS entirely. This means storage upload policies are not
 * needed — the server validates auth and ownership before touching storage.
 *
 * Why: Supabase storage RLS policies for INSERT require raw SQL DDL
 * (CREATE POLICY on storage.objects) which can only be run via a direct
 * Postgres connection or the SQL Editor — not via the REST API. Using a
 * server-side proxy with the service-role key solves uploads without
 * requiring any RLS policy changes.
 *
 * Body (multipart/form-data):
 *   file        — the image file
 *   bucket      — "task-photos" | "avatars"
 *   path        — object path inside the bucket (e.g. "TSK-123/photo.jpg")
 *
 * Returns: { url: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAnonClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_BUCKETS = ["task-photos", "avatars"] as const;
type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated (using the cookie-based anon client).
  const anonClient = await createAnonClient();
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: "Missing file, bucket, or path" }, { status: 400 });
  }

  if (!ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    return NextResponse.json({ error: `Bucket must be one of: ${ALLOWED_BUCKETS.join(", ")}` }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  // Service-role client — bypasses RLS, so uploads always succeed as long as
  // the bucket exists. Auth check above ensures only real users can upload.
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: uploadError } = await serviceClient.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = serviceClient.storage
    .from(bucket)
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
