"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
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
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createProduct, createUploadUrl } from "./actions";

// อัปโหลดตรงไปที่ Supabase Storage ด้วย signed URL แทนการส่งไฟล์ผ่าน Server Action
// (Server Action มี body size limit ที่ไฟล์วิดีโอมักชนได้ง่าย — ทางนี้ไฟล์ไม่ผ่านเซิร์ฟเวอร์เราเลย)
async function uploadFile(file: File, folder: "images" | "videos") {
  const { path, token, publicUrl } = await createUploadUrl(file.name, folder);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from("product-media").uploadToSignedUrl(path, token, file);
  if (error) throw new Error(`อัปโหลด "${file.name}" ไม่สำเร็จ: ${error.message}`);
  return publicUrl;
}

export function AddProductSheet() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock") || 1);
    const conditionNote = String(formData.get("condition_note") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const batteryHealthRaw = formData.get("battery_health");
    const batteryHealth = batteryHealthRaw ? Number(batteryHealthRaw) : null;

    if (!name) return setError("กรอกชื่อสินค้า");
    if (!Number.isFinite(price) || price <= 0) return setError("กรอกราคาให้ถูกต้อง");

    const imageFiles = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
    const videoFiles = formData.getAll("videos").filter((f): f is File => f instanceof File && f.size > 0);

    setSubmitting(true);
    try {
      const images = await Promise.all(imageFiles.map((file) => uploadFile(file, "images")));
      const videos = await Promise.all(videoFiles.map((file) => uploadFile(file, "videos")));

      const result = await createProduct({
        name,
        price,
        stock,
        conditionNote: conditionNote || null,
        description: description || null,
        batteryHealth,
        images,
        videos,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }

      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="rounded-full" />}>
        <Plus className="mr-1 size-4" />
        เพิ่มสินค้า
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>เพิ่มสินค้าใหม่</SheetTitle>
          <SheetDescription>กรอกข้อมูลเครื่องที่จะลงขาย</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              ชื่อสินค้า
            </label>
            <Input
              id="name"
              name="name"
              className="mt-1.5"
              placeholder="เช่น iPhone 15 Pro 256 GB · Natural Titanium"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className="text-sm font-medium">
                ราคา (บาท)
              </label>
              <Input id="price" name="price" type="number" min="0" step="1" className="mt-1.5" required />
            </div>
            <div>
              <label htmlFor="stock" className="text-sm font-medium">
                จำนวนสต็อก
              </label>
              <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={1} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="condition_note" className="text-sm font-medium">
                สภาพเครื่อง (ป้ายสั้นๆ)
              </label>
              <Input id="condition_note" name="condition_note" className="mt-1.5" placeholder="เช่น สวยมาก" />
            </div>
            <div>
              <label htmlFor="battery_health" className="text-sm font-medium">
                แบตเตอรี่ (%)
              </label>
              <Input id="battery_health" name="battery_health" type="number" min="0" max="100" className="mt-1.5" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              รายละเอียดสินค้า
            </label>
            <textarea
              id="description"
              name="description"
              rows={7}
              className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={"ใส่รายละเอียดยาวๆ ได้เลย เช่น อุปกรณ์ที่ได้รับ อาการเครื่อง จุดนัดรับ ฯลฯ"}
            />
          </div>
          <div>
            <label htmlFor="images" className="text-sm font-medium">
              รูปภาพ (เลือกได้หลายไฟล์)
            </label>
            <input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
              className="mt-1.5 block w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium"
            />
          </div>
          <div>
            <label htmlFor="videos" className="text-sm font-medium">
              วิดีโอ (เลือกได้หลายไฟล์)
            </label>
            <input
              id="videos"
              name="videos"
              type="file"
              accept="video/*"
              multiple
              className="mt-1.5 block w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-sm file:font-medium"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="rounded-full">
              {submitting ? "กำลังอัปโหลด..." : "บันทึกสินค้า"}
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
