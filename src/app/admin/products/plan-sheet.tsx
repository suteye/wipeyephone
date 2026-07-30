"use client";

import { useState, type FormEvent } from "react";
import { CalendarClock } from "lucide-react";
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
import { money } from "@/lib/mock-data";
import { deactivateInstallmentPlan, upsertInstallmentPlan } from "./actions";

export type PlanRow = {
  id: string;
  deposit: number;
  totalInstallments: number;
  intervalDays: number;
  installmentAmount: number;
};

export function PlanSheet({
  productId,
  productName,
  price,
  plan,
}: {
  productId: string;
  productName: string;
  price: number;
  plan: PlanRow | null;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState(String(plan?.deposit ?? 0));
  const [totalInstallments, setTotalInstallments] = useState(String(plan?.totalInstallments ?? 3));
  const [intervalDays, setIntervalDays] = useState(String(plan?.intervalDays ?? 14));

  const depositNum = Number(deposit) || 0;
  const installmentsNum = Number(totalInstallments) || 0;
  const previewAmount = installmentsNum > 0 ? Math.ceil((price - depositNum) / installmentsNum) : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await upsertInstallmentPlan({
        productId,
        deposit: depositNum,
        totalInstallments: installmentsNum,
        intervalDays: Number(intervalDays) || 0,
        installmentAmount: previewAmount,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!plan) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await deactivateInstallmentPlan(plan.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant={plan ? "outline" : "secondary"} size="sm" className="rounded-full" />}>
        <CalendarClock className="mr-1 size-3.5" />
        {plan ? `ผ่อน ${plan.totalInstallments} งวด` : "เพิ่มแผนผ่อน"}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>แผนผ่อนชำระ</SheetTitle>
          <SheetDescription>
            {productName} · ราคา {money.format(price)}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <label htmlFor="deposit" className="text-sm font-medium">
              เงินมัดจำ (บาท)
            </label>
            <Input
              id="deposit"
              type="number"
              min="0"
              step="1"
              className="mt-1.5"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="total_installments" className="text-sm font-medium">
                จำนวนงวด
              </label>
              <Input
                id="total_installments"
                type="number"
                min="1"
                step="1"
                className="mt-1.5"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="interval_days" className="text-sm font-medium">
                ทุกกี่วัน/งวด
              </label>
              <Input
                id="interval_days"
                type="number"
                min="1"
                step="1"
                className="mt-1.5"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="rounded-xl bg-secondary p-3 text-sm">
            <p className="text-xs text-muted-foreground">ยอดผ่อนต่องวด (คำนวณจากราคา - มัดจำ)</p>
            <p className="mt-1 text-lg font-semibold">
              {installmentsNum > 0 ? `${money.format(previewAmount)}/งวด` : "-"}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="rounded-full">
              {submitting ? "กำลังบันทึก..." : plan ? "อัปเดตแผนผ่อน" : "บันทึกแผนผ่อน"}
            </Button>
            {plan && (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="rounded-full"
                onClick={handleDeactivate}
              >
                ปิดแผนผ่อนนี้
              </Button>
            )}
            <SheetClose render={<Button type="button" variant="ghost" className="rounded-full" />}>
              ยกเลิก
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
