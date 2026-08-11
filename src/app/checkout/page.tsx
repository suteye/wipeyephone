import { requireCustomerPage } from "@/lib/customer-session";
import { isFrequency, isWeekOption } from "@/lib/installment-plan";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
    else if (Array.isArray(value)) for (const v of value) query.append(key, v);
  }
  const nextPath = query.size > 0 ? `/checkout?${query.toString()}` : "/checkout";
  await requireCustomerPage(nextPath);

  const installmentId = typeof params.installment === "string" ? params.installment : null;
  const phoneId = typeof params.phone === "string" ? params.phone : null;
  const mode = params.mode === "installment" ? "installment" : "full";
  const freq = isFrequency(params.freq) ? params.freq : null;
  const weeks = isWeekOption(Number(params.weeks)) ? Number(params.weeks) : null;

  return (
    <CheckoutForm phoneId={phoneId} mode={mode} installmentId={installmentId} freq={freq} weeks={weeks} />
  );
}
