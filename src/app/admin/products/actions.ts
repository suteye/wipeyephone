"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createUploadUrl(fileName: string, folder: "images" | "videos") {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage.from("product-media").createSignedUploadUrl(path);
  if (error || !data) throw new Error(`ขอลิงก์อัปโหลดไม่สำเร็จ: ${error?.message ?? "unknown error"}`);

  const { data: publicUrlData } = supabase.storage.from("product-media").getPublicUrl(path);

  return { path, token: data.token, publicUrl: publicUrlData.publicUrl };
}

export type CreateProductInput = {
  name: string;
  price: number;
  stock: number;
  conditionNote: string | null;
  description: string | null;
  batteryHealth: number | null;
  images: string[];
  videos: string[];
};

export type CreateProductResult = { error: string } | { success: true };

export async function createProduct(input: CreateProductInput): Promise<CreateProductResult> {
  await requireAdmin();

  if (!input.name) return { error: "กรอกชื่อสินค้า" };
  if (!Number.isFinite(input.price) || input.price <= 0) return { error: "กรอกราคาให้ถูกต้อง" };
  if (!Number.isFinite(input.stock) || input.stock < 0) return { error: "กรอกจำนวนสต็อกให้ถูกต้อง" };
  if (
    input.batteryHealth !== null &&
    (!Number.isFinite(input.batteryHealth) || input.batteryHealth < 0 || input.batteryHealth > 100)
  ) {
    return { error: "สุขภาพแบตเตอรี่ต้องอยู่ระหว่าง 0-100" };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").insert({
    name: input.name,
    price: input.price,
    stock: input.stock,
    condition_note: input.conditionNote,
    description: input.description,
    battery_health: input.batteryHealth,
    images: input.images,
    videos: input.videos,
    is_active: true,
  });

  if (error) return { error: `เพิ่มสินค้าไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/products");
  revalidatePath("/admin");

  return { success: true };
}

export type UpsertPlanInput = {
  productId: string;
  deposit: number;
  totalInstallments: number;
  intervalDays: number;
  installmentAmount: number;
};

export type UpsertPlanResult = { error: string } | { success: true };

export async function upsertInstallmentPlan(input: UpsertPlanInput): Promise<UpsertPlanResult> {
  await requireAdmin();

  if (!Number.isFinite(input.deposit) || input.deposit < 0) return { error: "กรอกมัดจำให้ถูกต้อง" };
  if (!Number.isInteger(input.totalInstallments) || input.totalInstallments <= 0) {
    return { error: "กรอกจำนวนงวดให้ถูกต้อง" };
  }
  if (!Number.isInteger(input.intervalDays) || input.intervalDays <= 0) {
    return { error: "กรอกจำนวนวันต่องวดให้ถูกต้อง" };
  }
  if (!Number.isFinite(input.installmentAmount) || input.installmentAmount <= 0) {
    return { error: "ยอดผ่อนต่องวดไม่ถูกต้อง" };
  }

  const supabase = createSupabaseAdminClient();

  // เก็บแผนผ่อนที่ใช้งานอยู่ได้ทีละ 1 แผนต่อสินค้า — ปิดแผนเดิมก่อนสร้างแผนใหม่
  const { error: deactivateError } = await supabase
    .from("installment_plans")
    .update({ is_active: false })
    .eq("product_id", input.productId)
    .eq("is_active", true);
  if (deactivateError) return { error: `บันทึกแผนผ่อนไม่สำเร็จ: ${deactivateError.message}` };

  const { error } = await supabase.from("installment_plans").insert({
    product_id: input.productId,
    deposit: input.deposit,
    total_installments: input.totalInstallments,
    interval_days: input.intervalDays,
    installment_amount: input.installmentAmount,
    is_active: true,
  });

  if (error) return { error: `บันทึกแผนผ่อนไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/products");

  return { success: true };
}

export async function deactivateInstallmentPlan(planId: string): Promise<UpsertPlanResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("installment_plans").update({ is_active: false }).eq("id", planId);
  if (error) return { error: `ปิดแผนผ่อนไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/products");

  return { success: true };
}
