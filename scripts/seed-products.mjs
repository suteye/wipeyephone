// ใส่สินค้าตัวอย่างลงตาราง products + installment_plans จริง (ข้อมูลชุดเดียวกับ mock-data.ts)
// วิธีรัน: node --env-file=.env scripts/seed-products.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const phones = [
  { name: "iPhone 15 Pro 256 GB · Natural Titanium", price: 28900, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=82", condition: "สวยมาก", battery: 98, installments: 3 },
  { name: "iPhone 14 Pro 128 GB · Deep Purple", price: 21200, image: "https://images.unsplash.com/photo-1663499482523-3c7d4c7d35d9?auto=format&fit=crop&w=900&q=82", condition: "สภาพดี", battery: 91, installments: 2 },
  { name: "iPhone 13 128 GB · Starlight", price: 14800, image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=900&q=82", condition: "สภาพดี", battery: 88, installments: 2 },
  { name: "iPhone 12 64 GB · Black", price: 10900, image: "https://images.unsplash.com/photo-1603898037225-1bea0e9a40ad?auto=format&fit=crop&w=900&q=82", condition: "มีรอยเล็กน้อย", battery: 86, installments: 2 },
];

const { count } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true });

if (count && count > 0) {
  console.log(`มีสินค้าอยู่แล้ว ${count} รายการ — ข้ามการ seed (ลบของเดิมออกก่อนถ้าต้องการ seed ใหม่)`);
  process.exit(0);
}

for (const phone of phones) {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert({
      name: phone.name,
      price: phone.price,
      stock: 1,
      condition_note: phone.condition,
      battery_health: phone.battery,
      images: [phone.image],
      is_active: true,
    })
    .select("id")
    .single();

  if (productError) {
    console.error(`เพิ่ม "${phone.name}" ไม่สำเร็จ:`, productError.message);
    continue;
  }

  const { error: planError } = await supabaseAdmin.from("installment_plans").insert({
    product_id: product.id,
    deposit: 0,
    total_installments: phone.installments,
    interval_days: 7,
    installment_amount: Math.round(phone.price / phone.installments),
    is_active: true,
  });

  if (planError) {
    console.error(`เพิ่มแผนผ่อน "${phone.name}" ไม่สำเร็จ:`, planError.message);
    continue;
  }

  console.log(`เพิ่มแล้ว: ${phone.name}`);
}
