import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type InstallmentRow = {
  id: string;
  orderId: string;
  sequence: number;
  dueDate: string;
  amount: number;
  status: "pending_review" | "approved" | "rejected";
};

export type CustomerOrder = {
  id: string;
  productId: string;
  productName: string;
  paymentType: "full" | "installment";
  totalAmount: number;
  createdAt: string;
  installments: InstallmentRow[];
  fullPaymentStatus: "pending_review" | "approved" | "rejected" | null;
};

export async function getCustomerOrders(customerId: string): Promise<CustomerOrder[]> {
  const supabase = createSupabaseAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, product_id, payment_type, total_amount, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const productIds = [...new Set(orders.map((o) => o.product_id))];

  const [{ data: products }, { data: installments }, { data: fullSlips }] = await Promise.all([
    supabase.from("products").select("id, name").in("id", productIds),
    supabase
      .from("installments")
      .select("id, order_id, sequence, due_date, amount, status")
      .in("order_id", orderIds)
      .order("sequence", { ascending: true }),
    supabase.from("payment_slips").select("order_id, status").in("order_id", orderIds).is("installment_id", null),
  ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const installmentsByOrder = new Map<string, InstallmentRow[]>();
  for (const inst of installments ?? []) {
    const list = installmentsByOrder.get(inst.order_id) ?? [];
    list.push({
      id: inst.id,
      orderId: inst.order_id,
      sequence: inst.sequence,
      dueDate: inst.due_date,
      amount: Number(inst.amount),
      status: inst.status,
    });
    installmentsByOrder.set(inst.order_id, list);
  }

  const fullSlipStatusByOrder = new Map((fullSlips ?? []).map((s) => [s.order_id, s.status]));

  return orders.map((order) => ({
    id: order.id,
    productId: order.product_id,
    productName: productById.get(order.product_id)?.name ?? "ไม่ทราบรุ่น",
    paymentType: order.payment_type,
    totalAmount: Number(order.total_amount),
    createdAt: order.created_at,
    installments: installmentsByOrder.get(order.id) ?? [],
    fullPaymentStatus: order.payment_type === "full" ? (fullSlipStatusByOrder.get(order.id) ?? null) : null,
  }));
}

export type CustomerInstallment = {
  id: string;
  sequence: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  status: "pending_review" | "approved" | "rejected";
  productName: string;
};

export async function getCustomerInstallment(
  installmentId: string,
  customerId: string,
): Promise<CustomerInstallment | null> {
  const supabase = createSupabaseAdminClient();

  const { data: installment } = await supabase
    .from("installments")
    .select("id, order_id, sequence, due_date, amount, status")
    .eq("id", installmentId)
    .maybeSingle();
  if (!installment) return null;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, product_id")
    .eq("id", installment.order_id)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (!order) return null;

  const [{ data: product }, { count: totalInstallments }] = await Promise.all([
    supabase.from("products").select("name").eq("id", order.product_id).maybeSingle(),
    supabase
      .from("installments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id),
  ]);

  return {
    id: installment.id,
    sequence: installment.sequence,
    totalInstallments: totalInstallments ?? installment.sequence,
    dueDate: installment.due_date,
    amount: Number(installment.amount),
    status: installment.status,
    productName: product?.name ?? "ไม่ทราบรุ่น",
  };
}
