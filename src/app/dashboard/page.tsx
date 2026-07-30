import { requireCustomerPage } from "@/lib/customer-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const session = await requireCustomerPage();
  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.id)
    .maybeSingle();

  return <DashboardView customerName={profile?.full_name ?? "ลูกค้า"} />;
}
