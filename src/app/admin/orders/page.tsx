import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/auth";
import { getOrders } from "@/lib/admin/orders";

const fullPaymentLabel: Record<string, string> = {
  approved: "ชำระแล้ว",
  pending_review: "รอตรวจสอบ",
  rejected: "ถูกปฏิเสธ",
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getOrders();

  return (
    <>
      <header>
        <p className="text-sm text-muted-foreground">{orders.length} รายการซื้อ</p>
        <h1 className="mt-1 text-2xl font-semibold">คำสั่งซื้อ</h1>
      </header>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          ยังไม่มีคำสั่งซื้อเลย
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="border-b bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">ลูกค้า</th>
                <th className="px-5 py-3 font-medium">เครื่อง</th>
                <th className="px-5 py-3 font-medium">การชำระ</th>
                <th className="px-5 py-3 font-medium">ความคืบหน้า</th>
                <th className="px-5 py-3 font-medium">ครบกำหนดถัดไป</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-b last:border-0">
                  <td className="px-5 py-4 font-medium">{order.customerName}</td>
                  <td className="px-5 py-4 text-muted-foreground">{order.deviceName}</td>
                  <td className="px-5 py-4">{order.paymentType === "full" ? "ชำระเต็ม" : "ผ่อนชำระ"}</td>
                  <td className="px-5 py-4">
                    {order.paymentType === "full" ? (
                      <Badge
                        variant="secondary"
                        className={
                          order.fullPaymentStatus === "approved"
                            ? "bg-pink-100 text-primary"
                            : order.fullPaymentStatus === "rejected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-rose-100 text-rose-800"
                        }
                      >
                        {order.fullPaymentStatus ? fullPaymentLabel[order.fullPaymentStatus] : "ยังไม่ชำระ"}
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {order.paidInstallments}/{order.totalInstallments} งวด
                        </span>
                        {order.overdue && (
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                            ค้างชำระ
                          </Badge>
                        )}
                        {!order.overdue && order.paidInstallments === order.totalInstallments && order.totalInstallments > 0 && (
                          <Badge variant="secondary" className="bg-pink-100 text-primary">
                            ผ่อนครบแล้ว
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {order.paymentType === "installment" && order.nextDueDate
                      ? new Date(order.nextDueDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
