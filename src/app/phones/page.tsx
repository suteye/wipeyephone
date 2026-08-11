"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BatteryMedium, ChevronRight, ImageOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/mock-data";
import { getPhones } from "@/lib/phones";

const TONES = ["bg-stone-100", "bg-pink-50", "bg-rose-50", "bg-fuchsia-50"];

export default function PhonesPage() {
  const { data: phones = [], isLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: getPhones,
    staleTime: 60_000,
  });

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-brand text-xs font-bold text-primary-foreground">
              W
            </span>
            วิปอายโฟน
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            บัญชีของฉัน
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-primary">สินค้าพร้อมส่ง</p>
        <div className="mt-2 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">เลือก iPhone ของคุณ</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              ทุกเครื่องระบุสภาพและสุขภาพแบตเตอรี่ตามจริง
            </p>
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 sm:w-72">
            <Search className="size-4 text-muted-foreground" />
            <Input
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="ค้นหารุ่น iPhone"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : phones.length === 0 ? (
          <p className="mt-9 rounded-2xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีสินค้าในสต็อก
          </p>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {phones.map((phone, i) => (
              <Link
                href={`/phones/${phone.id}`}
                key={phone.id}
                className="group rounded-2xl border bg-card p-3 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-16px_var(--primary)]"
              >
                <div className={`relative aspect-square overflow-hidden rounded-xl ${TONES[i % TONES.length]}`}>
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
                    <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium shadow-sm">
                      {phone.condition}
                    </span>
                  )}
                </div>
                <div className="px-1 pb-1 pt-4">
                  <p className="font-semibold">{phone.name}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-semibold">{money.format(phone.price)}</p>
                      {phone.battery != null && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <BatteryMedium className="size-3.5 text-success" />
                          แบตเตอรี่ {phone.battery}%
                        </p>
                      )}
                    </div>
                    <span className="grid size-8 place-items-center rounded-full bg-secondary transition-colors group-hover:bg-gradient-brand group-hover:text-primary-foreground">
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
