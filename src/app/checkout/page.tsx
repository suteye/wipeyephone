import { requireCustomerPage } from "@/lib/customer-session";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  await requireCustomerPage();
  const params = await searchParams;

  const installmentId = typeof params.installment === "string" ? params.installment : null;
  const phoneId = typeof params.phone === "string" ? params.phone : null;
  const mode = params.mode === "installment" ? "installment" : "full";

  return <CheckoutForm phoneId={phoneId} mode={mode} installmentId={installmentId} />;
}
