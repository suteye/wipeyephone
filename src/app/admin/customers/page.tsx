import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/auth";
import { getCustomers } from "@/lib/admin/orders";
import { money } from "@/lib/mock-data";

export default async function AdminCustomersPage() {
  await requireAdmin();
  const customers = await getCustomers();

  return (
    <>
      <header>
        <p className="text-sm text-muted-foreground">{customers.length} คน</p>
        <h1 className="mt-1 text-2xl font-semibold">ลูกค้า</h1>
      </header>

      {customers.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีลูกค้าซื้อเครื่องเลย
        </p>
      ) : (
        <>
          {/* มือถือ: การ์ดเรียงแนวตั้ง */}
          <div className="mt-6 space-y-3 md:hidden">
            {customers.map((customer) => (
              <div key={customer.customerId} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{customer.name}</p>
                  {customer.overdueOrders > 0 ? (
                    <Badge variant="secondary" className="shrink-0 bg-destructive/10 text-destructive">
                      ค้างชำระ {customer.overdueOrders} รายการ
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0 bg-pink-100 text-primary">
                      ปกติ
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">รายการซื้อ</p>
                    <p className="mt-0.5 font-medium">{customer.totalOrders} รายการ</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ยอดซื้อสะสม</p>
                    <p className="mt-0.5 font-medium">{money.format(customer.totalSpent)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">กำลังผ่อนอยู่</p>
                    <p className="mt-0.5 font-medium">
                      {customer.activeInstallmentOrders > 0 ? `${customer.activeInstallmentOrders} รายการ` : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* จอใหญ่: ตาราง */}
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border bg-card md:block">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="border-b bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">ลูกค้า</th>
                  <th className="px-5 py-3 font-medium">จำนวนรายการซื้อ</th>
                  <th className="px-5 py-3 font-medium">ยอดซื้อสะสม</th>
                  <th className="px-5 py-3 font-medium">กำลังผ่อนอยู่</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.customerId} className="border-b last:border-0">
                    <td className="px-5 py-4 font-medium">{customer.name}</td>
                    <td className="px-5 py-4">{customer.totalOrders} รายการ</td>
                    <td className="px-5 py-4">{money.format(customer.totalSpent)}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {customer.activeInstallmentOrders > 0 ? `${customer.activeInstallmentOrders} รายการ` : "-"}
                    </td>
                    <td className="px-5 py-4">
                      {customer.overdueOrders > 0 ? (
                        <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                          ค้างชำระ {customer.overdueOrders} รายการ
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-pink-100 text-primary">
                          ปกติ
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
