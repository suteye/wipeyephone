"use client";

import { useRef, useState, type FormEvent } from "react";
import { Pencil, Plus, Star, Upload, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createProduct, createUploadUrl, deleteProductMedia, updateProduct } from "./actions";

export type EditableProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  conditionNote: string | null;
  description: string | null;
  batteryHealth: number | null;
  images: string[];
  videos: string[];
  coverImage: string | null;
  isActive: boolean;
};

type ProductSheetProps = { mode: "create" } | { mode: "edit"; product: EditableProduct };

// อัปโหลดตรงไปที่ Supabase Storage ด้วย signed URL แทนการส่งไฟล์ผ่าน Server Action
// (Server Action มี body size limit ที่ไฟล์วิดีโอมักชนได้ง่าย — ทางนี้ไฟล์ไม่ผ่านเซิร์ฟเวอร์เราเลย)
async function uploadFile(file: File, folder: "images" | "videos") {
  const { path, token, publicUrl } = await createUploadUrl(file.name, folder);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from("product-media").uploadToSignedUrl(path, token, file);
  if (error) throw new Error(`อัปโหลด "${file.name}" ไม่สำเร็จ: ${error.message}`);
  return { path, publicUrl };
}

export function ProductSheet(props: ProductSheetProps) {
  const isEdit = props.mode === "edit";
  const product = isEdit ? props.product : null;

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [videos, setVideos] = useState<string[]>(product?.videos ?? []);
  const [coverImage, setCoverImage] = useState<string | null>(product?.coverImage ?? product?.images[0] ?? null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ไฟล์ที่อัปโหลดขึ้น storage ระหว่างเปิดฟอร์มนี้ (ยังไม่ได้บันทึกสินค้า) — ถ้าปิดฟอร์ม
  // หรือลบรูปทิ้งก่อนบันทึก ต้องลบไฟล์จริงออกจาก storage ด้วย กันไฟล์ค้าง
  const newUploadsRef = useRef<Map<string, string>>(new Map());

  function resetLocalState() {
    setImages(product?.images ?? []);
    setVideos(product?.videos ?? []);
    setCoverImage(product?.coverImage ?? product?.images[0] ?? null);
    setError(null);
  }

  function discardUnsavedUploads() {
    const paths = [...newUploadsRef.current.values()];
    newUploadsRef.current.clear();
    if (paths.length > 0) void deleteProductMedia(paths);
  }

  async function handleImagesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((f) => f.size > 0);
    if (files.length === 0) return;
    setUploadingImages(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, "images")));
      for (const { path, publicUrl } of uploaded) newUploadsRef.current.set(publicUrl, path);
      setImages((prev) => {
        const next = [...prev, ...uploaded.map((u) => u.publicUrl)];
        setCoverImage((cover) => cover ?? next[0] ?? null);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleVideosSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((f) => f.size > 0);
    if (files.length === 0) return;
    setUploadingVideos(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, "videos")));
      for (const { path, publicUrl } of uploaded) newUploadsRef.current.set(publicUrl, path);
      setVideos((prev) => [...prev, ...uploaded.map((u) => u.publicUrl)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดวิดีโอไม่สำเร็จ");
    } finally {
      setUploadingVideos(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => {
      const next = prev.filter((src) => src !== url);
      setCoverImage((cover) => (cover === url ? (next[0] ?? null) : cover));
      return next;
    });
    const path = newUploadsRef.current.get(url);
    if (path) {
      newUploadsRef.current.delete(url);
      void deleteProductMedia([path]);
    }
  }

  function removeVideo(url: string) {
    setVideos((prev) => prev.filter((src) => src !== url));
    const path = newUploadsRef.current.get(url);
    if (path) {
      newUploadsRef.current.delete(url);
      void deleteProductMedia([path]);
    }
  }

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
    const isActive = formData.get("is_active") != null;

    if (!name) return setError("กรอกชื่อสินค้า");
    if (!Number.isFinite(price) || price <= 0) return setError("กรอกราคาให้ถูกต้อง");

    setSubmitting(true);
    try {
      const input = {
        name,
        price,
        stock,
        conditionNote: conditionNote || null,
        description: description || null,
        batteryHealth,
        images,
        videos,
        coverImage,
      };

      const result = isEdit ? await updateProduct({ ...input, id: product!.id, isActive }) : await createProduct(input);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      // บันทึกสำเร็จแล้ว ไฟล์ที่อัปโหลดระหว่างนี้ถูกอ้างอิงโดยสินค้าแล้ว ไม่ต้องลบทิ้ง
      newUploadsRef.current.clear();

      if (!isEdit) {
        form.reset();
        setImages([]);
        setVideos([]);
        setCoverImage(null);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || uploadingImages || uploadingVideos;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          discardUnsavedUploads();
          resetLocalState();
        }
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
            เพิ่มสินค้า
          </>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "แก้ไขข้อมูลเครื่อง เลือกรูปหน้าปก หรือลบสินค้านี้" : "กรอกข้อมูลเครื่องที่จะลงขาย"}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              ชื่อสินค้า
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
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
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.price}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <label htmlFor="stock" className="text-sm font-medium">
                จำนวนสต็อก
              </label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.stock ?? 1}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="condition_note" className="text-sm font-medium">
                สภาพเครื่อง (ป้ายสั้นๆ)
              </label>
              <Input
                id="condition_note"
                name="condition_note"
                defaultValue={product?.conditionNote ?? ""}
                className="mt-1.5"
                placeholder="เช่น สวยมาก"
              />
            </div>
            <div>
              <label htmlFor="battery_health" className="text-sm font-medium">
                แบตเตอรี่ (%)
              </label>
              <Input
                id="battery_health"
                name="battery_health"
                type="number"
                min="0"
                max="100"
                defaultValue={product?.batteryHealth ?? undefined}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              รายละเอียดสินค้า
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={product?.description ?? ""}
              className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder={"ใส่รายละเอียดยาวๆ ได้เลย เช่น อุปกรณ์ที่ได้รับ อาการเครื่อง จุดนัดรับ ฯลฯ"}
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="is_active" defaultChecked={product?.isActive} className="size-4 rounded border-input" />
              พร้อมขาย (แสดงในหน้าร้าน)
            </label>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="images" className="text-sm font-medium">
                รูปภาพ
              </label>
              {images.length > 0 && <span className="text-xs text-muted-foreground">คลิกรูปเพื่อตั้งเป็นหน้าปก</span>}
            </div>
            {images.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
                    <button
                      type="button"
                      onClick={() => setCoverImage(url)}
                      className="block size-full"
                      aria-label="ตั้งเป็นรูปหน้าปก"
                    >
                      <img src={url} alt="" className="size-full object-cover" />
                    </button>
                    {coverImage === url && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <Star className="size-2.5 fill-current" />
                        หน้าปก
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className={cn(
                        "absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100",
                      )}
                      aria-label="ลบรูปนี้"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label
              htmlFor="images"
              className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50"
            >
              <Upload className="size-4" />
              {uploadingImages ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ"}
            </label>
            <input
              ref={imageInputRef}
              id="images"
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingImages}
              onChange={handleImagesSelected}
              className="sr-only"
            />
          </div>

          <div>
            <label htmlFor="videos" className="text-sm font-medium">
              วิดีโอ
            </label>
            {videos.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {videos.map((url) => (
                  <li key={url} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs">
                    <span className="truncate text-muted-foreground">{url.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(url)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="ลบวิดีโอนี้"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label
              htmlFor="videos"
              className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50"
            >
              <Upload className="size-4" />
              {uploadingVideos ? "กำลังอัปโหลด..." : "เพิ่มวิดีโอ"}
            </label>
            <input
              ref={videoInputRef}
              id="videos"
              type="file"
              accept="video/*"
              multiple
              disabled={uploadingVideos}
              onChange={handleVideosSelected}
              className="sr-only"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={busy} className="rounded-full">
              {submitting ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </Button>
            <SheetClose render={<Button type="button" variant="outline" className="rounded-full" />}>ยกเลิก</SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
