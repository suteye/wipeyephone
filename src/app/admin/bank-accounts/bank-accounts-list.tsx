"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Landmark, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BankAccountSheet, type EditableBankAccount } from "./bank-account-sheet";
import { deleteBankAccount, setActiveBankAccount } from "./actions";

export type BankAccountRow = EditableBankAccount;

export function BankAccountsList({ accounts }: { accounts: BankAccountRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleActivate(account: BankAccountRow) {
    setError(null);
    setPendingId(account.id);
    startTransition(async () => {
      const result = await setActiveBankAccount(account.id);
      setPendingId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(account: BankAccountRow) {
    if (!window.confirm(`ลบบัญชี "${account.accountName}"? การลบไม่สามารถย้อนกลับได้`)) return;
    setError(null);
    setPendingId(account.id);
    startTransition(async () => {
      const result = await deleteBankAccount(account.id);
      setPendingId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className={`flex flex-col rounded-2xl border bg-card p-4 ${account.isActive ? "border-primary" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <Landmark className="size-4" />
              </span>
              {account.isActive && (
                <Badge className="shrink-0 border-0 bg-success/15 text-success hover:bg-success/15">
                  <BadgeCheck className="mr-1 size-3" />
                  ใช้งานอยู่
                </Badge>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{account.bankName}</p>
            <p className="font-medium">{account.accountName}</p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{account.accountNumber}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!account.isActive && (
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-brand text-primary-foreground"
                  disabled={isPending && pendingId === account.id}
                  onClick={() => handleActivate(account)}
                >
                  ตั้งเป็นบัญชีหลัก
                </Button>
              )}
              <BankAccountSheet mode="edit" account={account} />
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={isPending && pendingId === account.id}
                onClick={() => handleDelete(account)}
              >
                <Trash2 className="mr-1 size-3.5" />
                ลบ
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
