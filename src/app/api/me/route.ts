import { getCustomerSession } from "@/lib/customer-session";

export async function GET() {
  const session = await getCustomerSession();
  return Response.json({ loggedIn: !!session });
}
