"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TemplateSheet, type EditableTemplate } from "./template-sheet";
import { deleteTemplate } from "./actions";

export type TemplateRow = EditableTemplate;

export function TemplatesList({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.category ?? "").toLowerCase().includes(q),
    );
  }, [templates, search]);

  function handleDelete(template: TemplateRow) {
    if (!window.confirm(`ลบแพทเทิร์น "${template.name}"? การลบไม่สามารถย้อนกลับได้`)) return;
    setDeletingId(template.id);
    startTransition(async () => {
      const result = await deleteTemplate(template.id);
      setDeletingId(null);
      if ("error" in result) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  async function handleCopy(template: TemplateRow) {
    await navigator.clipboard.writeText(template.body);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId((id) => (id === template.id ? null : id)), 1500);
  }

  return (
    <div>
      <div className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 sm:w-72">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือหมวดหมู่"
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ไม่พบแพทเทิร์นที่ตรงกับเงื่อนไข
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <div key={template.id} className="flex flex-col rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{template.name}</p>
                {!template.isActive && (
                  <Badge variant="secondary" className="shrink-0 bg-muted text-muted-foreground">
                    ปิดใช้งาน
                  </Badge>
                )}
              </div>
              {template.category && (
                <Badge variant="secondary" className="mt-1.5 w-fit bg-secondary text-primary">
                  {template.category}
                </Badge>
              )}
              <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {template.body}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={() => handleCopy(template)}>
                  {copiedId === template.id ? (
                    <>
                      <Check className="mr-1 size-3.5" />
                      คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3.5" />
                      คัดลอก
                    </>
                  )}
                </Button>
                <TemplateSheet mode="edit" template={template} />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-destructive hover:text-destructive"
                  disabled={isPending && deletingId === template.id}
                  onClick={() => handleDelete(template)}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  ลบ
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
