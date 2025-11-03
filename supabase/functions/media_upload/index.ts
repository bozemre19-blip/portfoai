import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing SUPABASE_URL or SERVICE_ROLE_KEY" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const jwt = authHeader.replace("Bearer ", "");

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const userRes = await admin.auth.getUser(jwt);
    if (userRes.error || !userRes.data?.user) {
      return json({ error: "Invalid token" }, 401);
    }
    const user = userRes.data.user;

    // Expect JSON body with base64 data
    const body = await req.json();
    const childId = String(body.childId || "").trim();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const domain = String(body.domain || "").trim() || null;
    const fileName = String(body.fileName || "upload.jpg");
    const fileType = String(body.fileType || "image/jpeg");
    const dataUrl = String(body.data || "");

    if (!dataUrl || !childId || !name) {
      return json({ error: "data (base64), childId and name are required" }, 400);
    }

    const extFromType = fileType.includes('/') ? fileType.split('/')[1] : 'jpg';
    const uuid = crypto.randomUUID();
    const path = `${user.id}/${childId}/${uuid}.${extFromType}`;

    const base64 = dataUrl.includes(',') ? dataUrl.split(',').pop()! : dataUrl;
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob = new Blob([binary], { type: fileType || 'application/octet-stream' });

    const upload = await admin.storage
      .from("child-media")
      .upload(path, blob, { contentType: fileType || "image/jpeg", upsert: true });

    if (upload.error) {
      return json({ error: upload.error.message }, 400);
    }

    const insert = await admin.from("media").insert({
      child_id: childId,
      user_id: user.id,
      type: "image",
      storage_path: upload.data.path,
      name,
      description: description || null,
      domain: domain || null,
    }).select().single();

    if (insert.error) {
      return json({ error: insert.error.message }, 400);
    }

    return json({ ok: true, path: upload.data.path, media: insert.data });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
