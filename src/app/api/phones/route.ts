import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type StockPhone = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  condition: string | null;
  battery: number | null;
};

export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, condition_note, battery_health, images")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const phones: StockPhone[] = (data ?? []).map((product) => {
    const images = product.images ?? [];
    const image = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : null;
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image,
      condition: product.condition_note,
      battery: product.battery_health,
    };
  });

  return Response.json(phones);
}
