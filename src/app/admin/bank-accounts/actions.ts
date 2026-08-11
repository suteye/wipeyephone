"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type BankAccountInput = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type BankAccountResult = { error: string } | { success: true };

function validateInput(input: BankAccountInput): string | null {
  if (!input.bankName.trim()) return "กรอกชื่อธนาคาร";
  if (!input.accountName.trim()) return "กรอกชื่อบัญชี";
  if (!input.accountNumber.trim()) return "กรอกเลขบัญชี";
  return null;
}

export async function createBankAccount(input: BankAccountInput): Promise<BankAccountResult> {
  await requireAdmin();

  const validationError = validateInput(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseAdminClient();

  // บัญชีแรกที่เพิ่มให้เป็นบัญชีหลักอัตโนมัติ บัญชีถัดไปแอดมินต้องกดตั้งเป็นบัญชีหลักเอง
  const { count } = await supabase.from("bank_accounts").select("id", { count: "exact", head: true });

  const { error } = await supabase.from("bank_accounts").insert({
    bank_name: input.bankName.trim(),
    account_name: input.accountName.trim(),
    account_number: input.accountNumber.trim(),
    is_active: (count ?? 0) === 0,
  });

  if (error) return { error: `เพิ่มบัญชีไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/bank-accounts");
  return { success: true };
}

export type UpdateBankAccountInput = BankAccountInput & { id: string };

export async function updateBankAccount(input: UpdateBankAccountInput): Promise<BankAccountResult> {
  await requireAdmin();

  const validationError = validateInput(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({
      bank_name: input.bankName.trim(),
      account_name: input.accountName.trim(),
      account_number: input.accountNumber.trim(),
    })
    .eq("id", input.id);

  if (error) return { error: `บันทึกบัญชีไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/bank-accounts");
  return { success: true };
}

export async function setActiveBankAccount(id: string): Promise<BankAccountResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();

  const { error: deactivateError } = await supabase
    .from("bank_accounts")
    .update({ is_active: false })
    .neq("id", id);
  if (deactivateError) return { error: `ตั้งบัญชีหลักไม่สำเร็จ: ${deactivateError.message}` };

  const { error: activateError } = await supabase.from("bank_accounts").update({ is_active: true }).eq("id", id);
  if (activateError) return { error: `ตั้งบัญชีหลักไม่สำเร็จ: ${activateError.message}` };

  revalidatePath("/admin/bank-accounts");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteBankAccount(id: string): Promise<BankAccountResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
  if (error) return { error: `ลบบัญชีไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/bank-accounts");
  return { success: true };
}
