import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = "https://maryasrabw79-cmd.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const loginEmail = (nationalId: string) => `staff_${nationalId}@login.dalangat-school.com`;
function generateCode(): string {
  // Six numeric digits; leading zeroes are significant and preserved as text in Excel.
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(value[0] % 1_000_000).padStart(6, "0");
}
async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (req.headers.get("origin") !== ALLOWED_ORIGIN) return json({ error: "مصدر الطلب غير مسموح." }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "إعدادات خادم الحسابات غير مكتملة." }, 500);

  let input: { action?: string; national_id?: string; activation_code?: string; password?: string };
  try { input = await req.json(); } catch { return json({ error: "بيانات الطلب غير صحيحة." }, 400); }

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (input.action === "issue_codes") {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return json({ error: "سجّل الدخول بحساب مدير النظام أولًا." }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "جلسة الدخول غير صالحة. سجّل الدخول مرة أخرى." }, 401);
    const { data: profile, error: profileError } = await adminClient.from("profiles")
      .select("role").eq("id", authData.user.id).maybeSingle();
    if (profileError || profile?.role !== "admin") return json({ error: "هذه العملية متاحة لمدير النظام فقط." }, 403);

    const { data: staffRows, error: staffError } = await adminClient.from("staff")
      .select("id,full_name,employee_no,national_id,auth_user_id,employment_status")
      .not("national_id", "is", null).is("auth_user_id", null)
      .eq("employment_status", "على رأس العمل").order("full_name").limit(1000);
    if (staffError) return json({ error: "تعذر تحميل سجل العاملين لإصدار الرموز." }, 500);

    const codes: Array<{ employee_no: string | null; full_name: string; national_id: string; activation_code: string }> = []
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    for (const staff of (staffRows || [])) {
      const fullName = String(staff.full_name || "").trim();
      const nationalId = String(staff.national_id || "").trim();
      if (!/^\d{14}$/.test(nationalId)) continue;
      const code = generateCode();
      const codeHash = await hashCode(code);
      const { data: updated, error: updateError } = await adminClient.from("staff")
        .update({ activation_code_hash: codeHash, activation_expires_at: expiresAt, activation_used_at: null })
        .eq("id", staff.id).is("auth_user_id", null).is("activation_used_at", null)
        .select("id").maybeSingle();
      if (updateError) return json({ error: "حدث خطأ أثناء حفظ رموز التفعيل. راجع مدير النظام." }, 500);
      if (updated) codes.push({ employee_no: staff.employee_no || null, full_name: fullName && fullName !== "موظف جديد" ? fullName : "بدون اسم مسجل", national_id: nationalId, activation_code: code });
    }
    return json({ ok: true, expires_at: expiresAt, codes });
  }

  if (input.action !== "activate") return json({ error: "العملية المطلوبة غير مدعومة." }, 400);
  const nationalId = String(input.national_id || "").trim();
  const code = String(input.activation_code || "").trim().toUpperCase();
  const password = String(input.password || "");
  if (!/^\d{14}$/.test(nationalId) || !/^\d{6}$/.test(code) || password.length < 8 || password.length > 128) {
    return json({ error: "الرقم القومي أو رمز التفعيل أو كلمة المرور غير صحيحة." }, 400);
  }

  const codeHash = await hashCode(code);
  const { data: staff, error: lookupError } = await adminClient.from("staff")
    .select("id,full_name,national_id,auth_user_id,activation_used_at,activation_code_hash,activation_expires_at,employment_status")
    .eq("national_id", nationalId).maybeSingle();
  if (lookupError) return json({ error: "تعذر التحقق من سجل الموظف. راجع مدير النظام." }, 500);
  const now = new Date();
  if (!staff || staff.auth_user_id || staff.activation_used_at ||
      staff.activation_code_hash !== codeHash ||
      !staff.activation_expires_at || new Date(staff.activation_expires_at).getTime() <= now.getTime() ||
      staff.employment_status !== "على رأس العمل") {
    return json({ error: "تعذر التفعيل. تحقق من الرقم القومي والرمز، أو اطلب رمزًا جديدًا من الإدارة." }, 400);
  }

  // Atomic reservation makes a valid activation code single-use, including concurrent requests.
  const { data: reserved, error: reserveError } = await adminClient.from("staff")
    .update({ activation_used_at: now.toISOString() })
    .eq("id", staff.id).eq("activation_code_hash", codeHash)
    .gt("activation_expires_at", now.toISOString())
    .is("activation_used_at", null).is("auth_user_id", null)
    .select("id").maybeSingle();
  if (reserveError || !reserved) return json({ error: "الرمز غير صالح أو استُخدم بالفعل. اطلب رمزًا جديدًا من الإدارة." }, 409);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: loginEmail(nationalId), password, email_confirm: true,
    user_metadata: { full_name: staff.full_name },
  });
  if (createError || !created.user) {
    await adminClient.from("staff").update({ activation_used_at: null })
      .eq("id", staff.id).eq("activation_code_hash", codeHash).is("auth_user_id", null);
    return json({ error: "تعذر إنشاء الحساب. راجع مدير النظام إذا استمرت المشكلة." }, 400);
  }

  const userId = created.user.id;
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId, full_name: staff.full_name, role: "employee",
  }, { onConflict: "id" });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    await adminClient.from("staff").update({ activation_used_at: null })
      .eq("id", staff.id).eq("activation_code_hash", codeHash).is("auth_user_id", null);
    return json({ error: "تعذر إكمال ملف الحساب. راجع مدير النظام." }, 500);
  }

  const { data: linked, error: linkError } = await adminClient.from("staff")
    .update({ auth_user_id: userId, activation_code_hash: null, activation_expires_at: null })
    .eq("id", staff.id).eq("activation_code_hash", codeHash)
    .not("activation_used_at", "is", null).is("auth_user_id", null)
    .select("id").maybeSingle();
  if (linkError || !linked) {
    // A network/database error can occur after the UPDATE committed. Verify the actual row
    // before deleting the newly created auth user or releasing the activation reservation.
    const { data: currentStaff, error: verifyError } = await adminClient.from("staff")
      .select("auth_user_id").eq("id", staff.id).maybeSingle();
    if (verifyError) {
      return json({ error: "تعذر التأكد من حالة ربط الحساب. لا تعِد المحاولة؛ تواصل مع مدير النظام للتحقق من السجل." }, 500);
    }
    if (currentStaff?.auth_user_id === userId) {
      return json({ ok: true, message: "تم إنشاء حساب الموظف بنجاح." });
    }

    await adminClient.auth.admin.deleteUser(userId);
    await adminClient.from("profiles").delete().eq("id", userId);
    // Release only our reservation, and only while the employee remains unlinked.
    await adminClient.from("staff").update({ activation_used_at: null })
      .eq("id", staff.id).eq("activation_code_hash", codeHash).is("auth_user_id", null);
    return json({ error: "تعذر ربط الحساب بسجل الموظف. تواصل مع مدير النظام." }, 500);
  }
  return json({ ok: true, message: "تم إنشاء حساب الموظف بنجاح." });
});
