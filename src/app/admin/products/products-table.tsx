"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ImageOff, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money } from "@/lib/mock-data";
import { PlanSheet, type PlanRow } from "./plan-sheet";
import { ProductSheet, type EditableProduct } from "./product-sheet";
import { deleteProduct } from "./actions";

export type ProductRow = EditableProduct;

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 font-medium">
      {label}
      <ArrowUpDown className="size-3.5 text-muted-foreground" />
    </button>
  );
}

export function ProductsTable({
  products,
  planByProductId,
}: {
  products: ProductRow[];
  planByProductId: Map<string, PlanRow>;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const data = useMemo(() => {
    if (statusFilter === "active") return products.filter((p) => p.isActive);
    if (statusFilter === "inactive") return products.filter((p) => !p.isActive);
    return products;
  }, [products, statusFilter]);

  const handleDelete = useCallback(
    (product: ProductRow) => {
      if (!window.confirm(`ลบ "${product.name}" ออกจากระบบ? การลบไม่สามารถย้อนกลับได้`)) return;
      setDeletingId(product.id);
      startTransition(async () => {
        const result = await deleteProduct(product.id);
        setDeletingId(null);
        if ("error" in result) {
          window.alert(result.error);
          return;
        }
        router.refresh();
      });
    },
    [router],
  );

  const columns = useMemo<ColumnDef<ProductRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortHeader label="สินค้า" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
              {row.original.coverImage ?? row.original.images[0] ? (
                <img
                  src={row.original.coverImage ?? row.original.images[0]}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImageOff className="size-4 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <SortHeader label="ราคา" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />,
        cell: ({ row }) => money.format(row.original.price),
      },
      {
        accessorKey: "stock",
        header: ({ column }) => <SortHeader label="สต็อก" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />,
      },
      {
        id: "condition",
        header: "สภาพ / แบตเตอรี่",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.conditionNote ?? "-"}
            {row.original.batteryHealth != null ? ` · แบต ${row.original.batteryHealth}%` : ""}
          </span>
        ),
      },
      {
        id: "media",
        header: "สื่อ",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.images.length} รูป · {row.original.videos.length} วิดีโอ
          </span>
        ),
      },
      {
        id: "plan",
        header: "แผนผ่อน",
        cell: ({ row }) => (
          <PlanSheet
            productId={row.original.id}
            productName={row.original.name}
            price={row.original.price}
            plan={planByProductId.get(row.original.id) ?? null}
          />
        ),
      },
      {
        accessorKey: "isActive",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={row.original.isActive ? "bg-pink-100 text-primary" : "bg-muted text-muted-foreground"}
          >
            {row.original.isActive ? "พร้อมขาย" : "ปิดการขาย"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "จัดการ",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ProductSheet mode="edit" product={row.original} />
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-destructive hover:text-destructive"
              disabled={isPending && deletingId === row.original.id}
              onClick={() => handleDelete(row.original)}
            >
              <Trash2 className="mr-1 size-3.5" />
              ลบ
            </Button>
          </div>
        ),
      },
    ],
    [planByProductId, isPending, deletingId, handleDelete],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      row.original.name.toLowerCase().includes(String(filterValue).toLowerCase()),
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 sm:w-72">
          <Search className="size-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-1.5">
          {(
            [
              { key: "all", label: "ทั้งหมด" },
              { key: "active", label: "พร้อมขาย" },
              { key: "inactive", label: "ปิดการขาย" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setStatusFilter(opt.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === opt.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ไม่พบสินค้าที่ตรงกับเงื่อนไข
        </p>
      ) : (
        <>
          {/* มือถือ: การ์ดเรียงแนวตั้ง */}
          <div className="mt-4 space-y-3 lg:hidden">
            {table.getRowModel().rows.map((row) => {
              const product = row.original;
              const cover = product.coverImage ?? product.images[0];
              return (
                <div key={product.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
                      {cover ? (
                        <img src={cover} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{product.name}</p>
                        <Badge
                          variant="secondary"
                          className={
                            product.isActive
                              ? "shrink-0 bg-pink-100 text-primary"
                              : "shrink-0 bg-muted text-muted-foreground"
                          }
                        >
                          {product.isActive ? "พร้อมขาย" : "ปิดการขาย"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{money.format(product.price)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        สต็อก {product.stock} · {product.conditionNote ?? "-"}
                        {product.batteryHealth != null ? ` · แบต ${product.batteryHealth}%` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {product.images.length} รูป · {product.videos.length} วิดีโอ
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PlanSheet
                      productId={product.id}
                      productName={product.name}
                      price={product.price}
                      plan={planByProductId.get(product.id) ?? null}
                    />
                    <ProductSheet mode="edit" product={product} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      disabled={isPending && deletingId === product.id}
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="mr-1 size-3.5" />
                      ลบ
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* จอใหญ่: ตาราง */}
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <Table className="min-w-190">
              <TableHeader className="bg-secondary/50 text-xs text-muted-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-5 py-3">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-5 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
