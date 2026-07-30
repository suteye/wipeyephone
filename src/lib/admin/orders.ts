import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OrderRow = {
  orderId: string;
  customerId: string;
  customerName: string;
  deviceName: string;
  amount: number;
  paymentType: "full" | "installment";
  totalInstallments: number;
  paidInstallments: number;
  nextDueDate: string | null;
  overdue: boolean;
  fullPaymentStatus: "pending_review" | "approved" | "rejected" | null;
  createdAt: string;
};

export async function getOrders(): Promise<OrderRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, product_id, payment_type, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const productIds = [...new Set(orders.map((o) => o.product_id))];

  const [{ data: profiles }, { data: products }, { data: installments }, { data: fullSlips }] = await Promise.all([
    customerIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", customerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    productIds.length
      ? supabase.from("products").select("id, name").in("id", productIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    orderIds.length
      ? supabase.from("installments").select("order_id, sequence, due_date, status").in("order_id", orderIds)
      : Promise.resolve({ data: [] as { order_id: string; sequence: number; due_date: string; status: string }[] }),
    orderIds.length
      ? supabase.from("payment_slips").select("order_id, status").in("order_id", orderIds).is("installment_id", null)
      : Promise.resolve({ data: [] as { order_id: string; status: "pending_review" | "approved" | "rejected" }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const installmentsByOrder = new Map<string, { sequence: number; due_date: string; status: string }[]>();
  for (const inst of installments ?? []) {
    const list = installmentsByOrder.get(inst.order_id) ?? [];
    list.push(inst);
    installmentsByOrder.set(inst.order_id, list);
  }

  const fullSlipStatusByOrder = new Map((fullSlips ?? []).map((s) => [s.order_id, s.status]));

  const today = new Date().toISOString().slice(0, 10);

  return orders.map((order) => {
    const orderInstallments = (installmentsByOrder.get(order.id) ?? []).sort((a, b) => a.sequence - b.sequence);
    const paidInstallments = orderInstallments.filter((i) => i.status === "approved").length;
    const nextUnpaid = orderInstallments.find((i) => i.status !== "approved");

    return {
      orderId: order.id,
      customerId: order.customer_id,
      customerName: profileById.get(order.customer_id)?.full_name || "ไม่ทราบชื่อ",
      deviceName: productById.get(order.product_id)?.name ?? "ไม่ทราบรุ่น",
      amount: Number(order.total_amount),
      paymentType: order.payment_type,
      totalInstallments: orderInstallments.length,
      paidInstallments,
      nextDueDate: nextUnpaid?.due_date ?? null,
      overdue: !!nextUnpaid && nextUnpaid.due_date < today,
      fullPaymentStatus: order.payment_type === "full" ? (fullSlipStatusByOrder.get(order.id) ?? null) : null,
      createdAt: order.created_at,
    };
  });
}

export type CustomerSummary = {
  customerId: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  activeInstallmentOrders: number;
  overdueOrders: number;
};

export async function getCustomers(): Promise<CustomerSummary[]> {
  const orders = await getOrders();
  const byCustomer = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const existing = byCustomer.get(order.customerId) ?? {
      customerId: order.customerId,
      name: order.customerName,
      totalOrders: 0,
      totalSpent: 0,
      activeInstallmentOrders: 0,
      overdueOrders: 0,
    };

    existing.totalOrders += 1;
    existing.totalSpent += order.amount;
    if (order.paymentType === "installment" && order.paidInstallments < order.totalInstallments) {
      existing.activeInstallmentOrders += 1;
    }
    if (order.overdue) existing.overdueOrders += 1;

    byCustomer.set(order.customerId, existing);
  }

  return [...byCustomer.values()].sort((a, b) => b.totalSpent - a.totalSpent);
}
