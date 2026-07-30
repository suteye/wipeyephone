"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Home,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money, thaiDate } from "@/lib/mock-data";
import type { CustomerOrder, InstallmentRow } from "@/lib/orders";

async function getOrders(): Promise<CustomerOrder[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error("โหลดคำสั่งซื้อไม่สำเร็จ");
  return response.json();
}

type StatusInfo = { label: string; className: string };

function fullOrderStatus(status: "pending_review" | "approved" | "rejected"): StatusInfo {
  if (status === "approved") return { label: "ชำระแล้ว", className: "bg-pink-100 text-primary" };
  if (status === "rejected") return { label: "ถูกปฏิเสธ", className: "bg-destructive/10 text-destructive" };
  return { label: "รอตรวจสอบ", className: "bg-secondary text-muted-foreground" };
}

function installmentStatus(installment: InstallmentRow, today: string): StatusInfo {
  if (installment.status === "approved") return { label: "ชำระแล้ว", className: "bg-pink-100 text-primary" };
  if (installment.status === "rejected") return { label: "ถูกปฏิเสธ", className: "bg-destructive/10 text-destructive" };
  if (installment.dueDate < today) return { label: "เกินกำหนด", className: "bg-destructive/10 text-destructive" };
  return { label: "รอชำระ", className: "bg-secondary text-muted-foreground" };
}

