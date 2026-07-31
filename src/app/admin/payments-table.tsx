"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/mock-data";
import type { PendingPayment } from "@/lib/admin/payments";
import { approvePaymentSlip, rejectPaymentSlip } from "./actions";

const statusLabel: Record<PendingPayment["status"], string> = {
  pending_review: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
};

function StatusBadge({ status }: { status: PendingPayment["status"] }) {
  return (
    <Badge
      variant="secondary"
      className={status === "pending_review" ? "bg-rose-100 text-rose-800" : "bg-pink-100 text-primary"}
    >
      {statusLabel[status]}
    </Badge>
  );
}

const columns: ColumnDef<PendingPayment>[] = [
  {
    accessorKey: "customerName",
    header: "ลูกค้า",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.customerName}</p>
        <p className="text-xs text-muted-foreground">{row.original.deviceName}</p>
      </div>
    ),
  },
  { accessorKey: "installmentLabel", header: "รายการ" },
  {
    accessorKey: "amount",
    header: "ยอดโอน",
    cell: ({ row }) => money.format(row.original.amount),
  },
  {
    accessorKey: "transferredAt",
    header: "เวลา",
    cell: ({ row }) => new Date(row.original.transferredAt).toLocaleString("th-TH"),
  },
  {
    accessorKey: "status",
    header: "สถานะ",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export function PaymentsTable({ data }: { data: PendingPayment[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  function handleApprove(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await approvePaymentSlip(id);
      router.refresh();
      setPendingId(null);
    });
  }

  function handleReject(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await rejectPaymentSlip(id);
      router.refresh();
      setPendingId(null);
    });
  }

  if (data.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีรายการโอนเงินเข้ามา
      </p>
    );
  }

  return (
    <>
      {/* มือถือ: การ์ดเรียงแนวตั้ง */}
      <div className="mt-4 space-y-3 md:hidden">
        {data.map((payment) => (
          <div key={payment.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{payment.customerName}</p>
                <p className="text-xs text-muted-foreground">{payment.deviceName}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{payment.installmentLabel}</span>
              <span className="font-semibold">{money.format(payment.amount)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(payment.transferredAt).toLocaleString("th-TH")}
            </p>
            {payment.status === "pending_review" && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-full"
                  disabled={isPending && pendingId === payment.id}
                  onClick={() => handleApprove(payment.id)}
                >
                  <Check className="mr-1 size-3.5" />
                  อนุมัติ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full text-destructive hover:text-destructive"
                  disabled={isPending && pendingId === payment.id}
                  onClick={() => handleReject(payment.id)}
                >
                  <X className="mr-1 size-3.5" />
                  ปฏิเสธ
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* จอใหญ่: ตาราง */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border bg-card md:block">
        <table className="w-full min-w-170 text-left text-sm">
          <thead className="border-b bg-secondary/50 text-xs text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="px-5 py-4">
                  {row.original.status === "pending_review" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={isPending && pendingId === row.original.id}
                        onClick={() => handleApprove(row.original.id)}
                      >
                        <Check className="mr-1 size-3.5" />
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive hover:text-destructive"
                        disabled={isPending && pendingId === row.original.id}
                        onClick={() => handleReject(row.original.id)}
                      >
                        <X className="mr-1 size-3.5" />
                        ปฏิเสธ
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
