import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PendingPayment = {
  id: string;
  customerName: string;
  deviceName: string;
  installmentLabel: string;
  amount: number;
  transferredAt: string;
  status: "pending_review" | "approved" | "rejected";
};

export async function getRecentPaymentSlips(limit = 20): Promise<PendingPayment[]> {
  const supabase = createSupabaseAdminClient();

  const { data: slips } = await supabase
    .from("payment_slips")
    .select("id, order_id, installment_id, transferred_amount, transferred_at, status")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!slips || slips.length === 0) return [];

  const installmentIds = [...new Set(slips.map((s) => s.installment_id).filter((v): v is string => !!v))];
  const { data: installments } = installmentIds.length
    ? await supabase.from("installments").select("id, order_id, sequence").in("id", installmentIds)
    : { data: [] };
  const installmentById = new Map((installments ?? []).map((i) => [i.id, i]));

  const orderIds = [
    ...new Set(
      slips
        .map((s) => s.order_id ?? installmentById.get(s.installment_id ?? "")?.order_id)
        .filter((v): v is string => !!v)
    ),
  ];
  const { data: orders } = orderIds.length
    ? await supabase.from("orders").select("id, customer_id, product_id").in("id", orderIds)
    : { data: [] };
  const orderById = new Map((orders ?? []).map((o) => [o.id, o]));

  const customerIds = [...new Set((orders ?? []).map((o) => o.customer_id))];
  const productIds = [...new Set((orders ?? []).map((o) => o.product_id))];

  const { data: profiles } = customerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", customerIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name").in("id", productIds)
    : { data: [] };
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  return slips.map((slip) => {
    const installment = slip.installment_id ? installmentById.get(slip.installment_id) : undefined;
    const orderId = slip.order_id ?? installment?.order_id;
    const order = orderId ? orderById.get(orderId) : undefined;
    const customer = order ? profileById.get(order.customer_id) : undefined;
    const product = order ? productById.get(order.product_id) : undefined;

    return {
      id: slip.id,
      customerName: customer?.full_name || "ไม่ทราบชื่อ",
      deviceName: product?.name ?? "ไม่ทราบรุ่น",
      installmentLabel: installment ? `งวดที่ ${installment.sequence}` : "ชำระเต็ม",
      amount: Number(slip.transferred_amount),
      transferredAt: slip.transferred_at,
      status: slip.status,
    };
  });
}
