// supabase/functions/create-teacher/index.ts
//
// Bu Edge Function faqat "manager" roliga ega foydalanuvchi tomonidan
// chaqirilishi mumkin. U yangi auth.users yozuvini SERVICE_ROLE kaliti bilan
// (faqat server tomonda, frontendda hech qachon ko'rinmaydi) yaratadi va
// public.profiles jadvaliga role='teacher' qo'shadi (trigger orqali avtomatik).
//
// Joylashtirish:
//   supabase functions deploy create-teacher
//
// Frontend uni shunday chaqiradi:
//   supabase.functions.invoke('create-teacher', { body: { email, password, full_name, phone } })

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Chaqiruvchi foydalanuvchining tokenidan uning kim ekanini tekshiramiz
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Avtorizatsiya talab qilinadi" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } =
      await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Foydalanuvchi aniqlanmadi" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Chaqiruvchi manager ekanini tekshiramiz
    const { data: profile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.role !== "manager") {
      return new Response(
        JSON.stringify({
          error: "Faqat menejer yangi o'qituvchi qo'sha oladi",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { email, password, full_name, phone } = await req.json();
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "email, password va full_name majburiy" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Service role bilan admin klient — faqat shu funksiya ichida ishlatiladi
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, phone: phone ?? null, role: "teacher" },
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: created.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
