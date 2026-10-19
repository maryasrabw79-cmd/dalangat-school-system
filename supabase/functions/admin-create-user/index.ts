import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "يلزم تسجيل الدخول أولًا." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "إعدادات الوظيفة غير مكتملة في Supabase." }, 500);
  }

  const token = authHeader.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "جلسة الدخول غير صالحة. سجّل الدخول مرة أخرى." }, 401);

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profileError) return json({ error: "تعذر التحقق من صلاحية مسؤول النظام." }, 500);
  if (profile?.role !== "admin") return json({ error: "هذه العملية متاحة لمدير النظام فقط." }, 403);

  let input: { email?: string; full_name?: string; role?: string };
  try { input = await req.json(); } catch { return json({ error: "بيانات الطلب غير صحيحة." }, 400); }
  const fullName = String(input.full_name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const allowedRoles = new Set(["admin", "manager", "principal", "employee", "viewer"]);
  const role = String(input.role ?? "employee");
  if (fullName.length < 2 || fullName.length > 120) return json({ error: "اكتب اسمًا صحيحًا من 2 إلى 120 حرفًا." }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "البريد الإلكتروني غير صحيح." }, 400);
  if (!allowedRoles.has(role)) return json({ error: "الصلاحية المختارة غير معتمدة." }, 400);

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: "https://maryasrabw79-cmd.github.io/dalangat-school-system/",
  });
  if (inviteError || !invited.user) {
    return json({ error: inviteError?.message ?? "تعذر إرسال دعوة البريد الإلكتروني." }, 400);
  }

  const { error: upsertError } = await adminClient.from("profiles").upsert({
    id: invited.user.id,
    full_name: fullName,
    role,
  }, { onConflict: "id" });
  if (upsertError) {
    // Keep the invited auth user; explain that profile assignment needs administrator attention.
    return json({ error: "تم إنشاء الدعوة لكن تعذر حفظ الصلاحية: " + upsertError.message }, 500);
  }

  return json({ ok: true, message: "تم إنشاء الحساب وإرسال دعوة إلى البريد الإلكتروني المحدد." });
});
