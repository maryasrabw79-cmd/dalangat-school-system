import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://maryasrabw79-cmd.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const loginEmail = (nationalId: string) => `staff_${nationalId}@login.dalangat-school.com`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "إعدادات خادم الحسابات غير مكتملة." }, 500);

  let input: { action?: string; national_id?: string; password?: string };
  try { input = await req.json(); } catch { return json({ error: "بيانات الطلب غير صحيحة." }, 400); }

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (input.action !== "activate") return json({ error: "العملية المطلوبة غير مدعومة." }, 400);
  const nationalId = String(input.national_id || "").trim();
  const password = String(input.password || "");
  if (!/^\d{14}$/.test(nationalId) || password.length < 8 || password.length > 128) {
    return json({ error: "الرقم القومي أو كلمة المرور غير صحيحة. كلمة المرور من 8 إلى 128 حرفًا." }, 400);
  }

  const { data: staff, error: lookupError } = await adminClient.from("staff")
    .select("id,full_name,national_id,auth_user_id,activation_used_at,activation_attempts,employment_status")
    .eq("national_id", nationalId).maybeSingle();
  if (lookupError) return json({ error: "تعذر التحقق من سجل الموظف. راجع مدير النظام." }, 500);
  if (!staff || staff.auth_user_id || staff.activation_used_at ||
      (staff.employment_status && staff.employment_status !== "على رأس العمل")) {
    return json({ error: "لا يمكن إنشاء الحساب بهذه البيانات. تأكد أن سجل الموظف معتمد وغير مرتبط بحساب، وراجع مدير النظام." }, 400);
  }

  const attempts = Number(staff.activation_attempts || 0);
  if (attempts >= 5) return json({ error: "تم إيقاف المحاولات لهذا السجل. راجع مدير النظام لإعادة السماح بالتسجيل." }, 429);

  const { error: attemptError } = await adminClient.from("staff")
    .update({ activation_attempts: attempts + 1 })
    .eq("id", staff.id).eq("activation_attempts", attempts).is("auth_user_id", null);
  if (attemptError) return json({ error: "تعذر تسجيل محاولة إنشاء الحساب. أعد المحاولة لاحقًا." }, 500);

  // Reserve this staff row before creating an account to discourage simultaneous claims.
  const { data: reserved, error: reserveError } = await adminClient.from("staff")
    .update({ activation_used_at: new Date().toISOString() })
    .eq("id", staff.id).is("activation_used_at", null).is("auth_user_id", null)
    .select("id").maybeSingle();
  if (reserveError || !reserved) return json({ error: "هذا السجل قيد الاستخدام أو سبق ربطه بحساب. راجع مدير النظام." }, 409);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: loginEmail(nationalId),
    password,
    email_confirm: true,
    user_metadata: { full_name: staff.full_name },
  });
  if (createError || !created.user) {
    await adminClient.from("staff").update({ activation_used_at: null }).eq("id", staff.id).is("auth_user_id", null);
    return json({ error: "تعذر إنشاء الحساب. راجع مدير النظام إذا استمرت المشكلة." }, 400);
  }

  const userId = created.user.id;
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: userId, full_name: staff.full_name, role: "employee",
  }, { onConflict: "id" });
  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    await adminClient.from("staff").update({ activation_used_at: null }).eq("id", staff.id).is("auth_user_id", null);
    return json({ error: "تعذر إكمال ملف الحساب. راجع مدير النظام." }, 500);
  }

  const { data: linked, error: linkError } = await adminClient.from("staff")
    .update({ auth_user_id: userId, activation_used_at: null, activation_code_hash: null, activation_expires_at: null })
    .eq("id", staff.id).is("auth_user_id", null).select("id").maybeSingle();
  if (linkError || !linked) {
    await adminClient.auth.admin.deleteUser(userId);
    await adminClient.from("profiles").delete().eq("id", userId);
    return json({ error: "تعذر ربط الحساب بسجل الموظف. تواصل مع مدير النظام." }, 500);
  }
  return json({ ok: true, message: "تم إنشاء حساب الموظف بنجاح." });
});
