import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BankAccountSheet } from "./bank-account-sheet";
import { BankAccountsList, type BankAccountRow } from "./bank-accounts-list";

export default async function AdminBankAccountsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("id, bank_name, account_name, account_number, is_active")
    .order("created_at", { ascending: false });

  const rows: BankAccountRow[] = (accounts ?? []).map((a) => ({
    id: a.id,
    bankName: a.bank_name,
    accountName: a.account_name,
    accountNumber: a.account_number,
    isActive: a.is_active,
  }));

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{rows.length} บัญชี</p>
          <h1 className="mt-1 text-2xl font-semibold">บัญชีธนาคาร</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            บัญชีที่ตั้งเป็น &ldquo;ใช้งานอยู่&rdquo; จะแสดงในหน้าแจ้งชำระเงินของลูกค้า
          </p>
        </div>
        <BankAccountSheet mode="create" />
      </header>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชีธนาคาร เพิ่มบัญชีแรกเพื่อให้ลูกค้าโอนเงินเข้าได้
        </p>
      ) : (
        <div className="mt-6">
          <BankAccountsList accounts={rows} />
        </div>
      )}
    </>
  );
}
