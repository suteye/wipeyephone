"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ChevronsUpDown,
  ImageOff,
  Info,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { money, thaiDate } from "@/lib/mock-data";
import { getPhones } from "@/lib/phones";
import type { StockPhone } from "@/app/api/phones/route";
import {
  buildInstallmentSchedule,
  INSTALLMENT_SURCHARGE,
  isValidInstallmentOption,
  MIN_INSTALLMENT_AMOUNT,
  WEEK_OPTIONS,
  type Frequency,
} from "@/lib/installment-plan";

type InstallmentCalculatorProps = {
  className?: string;
  /** ล็อกไว้ที่เครื่องเดียว (หน้ารายละเอียดสินค้า) — ถ้าไม่ส่งมา จะให้เลือกจากสต็อกทั้งหมด */
  fixedPhone?: StockPhone;
  /** "browse" = เครื่องคำนวณตัวอย่าง (ค่าเริ่มต้น), "purchase" = ต่อไปยัง checkout เพื่อสร้างคำสั่งซื้อจริง */
  ctaMode?: "browse" | "purchase";
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export function InstallmentCalculator({
  className,
  fixedPhone,
  ctaMode = "browse",
  eyebrow = "ลองคำนวณดูก่อนได้",
  title = "คำนวณค่าผ่อน",
  subtitle = "เลือกเครื่อง แล้วดูว่าถ้าผ่อนรายวันหรือรายสัปดาห์ ต้องจ่ายงวดละเท่าไหร่",
}: InstallmentCalculatorProps) {
  const { data: fetchedPhones = [], isLoading } = useQuery({
    queryKey: ["phones"],
    queryFn: getPhones,
    staleTime: 60_000,
    enabled: !fixedPhone,
  });
  const phones = fixedPhone ? [fixedPhone] : fetchedPhones;

  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [freq, setFreq] = useState<Frequency>("weekly");
  const [weeks, setWeeks] = useState<number>(2);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const phone = fixedPhone ?? phones.find((p) => p.id === selectedPhoneId) ?? phones[0] ?? null;
  const totalWithSurcharge = phone ? phone.price + INSTALLMENT_SURCHARGE : 0;
  const filteredPhones = phones.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));

  const weekOptions = WEEK_OPTIONS.map((w) => ({
    weeks: w,
    valid: isValidInstallmentOption(totalWithSurcharge, freq, w),
  }));
  const hasAnyValidOption = weekOptions.some((o) => o.valid);
  const effectiveWeeks = weekOptions.find((o) => o.weeks === weeks && o.valid)
    ? weeks
    : (weekOptions.find((o) => o.valid)?.weeks ?? null);

  const schedule = effectiveWeeks ? buildInstallmentSchedule(totalWithSurcharge, freq, effectiveWeeks) : [];
  const firstInstallment = schedule[0]?.amount ?? 0;
  const lastInstallment = schedule[schedule.length - 1]?.amount ?? 0;
  const hasRounding = schedule.length > 1 && lastInstallment !== firstInstallment;
  const dueDate = schedule.length > 0 ? new Date(schedule[schedule.length - 1].dueDate) : null;

  return (
    <div className={className}>
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Sparkles className="size-3.5" /> {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

        {!fixedPhone && isLoading ? (
          <div className="mt-6 h-16 animate-pulse rounded-2xl bg-muted" />
        ) : phones.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-background py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีสินค้าให้คำนวณตอนนี้
          </p>
        ) : (
          <>
            {fixedPhone ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                  {fixedPhone.image ? (
                    <img src={fixedPhone.image} alt={fixedPhone.name} className="size-full object-cover" />
                  ) : (
                    <ImageOff className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fixedPhone.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    ราคาเครื่อง {money.format(fixedPhone.price)}
                  </span>
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-secondary/40"
                >
                  <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                    {phone?.image ? (
                      <img src={phone.image} alt={phone.name} className="size-full object-cover" />
                    ) : (
                      <ImageOff className="size-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{phone?.name ?? "เลือกเครื่อง"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {phone ? money.format(phone.price) : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
                    เปลี่ยนเครื่อง <ChevronsUpDown className="size-3.5" />
                  </span>
                </button>

                <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
                  <SheetContent side="bottom" className="mx-auto max-h-[85vh] w-full max-w-lg rounded-t-3xl">
                    <SheetHeader>
                      <SheetTitle>เลือกเครื่องที่จะคำนวณ</SheetTitle>
                    </SheetHeader>
                    <div className="px-4">
                      <div className="flex items-center gap-2 rounded-xl border bg-background px-3">
                        <Search className="size-4 text-muted-foreground" />
                        <Input
                          autoFocus
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="ค้นหารุ่น iPhone"
                          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
                      {filteredPhones.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">ไม่พบรุ่นที่ค้นหา</p>
                      ) : (
                        filteredPhones.map((p) => {
                          const active = p.id === phone?.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPhoneId(p.id);
                                setPickerOpen(false);
                                setSearch("");
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                                active ? "border-primary bg-secondary" : "border-transparent hover:bg-secondary/50"
                              }`}
                            >
                              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="size-full object-cover" />
                                ) : (
                                  <ImageOff className="size-4 text-muted-foreground" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{p.name}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {p.condition ? `${p.condition} · ` : ""}
                                  {money.format(p.price)}
                                </span>
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}

            {phone && (
              <p className="mt-3 text-xs text-muted-foreground">
                ยอดผ่อนรวม {money.format(totalWithSurcharge)} (ราคาเครื่อง {money.format(phone.price)} + ค่าธรรมเนียมผ่อน{" "}
                {money.format(INSTALLMENT_SURCHARGE)})
              </p>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">ความถี่ในการจ่าย</p>
                <div className="mt-2 inline-flex rounded-full bg-secondary p-1">
                  {(
                    [
                      { value: "daily", label: "รายวัน" },
                      { value: "weekly", label: "รายสัปดาห์" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFreq(opt.value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        freq === opt.value
                          ? "bg-gradient-brand text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">ผ่อนให้ครบภายใน</p>
                <div className="mt-2 flex gap-2">
                  {weekOptions.map((o) => (
                    <button
                      key={o.weeks}
                      type="button"
                      disabled={!o.valid}
                      onClick={() => setWeeks(o.weeks)}
                      title={!o.valid ? `ยอดต่องวดจะต่ำกว่า ${MIN_INSTALLMENT_AMOUNT} บาท` : undefined}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        !o.valid
                          ? "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                          : o.weeks === effectiveWeeks
                            ? "border-primary bg-secondary text-primary"
                            : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      {o.weeks} สัปดาห์
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!hasAnyValidOption ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border bg-background p-5 text-center text-sm text-muted-foreground">
                ราคาเครื่องนี้ต่ำเกินกว่าจะแบ่งจ่ายได้ครบตามเงื่อนไขขั้นต่ำงวดละ {money.format(MIN_INSTALLMENT_AMOUNT)} แนะนำชำระเต็มจำนวน
              </p>
            ) : (
              <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-brand p-6 text-primary-foreground">
                <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-primary-foreground/70">
                      {ctaMode === "purchase" ? "งวดแรกที่ต้องจ่ายวันนี้" : "ผ่อนงวดละประมาณ"}
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{money.format(firstInstallment)}</p>
                    <p className="mt-1 text-xs text-primary-foreground/70">
                      {schedule.length} งวด · {freq === "daily" ? "ทุกวัน" : "ทุกสัปดาห์"}
                      {hasRounding && ` · งวดสุดท้าย ${money.format(lastInstallment)}`}
                    </p>
                  </div>
                  {phone && effectiveWeeks && (
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    >
                      {ctaMode === "purchase" ? (
                        <Link href={`/checkout?phone=${phone.id}&mode=installment&freq=${freq}&weeks=${effectiveWeeks}`}>
                          ดำเนินการต่อ <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      ) : (
                        <Link href={`/phones/${phone.id}`}>
                          ดูเครื่องนี้ <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                      )}
                    </Button>
                  )}
                </div>
                {dueDate && (
                  <div className="relative mt-5 flex items-center gap-2 border-t border-primary-foreground/15 pt-4 text-sm">
                    <CalendarDays className="size-4 shrink-0" />
                    เริ่มจ่ายวันนี้ ครบกำหนดวันที่ {thaiDate.format(dueDate)}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs leading-5 text-warning-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p>
                  ยอดผ่อนรวมค่าธรรมเนียมผ่อนชำระ {money.format(INSTALLMENT_SURCHARGE)} และยอดชำระแต่ละงวดต้องไม่ต่ำกว่า{" "}
                  {money.format(MIN_INSTALLMENT_AMOUNT)}
                </p>
                <p>
                  ต้องชำระให้ครบภายในระยะเวลาที่เลือก นับจากวันที่ชำระงวดแรก หากชำระไม่ครบภายในกำหนด
                  ทางร้านขอสงวนสิทธิ์ยึดเงินที่ชำระมาแล้วทั้งหมด และจะไม่คืนเงินในทุกกรณี
                </p>
                <p className="text-warning-foreground/70">
                  {ctaMode === "purchase"
                    ? 'กด "ดำเนินการต่อ" เพื่อสร้างคำสั่งซื้อตามแผนนี้ แล้วแนบสลิปโอนเงินงวดแรกได้ทันที'
                    : "ตัวเลขด้านบนเป็นการประเมินเบื้องต้นเท่านั้น ไม่ใช่การยืนยันคำสั่งซื้อ"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
