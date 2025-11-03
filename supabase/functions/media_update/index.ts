import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const j = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return j("ok");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return j({ error: "Missing env" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const jwt = authHeader.replace("Bearer ", "");

    const adminUser = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const adminSrv = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null as any);
    if (!body) return j({ error: "Invalid JSON body" }, 400);

    const mediaId = String(body.mediaId || "").trim();
    const childId = String(body.childId || "").trim();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const domain = String(body.domain || "").trim() || null;

    if (!mediaId) return j({ error: "mediaId required" }, 400);

    // Fetch current media (user context)
    const cur = await adminUser.from("media").select("id, storage_path, user_id").eq("id", mediaId).single();
    if (cur.error || !cur.data) return j({ error: "media not found or not allowed" }, 404);

    let newPath: string | null = null;

    if (body.data) {
      // New image provided (base64)
      const fileType = String(body.fileType || "image/jpeg");
      const fileName = String(body.fileName || "upload.jpg");
      const ext = (fileType.includes("/") ? fileType.split("/")[1] : "") || (fileName.includes(".") ? fileName.split(".").pop() : "") || "jpg";
      const path = `${cur.data.user_id}/${childId || body.childId || ''}/${crypto.randomUUID()}.${ext}`;
      const base64 = String(body.data);
      const b64 = base64.includes(",") ? base64.split(",").pop()! : base64;
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bin], { type: fileType || "application/octet-stream" });
      const up = await adminSrv.storage.from("child-media").upload(path, blob, { contentType: fileType || "image/jpeg", upsert: true });
      if (up.error) return j({ error: `Storage upload error: ${up.error.message}` }, 400);
      newPath = up.data.path;
      // try to remove old file (best-effort)
      if (cur.data.storage_path) {
        await adminSrv.storage.from("child-media").remove([cur.data.storage_path]);
      }
    }

    const upd = await adminUser
      .from("media")
      .update({
        name: name || undefined,
        description: description || undefined,
        domain: domain || undefined,
        storage_path: newPath || undefined,
      })
      .eq("id", mediaId)
      .select()
      .single();

    if (upd.error) return j({ error: `DB update error: ${upd.error.message}` }, 400);
    return j({ ok: true, media: upd.data, path: newPath ?? cur.data.storage_path }, 200);
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

