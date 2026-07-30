import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerInstallment } from "@/lib/orders";

export async function GET(_request: Request, context: RouteContext<"/api/installments/[id]">) {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const installment = await getCustomerInstallment(id, session.id);
  if (!installment) return Response.json({ error: "ไม่พบงวดนี้" }, { status: 404 });

  return Response.json(installment);
}
