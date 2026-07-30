"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  ImageOff,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/mock-data";
import type { StockPhone } from "@/app/api/phones/route";

const TONES = ["bg-stone-100", "bg-pink-50", "bg-rose-50", "bg-fuchsia-50"];

async function getPhones(): Promise<StockPhone[]> {
  const response = await fetch("/api/phones");
  if (!response.ok) throw new Error("โหลดสินค้าไม่สำเร็จ");
  return response.json();
}

async function getMe(): Promise<{ loggedIn: boolean }> {
  const response = await fetch("/api/me");
  if (!response.ok) return { loggedIn: false };
  return response.json();
}

export default function Home() {
  const { data: phones = [], isLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: getPhones,
    staleTime: 60_000,
  });
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });
  const loggedIn = me?.loggedIn ?? false;
  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <div className="border-b border-border bg-card px-4 py-2 text-center text-xs text-muted-foreground sm:px-6">
        รับประกันเครื่อง 3 วัน · จัดส่งฟรีทั่วไทย · ผ่อนชำระได้
      </div>
      <header className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground rotate-3 shadow-sm">
            W
          </span>
          <span>วิปอายโฟน</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#phones" className="hover:text-foreground">
            เลือกซื้อเครื่อง
          </a>
          <a href="#how" className="hover:text-foreground">
            วิธีผ่อน
          </a>
          <Link href="/dashboard" className="hover:text-foreground">
            ค่างวดของฉัน
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Button asChild className="rounded-full px-4 shadow-none">
              <Link href="/dashboard">
                บัญชีของฉัน
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full px-4 shadow-none">
              <Link href="/liff">เข้าสู่ระบบ</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="เปิดเมนู"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:py-18 lg:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -top-16 size-96 -translate-x-1/2 rounded-full bg-accent/50 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" /> iPhone มือสองที่เลือกมาแล้ว
          </p>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            เครื่องดี มีประวัติ <br />
            <span className="relative inline-block text-primary">
              จ่ายได้ตามจังหวะคุณ
              <svg
                aria-hidden
                viewBox="0 0 300 16"
                className="absolute -bottom-2 left-0 h-3 w-full text-accent"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 10c40-10 80-10 120 0s80 10 120 0 40-8 54 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            เลือกเครื่องที่ใช่ ชำระเต็มได้ทันที หรือแบ่งผ่อนเป็นงวดชัดเจน
            พร้อมดูประวัติการชำระของคุณได้ทุกเมื่อ
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full px-6 shadow-[0_10px_24px_-10px_var(--primary)] transition-transform hover:scale-[1.03] active:scale-100"
            >
              <a href="#phones">
                เลือกดูเครื่อง <ArrowRight className="ml-1.5 size-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-primary/20 bg-card px-6 hover:bg-secondary"
            >
              <a href="#how">ดูวิธีผ่อนชำระ</a>
            </Button>
          </div>
          <div className="mt-9 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-3.5" />
              </span>
              ตรวจสภาพก่อนส่ง
            </span>
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                <BadgeCheck className="size-3.5" />
              </span>
              ระบุสุขภาพแบตจริง
            </span>
          </div>
        </div>
      </section>

      <section
        id="phones"
        className="rounded-t-[2.5rem] border-t border-border bg-card"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <Sparkles className="size-3.5" /> เลือกเครื่องที่พร้อมส่ง
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                สินค้าในสต็อก
              </h2>
            </div>
            <div className="flex w-full items-center gap-2 rounded-xl border bg-background px-3 sm:w-65">
              <Search className="size-4 text-muted-foreground" />
              <Input
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                placeholder="ค้นหารุ่น iPhone"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-89 animate-pulse rounded-2xl bg-muted"
                />
              ))
            ) : phones.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-border bg-background py-12 text-center text-sm text-muted-foreground">
                ยังไม่มีสินค้าในสต็อก
              </p>
            ) : (
              phones.map((phone, i) => (
                <Link
                  key={phone.id}
                  href={`/phones/${phone.id}`}
                  className="group rounded-2xl border border-border bg-background p-3 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div
                    className={`relative aspect-square overflow-hidden rounded-xl ${TONES[i % TONES.length]}`}
                  >
                    {phone.image ? (
                      <img
                        src={phone.image}
                        alt={phone.name}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    {phone.condition && (
                      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium">
                        {phone.condition}
                      </span>
                    )}
                  </div>
                  <div className="px-1 pb-1 pt-4">
                    <p className="text-base font-semibold">{phone.name}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-semibold">
                          {money.format(phone.price)}
                        </p>
                        {phone.battery != null && (
                          <p className="text-xs text-muted-foreground">
                            แบตเตอรี่ {phone.battery}%
                          </p>
                        )}
                      </div>
                      <span className="grid size-8 place-items-center rounded-full bg-secondary" aria-label={`ดู ${phone.name}`}>
                        <ChevronRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Button asChild variant="link" className="mt-7 px-0 text-primary">
            <Link href="/phones">
              ดูสินค้าเพิ่มเติม <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section
        id="how"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[.8fr_1.2fr] lg:px-8"
      >
        <div>
          <p className="text-sm font-medium text-primary">ผ่อนแบบเข้าใจง่าย</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            รู้ทุกงวดก่อน
            <br />
            ตัดสินใจ
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            จำนวนงวดและยอดผ่อนกำหนดได้ตามแพ็กเกจของแต่ละเครื่อง ไม่ต้องเดา
          </p>
        </div>
        <div className="grid divide-y divide-border border-y border-border">
          <div className="flex gap-4 py-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
              1
            </span>
            <div>
              <p className="font-medium">เลือกวิธีชำระ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ชำระเต็ม หรือเลือกแผนผ่อนที่ร้านเสนอ
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
              2
            </span>
            <div>
              <p className="font-medium">โอนและแนบสลิป</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ร้านตรวจสอบยอด จากนั้นระบบอัปเดตสถานะให้คุณ
              </p>
            </div>
          </div>
          <div className="flex gap-4 py-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
              3
            </span>
            <div>
              <p className="font-medium">ติดตามงวดได้ทุกเวลา</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ดูงวดถัดไป ยอดคงเหลือ และประวัติทั้งหมดในบัญชีของคุณ
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        © 2026 วิปอายโฟน · ซื้ออย่างมั่นใจ จ่ายอย่างชัดเจน
      </footer>
    </main>
  );
}
