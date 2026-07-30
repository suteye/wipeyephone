"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, ChevronLeft, ChevronRight, ImageOff, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/mock-data";
import { getPhone } from "@/lib/phones";

type MediaItem = { type: "image" | "video"; src: string };

function MediaGallery({ items, alt }: { items: MediaItem[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  if (items.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-3xl bg-secondary text-muted-foreground">
        <ImageOff className="size-10" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="scrollbar-none flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-3xl bg-secondary"
        >
          {items.map((item, i) => (
            <div key={`${item.src}-${i}`} className="aspect-square w-full shrink-0 snap-start snap-always">
              {item.type === "video" ? (
                <video src={item.src} controls playsInline preload="metadata" className="size-full object-cover" />
              ) : (
                <img src={item.src} alt={alt} className="size-full object-cover" />
              )}
            </div>
          ))}
        </div>
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label="รูปก่อนหน้า"
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-sm transition-opacity hover:bg-card disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(Math.min(active + 1, items.length - 1))}
              disabled={active === items.length - 1}
              aria-label="รูปถัดไป"
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-sm transition-opacity hover:bg-card disabled:pointer-events-none disabled:opacity-0"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`ไปที่รูปที่ ${i + 1}`}
              className={`size-1.5 rounded-full transition-colors ${i === active ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhoneDetailPage({ params }: PageProps<"/phones/[id]">) {
  const { id } = use(params);
  const { data: phone, isLoading } = useQuery({
    queryKey: ["phone", id],
    queryFn: () => getPhone(id),
    staleTime: 60_000,
  });

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Button asChild variant="ghost" className="-ml-2 text-muted-foreground">
            <Link href="/phones">
              <ArrowLeft className="mr-1 size-4" />
              สินค้าทั้งหมด
            </Link>
          </Button>
          <Link href="/" className="font-semibold">
            วิปอายโฟน
          </Link>
        </div>
      </header>

      {isLoading ? (
        <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
            <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </section>
      ) : !phone ? (
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-lg font-medium">ไม่พบสินค้านี้</p>
          <p className="mt-2 text-sm text-muted-foreground">สินค้าอาจถูกลบหรือปิดการขายไปแล้ว</p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/phones">ดูสินค้าทั้งหมด</Link>
          </Button>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
            <div>
              <MediaGallery
                items={[
                  ...phone.images.map((src): MediaItem => ({ type: "image", src })),
                  ...phone.videos.map((src): MediaItem => ({ type: "video", src })),
                ]}
                alt={phone.name}
              />
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">สภาพเครื่อง</p>
                  <p className="mt-1 font-medium">{phone.condition ?? "-"}</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">สุขภาพแบต</p>
                  <p className="mt-1 font-medium">{phone.battery != null ? `${phone.battery}%` : "-"}</p>
                </div>
              </div>
            </div>
            <div className="lg:pt-3">
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{phone.name}</h1>
              {phone.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {phone.description}
                </p>
              )}
              <div className="mt-6 border-y border-border py-5">
                <p className="text-sm text-muted-foreground">ราคาเครื่อง</p>
                <p className="mt-1 text-3xl font-semibold">{money.format(phone.price)}</p>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium">เลือกวิธีชำระ</p>
                <div className="mt-3 space-y-3">
                  <Link
                    href={`/checkout?phone=${phone.id}&mode=full`}
                    className="block rounded-xl border p-4 transition-colors hover:border-primary"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium">ชำระเต็มจำนวน</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          โอนครั้งเดียว แล้วแนบสลิปเพื่อยืนยัน
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold">{money.format(phone.price)}</p>
                    </div>
                  </Link>
                  {phone.plan && (
                    <Link
                      href={`/checkout?phone=${phone.id}&mode=installment&plan=${phone.plan.id}`}
                      className="block rounded-xl border border-primary bg-secondary/50 p-4 transition-colors hover:bg-secondary"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-medium">ผ่อนชำระ {phone.plan.totalInstallments} งวด</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            ชำระทุกงวด · ดูรายละเอียดงวดได้ในบัญชี
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold">
                          {money.format(phone.plan.installmentAmount)}/งวด
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t pt-5 text-sm text-muted-foreground">
                <p className="flex gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  รับประกันเครื่อง 3 วันตามเงื่อนไขร้าน
                </p>
                <p className="flex gap-2">
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                  ตรวจเช็กสภาพและข้อมูลเครื่องก่อนจัดส่ง
                </p>
                <p className="flex gap-2">
                  <Truck className="size-4 shrink-0 text-primary" />
                  จัดส่งฟรี พร้อมเลขติดตามพัสดุ
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
