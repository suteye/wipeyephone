"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type TemplateInput = {
  name: string;
  category: string | null;
  body: string;
};

export type TemplateResult = { error: string } | { success: true };

function validateTemplateInput(input: TemplateInput): string | null {
  if (!input.name.trim()) return "กรอกชื่อแพทเทิร์น";
  if (!input.body.trim()) return "กรอกเนื้อหาข้อความ";
  return null;
}

export async function createTemplate(input: TemplateInput): Promise<TemplateResult> {
  await requireAdmin();

  const validationError = validateTemplateInput(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("message_templates").insert({
    name: input.name.trim(),
    category: input.category?.trim() || null,
    body: input.body,
    is_active: true,
  });

  if (error) return { error: `เพิ่มแพทเทิร์นไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/templates");
  return { success: true };
}

export type UpdateTemplateInput = TemplateInput & { id: string; isActive: boolean };

export async function updateTemplate(input: UpdateTemplateInput): Promise<TemplateResult> {
  await requireAdmin();

  const validationError = validateTemplateInput(input);
  if (validationError) return { error: validationError };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("message_templates")
    .update({
      name: input.name.trim(),
      category: input.category?.trim() || null,
      body: input.body,
      is_active: input.isActive,
    })
    .eq("id", input.id);

  if (error) return { error: `บันทึกแพทเทิร์นไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/templates");
  return { success: true };
}

export async function deleteTemplate(id: string): Promise<TemplateResult> {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) return { error: `ลบแพทเทิร์นไม่สำเร็จ: ${error.message}` };

  revalidatePath("/admin/templates");
  return { success: true };
}
