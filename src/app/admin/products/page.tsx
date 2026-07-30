import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/mock-data";
import { AddProductSheet } from "./add-product-sheet";
import { PlanSheet, type PlanRow } from "./plan-sheet";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock, condition_note, battery_health, is_active, images, videos")
    .order("created_at", { ascending: false });

  const productIds = (products ?? []).map((p) => p.id);
  const { data: plans } = productIds.length
    ? await supabase
        .from("installment_plans")
        .select("id, product_id, deposit, total_installments, interval_days, installment_amount")
        .in("product_id", productIds)
        .eq("is_active", true)
    : { data: [] as { id: string; product_id: string; deposit: number; total_installments: number; interval_days: number; installment_amount: number }[] };

  const planByProductId = new Map<string, PlanRow>(
    (plans ?? []).map((plan) => [
      plan.product_id,
      {
        id: plan.id,
        deposit: Number(plan.deposit),
        totalInstallments: plan.total_installments,
        intervalDays: plan.interval_days,
        installmentAmount: Number(plan.installment_amount),
      },
    ]),
  );

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{(products ?? []).length} รายการ</p>
          <h1 className="mt-1 text-2xl font-semibold">สินค้า</h1>
        </div>
        <AddProductSheet />
      </header>

      {!products || products.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีสินค้าในระบบ
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-150 text-left text-sm">
            <thead className="border-b bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">สินค้า</th>
                <th className="px-5 py-3 font-medium">ราคา</th>
                <th className="px-5 py-3 font-medium">สต็อก</th>
                <th className="px-5 py-3 font-medium">สภาพ / แบตเตอรี่</th>
                <th className="px-5 py-3 font-medium">สื่อ</th>
                <th className="px-5 py-3 font-medium">แผนผ่อน</th>
                <th className="px-5 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="px-5 py-4 font-medium">{product.name}</td>
                  <td className="px-5 py-4">{money.format(Number(product.price))}</td>
                  <td className="px-5 py-4">{product.stock}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {product.condition_note ?? "-"}
                    {product.battery_health != null ? ` · แบต ${product.battery_health}%` : ""}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {(product.images?.length ?? 0)} รูป · {(product.videos?.length ?? 0)} วิดีโอ
                  </td>
                  <td className="px-5 py-4">
                    <PlanSheet
                      productId={product.id}
                      productName={product.name}
                      price={Number(product.price)}
                      plan={planByProductId.get(product.id) ?? null}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="secondary"
                      className={product.is_active ? "bg-pink-100 text-primary" : "bg-muted text-muted-foreground"}
                    >
                      {product.is_active ? "พร้อมขาย" : "ปิดการขาย"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