export function DashboardView({ customerName }: { customerName: string }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    staleTime: 30_000,
  });

  const today = new Date().toISOString().slice(0, 10);

  const pendingInstallments = orders
    .filter((o) => o.paymentType === "installment")
    .flatMap((order) => order.installments.filter((i) => i.status !== "approved").map((installment) => ({ order, installment })))
    .sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate));

  const nextItem = pendingInstallments[0] ?? null;
  const pendingFullOrder = orders.find((o) => o.paymentType === "full" && o.fullPaymentStatus === "pending_review") ?? null;

  const paidAmount = nextItem
    ? nextItem.order.installments.filter((i) => i.status === "approved").reduce((sum, i) => sum + i.amount, 0)
    : 0;
  const paidCount = nextItem ? nextItem.order.installments.filter((i) => i.status === "approved").length : 0;
  const totalCount = nextItem ? nextItem.order.installments.length : 0;
  const remaining = nextItem ? nextItem.order.totalAmount - paidAmount : 0;
  const overdue = nextItem ? nextItem.installment.dueDate < today : false;

  const payNowHref = nextItem ? `/checkout?installment=${nextItem.installment.id}` : "/dashboard";

  return (
    <main className="min-h-[100dvh] bg-background pb-22">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              W
            </span>
            วิปอายโฟน
          </Link>
          <Button asChild variant="ghost" className="text-sm">
            <Link href="/admin">โหมดแอดมิน</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">สวัสดี, {customerName}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">การผ่อนของฉัน</h1>
          </div>
          <Button asChild className="rounded-full">
            <Link href={payNowHref}>
              <ReceiptText className="mr-1.5 size-4" />
              แจ้งชำระค่างวด
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : nextItem ? (
          <div className="mt-7 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-primary-foreground/70">งวดที่ต้องชำระ</p>
                  <p className="mt-2 text-3xl font-semibold">{money.format(nextItem.installment.amount)}</p>
                </div>
                <Badge className="border-0 bg-primary-foreground/14 text-primary-foreground hover:bg-primary-foreground/14">
                  {overdue ? "เกินกำหนดชำระ" : "ครบกำหนด " + thaiDate.format(new Date(nextItem.installment.dueDate))}
                </Badge>
              </div>
              <div className="mt-8 flex items-end justify-between border-t border-primary-foreground/15 pt-4">
                <div>
                  <p className="text-xs text-primary-foreground/70">
                    {nextItem.order.productName} · งวดที่ {nextItem.installment.sequence} จาก {nextItem.order.installments.length}
                  </p>
                  <p className="mt-1 text-sm">ครบกำหนด {thaiDate.format(new Date(nextItem.installment.dueDate))}</p>
                </div>
                <Link href={payNowHref} className="flex items-center gap-1 text-sm font-medium underline underline-offset-4">
                  ชำระเลย <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
            <section className="rounded-2xl border bg-card p-6">
              <p className="text-sm text-muted-foreground">ยอดคงเหลือ</p>
              <p className="mt-2 text-2xl font-semibold">{money.format(remaining)}</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: totalCount > 0 ? `${(paidCount / totalCount) * 100}%` : "0%" }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ชำระแล้ว {paidCount} จาก {totalCount} งวด
              </p>
            </section>
          </div>
        ) : pendingFullOrder ? (
          <div className="mt-7 rounded-2xl bg-primary p-6 text-primary-foreground">
            <p className="text-sm text-primary-foreground/70">{pendingFullOrder.productName}</p>
            <p className="mt-2 text-2xl font-semibold">รอตรวจสอบการชำระ</p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              ร้านกำลังตรวจสอบสลิปยอด {money.format(pendingFullOrder.totalAmount)} ของคุณ
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-7 rounded-2xl border border-dashed bg-card p-8 text-center">
            <p className="font-medium">ยังไม่มีคำสั่งซื้อ</p>
            <p className="mt-2 text-sm text-muted-foreground">เลือก iPhone ที่ถูกใจแล้วเริ่มผ่อนหรือชำระเต็มได้เลย</p>
            <Button asChild className="mt-5 rounded-full">
              <Link href="/phones">เลือกซื้อ iPhone</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border bg-card p-8 text-center">
            <p className="font-medium">ไม่มีรายการที่ต้องชำระตอนนี้</p>
            <p className="mt-2 text-sm text-muted-foreground">คำสั่งซื้อทั้งหมดของคุณอนุมัติเรียบร้อยแล้ว</p>
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold">คำสั่งซื้อของฉัน</h2>
          {isLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
              <div className="h-24 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : orders.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              ยังไม่มีประวัติการสั่งซื้อ
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="overflow-hidden rounded-2xl border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                    <div>
                      <p className="font-medium">{order.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {thaiDate.format(new Date(order.createdAt))} ·{" "}
                        {order.paymentType === "installment" ? `ผ่อน ${order.installments.length} งวด` : "ชำระเต็มจำนวน"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{money.format(order.totalAmount)}</p>
                      {order.paymentType === "full" && order.fullPaymentStatus && (
                        <Badge variant="secondary" className={fullOrderStatus(order.fullPaymentStatus).className}>
                          {fullOrderStatus(order.fullPaymentStatus).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {order.paymentType === "installment" && (
                    <div className="divide-y divide-border">
                      {order.installments.map((installment) => {
                        const status = installmentStatus(installment, today);
                        return (
                          <div key={installment.id} className="flex items-center gap-4 px-5 py-4">
                            <span
                              className={`grid size-9 shrink-0 place-items-center rounded-full ${
                                installment.status === "approved" ? "bg-pink-100 text-primary" : "bg-secondary text-primary"
                              }`}
                            >
                              {installment.status === "approved" ? (
                                <CheckCircle2 className="size-4" />
                              ) : (
                                <CalendarDays className="size-4" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">งวดที่ {installment.sequence}</p>
                              <p className="text-xs text-muted-foreground">{thaiDate.format(new Date(installment.dueDate))}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{money.format(installment.amount)}</p>
                              <Badge variant="secondary" className={`mt-1 ${status.className}`}>
                                {status.label}
                              </Badge>
                            </div>
                            {installment.status !== "approved" && (
                              <Link
                                href={`/checkout?installment=${installment.id}`}
                                className="shrink-0 text-sm font-medium text-primary underline underline-offset-4"
                              >
                                แจ้งชำระ
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="history" className="mt-8 grid gap-3 border-t pt-7 sm:grid-cols-3">
          <div className="flex gap-3">
            <Home className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">ที่อยู่จัดส่ง</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">แก้ไขรายละเอียดติดต่อและที่อยู่ของคุณ</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CreditCard className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">วิธีชำระเงิน</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">ชำระด้วยการโอนและอัปโหลดสลิป</p>
            </div>
          </div>
          <div className="flex gap-3">
            <FileText className="mt-0.5 size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">เอกสารการซื้อ</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">เก็บประวัติการชำระและใบเสร็จทั้งหมด</p>
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-card/95 px-4 py-3 text-xs backdrop-blur sm:hidden">
        <Link href="/" className="grid justify-items-center gap-1 text-muted-foreground">
          <Home className="size-4" />
          หน้าแรก
        </Link>
        <Link href="/dashboard" className="grid justify-items-center gap-1 text-primary">
          <ReceiptText className="size-4" />
          ค่างวด
        </Link>
        <Link href={payNowHref} className="grid justify-items-center gap-1 text-muted-foreground">
          <CreditCard className="size-4" />
          ชำระเงิน
        </Link>
      </nav>
    </main>
  );
}
