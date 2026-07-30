"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyLiffIdToken } from "@/lib/liff-verify";
import { createCustomerSession } from "@/lib/customer-session";

export type LiffLoginResult = { error: string } | { success: true };

export async function loginWithLiff(idToken: string): Promise<LiffLoginResult> {
  if (!idToken) return { error: "ไม่พบข้อมูลผู้ใช้จาก LINE" };

  try {
    const profile = await verifyLiffIdToken(idToken);
    if (!profile) return { error: "ยืนยันตัวตนจาก LINE ไม่สำเร็จ กรุณาลองใหม่ (ดู log คำว่า [liff-verify] ใน Vercel)" };

    const supabase = createSupabaseAdminClient();

    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("line_user_id", profile.sub)
      .maybeSingle();
    if (selectError) {
      console.error("[liff-login] select profile failed:", selectError);
      return { error: `ค้นหาบัญชีไม่สำเร็จ: ${selectError.message}` };
    }

    let profileId = existing?.id as string | undefined;

    if (!profileId) {
      const { data: created, error } = await supabase
        .from("profiles")
        .insert({ line_user_id: profile.sub, full_name: profile.name })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[liff-login] insert profile failed:", error);
        return { error: `สร้างบัญชีไม่สำเร็จ: ${error?.message ?? "unknown error"}` };
      }
      profileId = created.id as string;
    }

    await createCustomerSession(profileId);

    return { success: true };
  } catch (err) {
    console.error("[liff-login] unexpected error:", err);
    return { error: err instanceof Error ? `เข้าสู่ระบบไม่สำเร็จ: ${err.message}` : "เข้าสู่ระบบไม่สำเร็จ" };
  }
}
