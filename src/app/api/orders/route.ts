import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerOrders } from "@/lib/orders";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  const orders = await getCustomerOrders(session.id);
  return Response.json(orders);
}
