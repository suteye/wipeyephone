"use server";

import { revalidatePath } from "next/cache";
import { requireCustomerAction } from "@/lib/customer-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildInstallmentSchedule,
  INSTALLMENT_SURCHARGE,
  isFrequency,
  isValidInstallmentOption,
  isWeekOption,
} from "@/lib/installment-plan";

export type SubmitPaymentResult = { error: string } | { success: true };

async function uploadSlip(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slip: File,
): Promise<{ path: string } | { error: string }> {
  const ext = slip.name.includes(".") ? slip.name.split(".").pop() : "bin";
  const path = `slips/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("payment-slips").upload(path, slip);
  if (error) return { error: `อัปโหลดสลิปไม่สำเร็จ: ${error.message}` };
  return { path };
}

export async function submitPayment(formData: FormData): Promise<SubmitPaymentResult> {
  const user = await requireCustomerAction();
  const supabase = createSupabaseAdminClient();

  const productId = String(formData.get("productId") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const freqRaw = formData.get("freq") ? String(formData.get("freq")) : null;
  const weeksRaw = formData.get("weeks") ? Number(formData.get("weeks")) : null;
  const transferredAmount = Number(formData.get("amount"));
  const transferredAtRaw = String(formData.get("transferredAt") ?? "");
  const slip = formData.get("slip");

  if (mode !== "full" && mode !== "installment") return { error: "วิธีชำระเงินไม่ถูกต้อง" };
  if (!productId) return { error: "ไม่พบสินค้า" };
  if (!Number.isFinite(transferredAmount) || transferredAmount <= 0) return { error: "กรอกยอดที่โอนให้ถูกต้อง" };
  if (!transferredAtRaw) return { error: "ระบุวันเวลาที่โอน" };
  const transferredAt = new Date(transferredAtRaw);
  if (Number.isNaN(transferredAt.getTime())) return { error: "วันเวลาที่โอนไม่ถูกต้อง" };
  if (!(slip instanceof File) || slip.size === 0) return { error: "กรุณาแนบสลิปการโอนเงิน" };

  const { data: product } = await supabase
    .from("products")
    .select("id, price")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) return { error: "ไม่พบสินค้านี้ หรือสินค้าปิดการขายไปแล้ว" };

  // แผนผ่อนคำนวณจากค่าที่ลูกค้าเลือก (ความถี่/ระยะเวลา) ไม่เชื่อยอด/จำนวนงวดที่ส่งมาจาก client ตรงๆ
  // คำนวณใหม่ฝั่งเซิร์ฟเวอร์เสมอ กันลูกค้าแก้ไข formData ส่งยอดที่ต้องผ่อนน้อยกว่าจริง
  let schedule: { sequence: number; dueDate: string; amount: number }[] = [];
  let totalAmount = Number(product.price);
  if (mode === "installment") {
    if (!isFrequency(freqRaw) || !isWeekOption(weeksRaw)) return { error: "ไม่พบแผนผ่อนชำระ กรุณาเลือกใหม่" };
    totalAmount = Number(product.price) + INSTALLMENT_SURCHARGE;
    if (!isValidInstallmentOption(totalAmount, freqRaw, weeksRaw)) {
      return { error: "แผนผ่อนนี้ไม่ตรงเงื่อนไขขั้นต่ำงวดละ 300 บาท กรุณาเลือกใหม่" };
    }
    schedule = buildInstallmentSchedule(totalAmount, freqRaw, weeksRaw);
  }

  const uploaded = await uploadSlip(supabase, slip);
  if ("error" in uploaded) return uploaded;
  const path = uploaded.path;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      product_id: productId,
      payment_type: mode,
      total_amount: totalAmount,
      plan_id: null,
    })
    .select("id")
    .single();

  if (orderError || !order) return { error: `สร้างคำสั่งซื้อไม่สำเร็จ: ${orderError?.message ?? "unknown error"}` };

  let firstInstallmentId: string | null = null;
  if (schedule.length > 0) {
    const rows = schedule.map((row) => ({
      order_id: order.id,
      sequence: row.sequence,
      due_date: row.dueDate,
      amount: row.amount,
    }));
    const { data: installments, error: installmentsError } = await supabase
      .from("installments")
      .insert(rows)
      .select("id, sequence")
      .order("sequence", { ascending: true });
    if (installmentsError || !installments) {
      return { error: `สร้างตารางผ่อนไม่สำเร็จ: ${installmentsError?.message ?? "unknown error"}` };
    }
    firstInstallmentId = installments[0]?.id ?? null;
  }

  const { error: slipError } = await supabase.from("payment_slips").insert({
    order_id: firstInstallmentId ? null : order.id,
    installment_id: firstInstallmentId,
    image_path: path,
    transferred_amount: transferredAmount,
    transferred_at: transferredAt.toISOString(),
  });

  if (slipError) return { error: `บันทึกหลักฐานการโอนไม่สำเร็จ: ${slipError.message}` };

  revalidatePath("/dashboard");

  return { success: true };
}

export async function submitInstallmentPayment(formData: FormData): Promise<SubmitPaymentResult> {
  const user = await requireCustomerAction();
  const supabase = createSupabaseAdminClient();

  const installmentId = String(formData.get("installmentId") ?? "");
  const transferredAmount = Number(formData.get("amount"));
  const transferredAtRaw = String(formData.get("transferredAt") ?? "");
  const slip = formData.get("slip");

  if (!installmentId) return { error: "ไม่พบงวดที่ต้องชำระ" };
  if (!Number.isFinite(transferredAmount) || transferredAmount <= 0) return { error: "กรอกยอดที่โอนให้ถูกต้อง" };
  if (!transferredAtRaw) return { error: "ระบุวันเวลาที่โอน" };
  const transferredAt = new Date(transferredAtRaw);
  if (Number.isNaN(transferredAt.getTime())) return { error: "วันเวลาที่โอนไม่ถูกต้อง" };
  if (!(slip instanceof File) || slip.size === 0) return { error: "กรุณาแนบสลิปการโอนเงิน" };

  const { data: installment } = await supabase
    .from("installments")
    .select("id, order_id, status")
    .eq("id", installmentId)
    .maybeSingle();
  if (!installment) return { error: "ไม่พบงวดนี้" };
  if (installment.status === "approved") return { error: "งวดนี้ชำระเรียบร้อยแล้ว" };

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", installment.order_id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!order) return { error: "ไม่พบงวดนี้" };

  const uploaded = await uploadSlip(supabase, slip);
  if ("error" in uploaded) return uploaded;

  const { error: slipError } = await supabase.from("payment_slips").insert({
    order_id: null,
    installment_id: installment.id,
    image_path: uploaded.path,
    transferred_amount: transferredAmount,
    transferred_at: transferredAt.toISOString(),
  });

  if (slipError) return { error: `บันทึกหลักฐานการโอนไม่สำเร็จ: ${slipError.message}` };

  revalidatePath("/dashboard");

  return { success: true };
}
