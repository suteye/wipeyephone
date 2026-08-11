"use client";

import { useState, type FormEvent } from "react";
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
import { createBankAccount, updateBankAccount } from "./actions";

export type EditableBankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
};

type BankAccountSheetProps = { mode: "create" } | { mode: "edit"; account: EditableBankAccount };

export function BankAccountSheet(props: BankAccountSheetProps) {
  const isEdit = props.mode === "edit";
  const account = isEdit ? props.account : null;

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const input = {
      bankName: String(formData.get("bankName") ?? "").trim(),
      accountName: String(formData.get("accountName") ?? "").trim(),
      accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    };

    setSubmitting(true);
    try {
      const result = isEdit
        ? await updateBankAccount({ ...input, id: account!.id })
        : await createBankAccount(input);

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

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <SheetTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm" className="rounded-full" />
          ) : (
            <Button className="rounded-full bg-gradient-brand text-primary-foreground" />
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
            เพิ่มบัญชีธนาคาร
          </>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "แก้ไขบัญชีธนาคาร" : "เพิ่มบัญชีธนาคาร"}</SheetTitle>
          <SheetDescription>ข้อมูลบัญชีที่ลูกค้าจะเห็นในหน้าแจ้งชำระเงิน</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div>
            <label htmlFor="bankName" className="text-sm font-medium">
              ธนาคาร
            </label>
            <Input
              id="bankName"
              name="bankName"
              defaultValue={account?.bankName}
              className="mt-1.5"
              placeholder="เช่น ธนาคารกสิกรไทย"
              required
            />
          </div>
          <div>
            <label htmlFor="accountName" className="text-sm font-medium">
              ชื่อบัญชี
            </label>
            <Input
              id="accountName"
              name="accountName"
              defaultValue={account?.accountName}
              className="mt-1.5"
              placeholder="เช่น วิปอายโฟน สาขาหลัก"
              required
            />
          </div>
          <div>
            <label htmlFor="accountNumber" className="text-sm font-medium">
              เลขบัญชี
            </label>
            <Input
              id="accountNumber"
              name="accountNumber"
              defaultValue={account?.accountNumber}
              className="mt-1.5 font-mono"
              placeholder="เช่น 123-4-56789-0"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={submitting} className="rounded-full bg-gradient-brand text-primary-foreground">
              {submitting ? "กำลังบันทึก..." : "บันทึกบัญชี"}
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
