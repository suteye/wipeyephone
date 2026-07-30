"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function approvePaymentSlip(slipId: string) {
  const { user } = await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: slip } = await supabase
    .from("payment_slips")
    .select("installment_id")
    .eq("id", slipId)
    .maybeSingle();

  await supabase
    .from("payment_slips")
    .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", slipId);

  if (slip?.installment_id) {
    await supabase.from("installments").update({ status: "approved" }).eq("id", slip.installment_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

export async function rejectPaymentSlip(slipId: string) {
  const { user } = await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: slip } = await supabase
    .from("payment_slips")
    .select("installment_id")
    .eq("id", slipId)
    .maybeSingle();

  await supabase
    .from("payment_slips")
    .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", slipId);

  if (slip?.installment_id) {
    await supabase.from("installments").update({ status: "rejected" }).eq("id", slip.installment_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}
