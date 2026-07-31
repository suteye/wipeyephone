import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PhonePlan = {
  id: string;
  totalInstallments: number;
  installmentAmount: number;
};

export type PhoneDetail = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  condition: string | null;
  battery: number | null;
  images: string[];
  videos: string[];
  plan: PhonePlan | null;
};

export async function GET(_request: Request, context: RouteContext<"/api/phones/[id]">) {
  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();

  const [{ data: product }, { data: plans }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, description, condition_note, battery_health, images, videos, cover_image")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("installment_plans")
      .select("id, total_installments, installment_amount")
      .eq("product_id", id)
      .eq("is_active", true)
      .order("total_installments", { ascending: true }),
  ]);

  if (!product) return Response.json({ error: "ไม่พบสินค้านี้" }, { status: 404 });

  const plan = plans?.[0];

  const images = product.images ?? [];
  const orderedImages = product.cover_image
    ? [product.cover_image, ...images.filter((src: string) => src !== product.cover_image)]
    : images;

  const detail: PhoneDetail = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    description: product.description,
    condition: product.condition_note,
    battery: product.battery_health,
    images: orderedImages,
    videos: product.videos ?? [],
    plan: plan
      ? { id: plan.id, totalInstallments: plan.total_installments, installmentAmount: Number(plan.installment_amount) }
      : null,
  };

  return Response.json(detail);
}
