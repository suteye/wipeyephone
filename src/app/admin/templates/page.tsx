import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TemplateSheet } from "./template-sheet";
import { TemplatesList, type TemplateRow } from "./templates-list";

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, name, category, body, is_active")
    .order("created_at", { ascending: false });

  const rows: TemplateRow[] = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    body: t.body,
    isActive: t.is_active,
  }));

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{rows.length} แพทเทิร์น</p>
          <h1 className="mt-1 text-2xl font-semibold">แพทเทิร์นข้อความ</h1>
        </div>
        <TemplateSheet mode="create" />
      </header>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีแพทเทิร์นข้อความ
        </p>
      ) : (
        <div className="mt-6">
          <TemplatesList templates={rows} />
        </div>
      )}
    </>
  );
}
