import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProductSheet } from "./product-sheet";
import { ProductsTable, type ProductRow } from "./products-table";
import { type PlanRow } from "./plan-sheet";

export default async function AdminProductsPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, price, stock, condition_note, description, battery_health, is_active, images, videos, cover_image",
    )
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

  const productRows: ProductRow[] = (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    stock: product.stock,
    conditionNote: product.condition_note,
    description: product.description,
    batteryHealth: product.battery_health,
    images: product.images ?? [],
    videos: product.videos ?? [],
    coverImage: product.cover_image,
    isActive: product.is_active,
  }));

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{productRows.length} รายการ</p>
          <h1 className="mt-1 text-2xl font-semibold">สินค้า</h1>
        </div>
        <ProductSheet mode="create" />
      </header>

      {productRows.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีสินค้าในระบบ
        </p>
      ) : (
        <div className="mt-6">
          <ProductsTable products={productRows} planByProductId={planByProductId} />
        </div>
      )}
    </>
  );
}
