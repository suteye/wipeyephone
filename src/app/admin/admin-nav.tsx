"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Landmark, LayoutDashboard, MessageSquare, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const adminNavItems = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/orders", label: "คำสั่งซื้อ", icon: ClipboardList },
  { href: "/admin/products", label: "สินค้า", icon: Package },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users },
  { href: "/admin/bank-accounts", label: "บัญชีธนาคาร", icon: Landmark },
  { href: "/admin/templates", label: "ข้อความ", icon: MessageSquare },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 space-y-1 text-sm">
      {adminNavItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              active ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
