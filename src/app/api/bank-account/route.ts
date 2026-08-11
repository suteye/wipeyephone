import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ActiveBankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("bank_accounts")
    .select("bank_name, account_name, account_number")
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return Response.json(null);

  const account: ActiveBankAccount = {
    bankName: data.bank_name,
    accountName: data.account_name,
    accountNumber: data.account_number,
  };

  return Response.json(account);
}
