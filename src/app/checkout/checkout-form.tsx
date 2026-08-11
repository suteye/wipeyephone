"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/mock-data";
import { getPhone } from "@/lib/phones";
import type { CustomerInstallment } from "@/lib/orders";
import { submitInstallmentPayment, submitPayment } from "./actions";

function nowForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

async function getInstallment(id: string): Promise<CustomerInstallment | null> {
  const response = await fetch(`/api/installments/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("โหลดข้อมูลงวดไม่สำเร็จ");
  return response.json();
}

function Notice({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-6 rounded-full bg-gradient-brand text-primary-foreground">
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  );
}

function SuccessNotice() {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-success/15 text-success">
        <Check className="size-7" />
      </div>
      <p className="mt-4 text-lg font-medium">ส่งหลักฐานการชำระแล้ว 🎉</p>
      <p className="mt-2 text-sm text-muted-foreground">
        ร้านจะตรวจสอบยอดให้เร็วที่สุด ติดตามสถานะได้ที่บัญชีของคุณ
      </p>
      <Button asChild className="mt-6 rounded-full bg-gradient-brand text-primary-foreground">
        <Link href="/dashboard">ไปที่บัญชีของฉัน</Link>
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-7 md:grid-cols-[1fr_.75fr]">
      <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      <div className="h-56 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function PaymentForm({
  subtitle,
  productName,
  dueAmount,
  onSubmit,
  submitting,
  error,
}: {
  subtitle: string;
  productName: string;
  dueAmount: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="grid gap-7 md:grid-cols-[1fr_.75fr]">
      <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 sm:p-6">
        <p className="text-sm text-muted-foreground">
          {subtitle} · {productName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">แนบหลักฐานการโอน</h1>
        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium" htmlFor="amount">
              ยอดที่โอน
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1"
              defaultValue={dueAmount}
              className="mt-2 h-12"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="transferredAt">
              วันเวลาที่โอน
            </label>
            <Input
              id="transferredAt"
              name="transferredAt"
              type="datetime-local"
              defaultValue={nowForInput()}
              className="mt-2 h-12"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="slip">
              สลิปการโอนเงิน
            </label>
            <label
              htmlFor="slip"
              className={`mt-2 flex min-h-35 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors ${
                fileName
                  ? "border-success bg-success/10"
                  : "border-border bg-secondary/35 hover:bg-secondary"
              }`}
            >
              {fileName ? (
                <>
                  <Check className="size-5 text-success" />
                  <span className="mt-2 max-w-full truncate text-sm font-medium text-success">{fileName}</span>
                  <span className="mt-1 text-xs text-muted-foreground">แตะเพื่อเปลี่ยนไฟล์</span>
                </>
              ) : (
                <>
                  <Upload className="size-5 text-primary" />
                  <span className="mt-2 text-sm font-medium">เลือกไฟล์สลิป</span>
                  <span className="mt-1 text-xs text-muted-foreground">รองรับ JPG, PNG หรือ PDF ขนาดไม่เกิน 10 MB</span>
                </>
              )}
            </label>
            <input
              id="slip"
              name="slip"
              type="file"
              accept="image/*,.pdf"
              className="sr-only"
              required
              onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
            />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-gradient-brand text-primary-foreground"
        >
          {submitting ? "กำลังส่ง..." : "ส่งหลักฐานการชำระ"}
        </Button>
      </form>
      <aside className="h-fit rounded-2xl bg-secondary p-5">
        <p className="text-sm font-medium">โอนเข้าบัญชี</p>
        <div className="mt-4 border-y border-border py-4">
          <p className="text-xs text-muted-foreground">ธนาคารกสิกรไทย</p>
          <p className="mt-1 font-semibold">วิปอายโฟน สาขาหลัก</p>
          <p className="mt-2 font-mono text-sm">xxx-x-xxxxx-x</p>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">ยอดที่ต้องชำระ</p>
          <p className="mt-1 text-2xl font-semibold text-primary">{money.format(dueAmount)}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            หลังส่งสลิป สถานะจะเป็น “รอตรวจสอบ” และจะอัปเดตเมื่อร้านยืนยันยอดแล้ว
          </p>
        </div>
      </aside>
    </div>
  );
}

function NewOrderCheckout({ phoneId, mode }: { phoneId: string; mode: "full" | "installment" }) {
  const { data: phone, isLoading } = useQuery({
    queryKey: ["phone", phoneId],
    queryFn: () => getPhone(phoneId),
    staleTime: 60_000,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone) return;
    setError(null);

    const formData = new FormData(event.currentTarget);
    const slipFile = formData.get("slip");
    if (!(slipFile instanceof File) || slipFile.size === 0) {
      setError("กรุณาแนบสลิปการโอนเงิน");
      return;
    }

    formData.set("productId", phone.id);
    formData.set("mode", mode);
    if (mode === "installment" && phone.plan) formData.set("planId", phone.plan.id);

    setSubmitting(true);
    try {
      const result = await submitPayment(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!phone) {
    return <Notice title="ไม่พบคำสั่งซื้อ" description="กรุณาเลือกสินค้าใหม่อีกครั้ง" href="/phones" linkLabel="ดูสินค้าทั้งหมด" />;
  }
  if (mode === "installment" && !phone.plan) {
    return (
      <Notice
        title="แผนผ่อนนี้ไม่พร้อมใช้งานแล้ว"
        description="กรุณากลับไปเลือกวิธีชำระเงินใหม่"
        href={`/phones/${phone.id}`}
        linkLabel="กลับไปเลือกวิธีชำระ"
      />
    );
  }
  if (done) return <SuccessNotice />;

  const dueAmount = mode === "full" ? phone.price : phone.plan!.installmentAmount;
  const subtitle = mode === "full" ? "ชำระเต็มจำนวน" : `ผ่อนงวดที่ 1 จาก ${phone.plan!.totalInstallments}`;

  return (
    <PaymentForm
      subtitle={subtitle}
      productName={phone.name}
      dueAmount={dueAmount}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    />
  );
}

function ExistingInstallmentCheckout({ installmentId }: { installmentId: string }) {
  const { data: installment, isLoading } = useQuery({
    queryKey: ["installment", installmentId],
    queryFn: () => getInstallment(installmentId),
    staleTime: 30_000,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!installment) return;
    setError(null);

    const formData = new FormData(event.currentTarget);
    const slipFile = formData.get("slip");
    if (!(slipFile instanceof File) || slipFile.size === 0) {
      setError("กรุณาแนบสลิปการโอนเงิน");
      return;
    }

    formData.set("installmentId", installment.id);

    setSubmitting(true);
    try {
      const result = await submitInstallmentPayment(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <LoadingSkeleton />;
  if (!installment) {
    return <Notice title="ไม่พบงวดนี้" description="งวดนี้อาจถูกลบหรือไม่ใช่ของคุณ" href="/dashboard" linkLabel="กลับไปที่บัญชีของฉัน" />;
  }
  if (installment.status === "approved") {
    return <Notice title="งวดนี้ชำระแล้ว" description="ไม่ต้องแนบหลักฐานซ้ำ" href="/dashboard" linkLabel="กลับไปที่บัญชีของฉัน" />;
  }
  if (done) return <SuccessNotice />;

  return (
    <PaymentForm
      subtitle={`งวดที่ ${installment.sequence} จาก ${installment.totalInstallments}`}
      productName={installment.productName}
      dueAmount={installment.amount}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
    />
  );
}

export function CheckoutForm({
  phoneId,
  mode,
  installmentId,
}: {
  phoneId: string | null;
  mode: "full" | "installment";
  installmentId: string | null;
}) {
  let body: ReactNode;
  if (installmentId) {
    body = <ExistingInstallmentCheckout installmentId={installmentId} />;
  } else if (phoneId) {
    body = <NewOrderCheckout phoneId={phoneId} mode={mode} />;
  } else {
    body = <Notice title="ไม่พบคำสั่งซื้อ" description="กรุณาเลือกสินค้าใหม่อีกครั้ง" href="/phones" linkLabel="ดูสินค้าทั้งหมด" />;
  }

  return (
    <main className="min-h-[100dvh] bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-17 max-w-3xl items-center px-4">
          <Button asChild variant="ghost" size="icon" aria-label="ย้อนกลับ">
            <Link href="/dashboard">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <p className="ml-3 font-semibold">แจ้งชำระเงิน</p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">{body}</div>
    </main>
  );
}
