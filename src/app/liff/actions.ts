"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyLiffIdToken } from "@/lib/liff-verify";
import { createCustomerSession } from "@/lib/customer-session";

export type LiffLoginResult = { error: string } | { success: true };

export async function loginWithLiff(idToken: string): Promise<LiffLoginResult> {
  if (!idToken) return { error: "ไม่พบข้อมูลผู้ใช้จาก LINE" };

  const profile = await verifyLiffIdToken(idToken);
  if (!profile) return { error: "ยืนยันตัวตนจาก LINE ไม่สำเร็จ กรุณาลองใหม่" };

  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("line_user_id", profile.sub)
    .maybeSingle();

  let profileId = existing?.id as string | undefined;

  if (!profileId) {
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({ line_user_id: profile.sub, full_name: profile.name })
      .select("id")
      .single();
    if (error || !created) return { error: `สร้างบัญชีไม่สำเร็จ: ${error?.message ?? "unknown error"}` };
    profileId = created.id as string;
  }

  await createCustomerSession(profileId);

  return { success: true };
}
