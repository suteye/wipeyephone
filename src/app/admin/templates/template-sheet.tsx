"use client";

import { useRef, useState, type FormEvent } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createTemplate, updateTemplate } from "./actions";

export type EditableTemplate = {
  id: string;
  name: string;
  category: string | null;
  body: string;
  isActive: boolean;
};

type TemplateSheetProps = { mode: "create" } | { mode: "edit"; template: EditableTemplate };

const PLACEHOLDERS = [
  { token: "{{ชื่อลูกค้า}}", label: "ชื่อลูกค้า", sample: "คุณสมชาย" },
  { token: "{{ชื่อสินค้า}}", label: "ชื่อสินค้า", sample: "iPhone 13 128GB" },
  { token: "{{ยอดเงิน}}", label: "ยอดเงิน", sample: "฿4,900" },
  { token: "{{วันครบกำหนด}}", label: "วันครบกำหนด", sample: "5 ส.ค. 2569" },
  { token: "{{งวดที่}}", label: "งวดที่", sample: "2" },
  { token: "{{จำนวนงวด}}", label: "จำนวนงวดทั้งหมด", sample: "3" },
] as const;

function renderPreview(body: string) {
  let text = body;
  for (const p of PLACEHOLDERS) text = text.split(p.token).join(p.sample);
  return text;
}

export function TemplateSheet(props: TemplateSheetProps) {
  const isEdit = props.mode === "edit";
  const template = isEdit ? props.template : null;

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState(template?.body ?? "");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resetLocalState() {
    setBody(template?.body ?? "");
    setError(null);
  }

  function insertPlaceholder(token: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + token);
      return;
    }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const isActive = formData.get("is_active") != null;

    if (!name) return setError("กรอกชื่อแพทเทิร์น");
    if (!body.trim()) return setError("กรอกเนื้อหาข้อความ");

    setSubmitting(true);
    try {
      const input = { name, category: category || null, body };
      const result = isEdit
        ? await updateTemplate({ ...input, id: template!.id, isActive })
        : await createTemplate(input);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      if (!isEdit) {
        form.reset();
        setBody("");
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetLocalState();
      }}
    >
      <SheetTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" className="rounded-full" />
          ) : (
            <Button className="rounded-full" />
          )
        }
      >
        {isEdit ? (
          <>
            <Pencil className="mr-1 size-3.5" />
            แก้ไข
          </>
        ) : (
          <>
            <Plus className="mr-1 size-4" />
            เพิ่มแพทเทิร์น
          </>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "แก้ไขแพทเทิร์น" : "เพิ่มแพทเทิร์นข้อความ"}</SheetTitle>
          <SheetDescription>ตั้งข้อความที่ใช้บ่อย แทรกตัวแปรได้ แล้วคัดลอกไปวางในแชท LINE เอง</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              ชื่อแพทเทิร์น
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={template?.name}
              className="mt-1.5"
              placeholder="เช่น แจ้งเตือนก่อนครบกำหนด"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="text-sm font-medium">
              หมวดหมู่ (ไม่บังคับ)
            </label>
            <Input
              id="category"
              name="category"
              defaultValue={template?.category ?? ""}
              className="mt-1.5"
              placeholder="เช่น ทวงเงิน, ต้อนรับ, อนุมัติแล้ว"
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={template?.isActive}
                className="size-4 rounded border-input"
              />
              เปิดใช้งาน
            </label>
          )}

          <div>
            <label htmlFor="body" className="text-sm font-medium">
              เนื้อหาข้อความ
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary hover:bg-secondary/70"
                >
                  + {p.label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              id="body"
              name="body"
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-2 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={"สวัสดีค่ะ {{ชื่อลูกค้า}} แจ้งเตือนงวดที่ {{งวดที่}} จาก {{จำนวนงวด}} ยอด {{ยอดเงิน}} ครบกำหนด {{วันครบกำหนด}}"}
              required
            />
          </div>

          {body.trim() && (
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">ตัวอย่างข้อความ (ใช้ข้อมูลสมมติ)</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{renderPreview(body)}</p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="rounded-full">
              {submitting ? "กำลังบันทึก..." : "บันทึกแพทเทิร์น"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" className="rounded-full" />}>
              ยกเลิก
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
