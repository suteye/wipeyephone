import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { getRecentPaymentSlips } from "@/lib/admin/payments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/mock-data";
import { PaymentsTable } from "./payments-table";
import { AddProductSheet } from "./products/add-product-sheet";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const payments = await getRecentPaymentSlips();
  const pendingCount = payments.filter((p) => p.status === "pending_review").length;

  const { count: productsCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: monthlyOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .gte("created_at", startOfMonth.toISOString());
  const monthlySales = (monthlyOrders ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0);

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold">ภาพรวมร้าน</h1>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-sm text-muted-foreground sm:block">{user.name}</p>
          <Button size="icon" variant="outline" className="rounded-full" aria-label="การแจ้งเตือน">
            <Bell className="size-4" />
          </Button>
          <AddProductSheet />
        </div>
      </header>
      <div id="overview" className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">ยอดขายเดือนนี้</p>
          <p className="mt-2 text-2xl font-semibold">{money.format(monthlySales)}</p>
        </div>
        <div className="border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">รอตรวจสอบสลิป</p>
          <p className="mt-2 text-2xl font-semibold">{pendingCount} รายการ</p>
          {pendingCount > 0 && <p className="mt-1 text-xs text-primary">ต้องดำเนินการวันนี้</p>}
        </div>
        <div className="border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">เครื่องพร้อมขาย</p>
          <p className="mt-2 text-2xl font-semibold">{productsCount ?? 0} เครื่อง</p>
        </div>
      </div>
      <section id="payments" className="mt-9">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-primary">การชำระล่าสุด</p>
            <h2 className="mt-1 text-xl font-semibold">ตรวจสอบสลิป</h2>
          </div>
        </div>
        <PaymentsTable data={payments} />
      </section>
    </>
  );
}
