// สร้างบัญชีแอดมินคนแรก (เขียนตรงลง profiles + auth_accounts ไม่ผ่าน Supabase Auth)
// วิธีรัน: node --env-file=.env scripts/create-admin.mjs <username> <password> [ชื่อเต็ม]
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const [username, password, fullName] = process.argv.slice(2);

if (!username || !password) {
  console.error("ใช้งาน: node --env-file=.env scripts/create-admin.mjs <username> <password> [ชื่อเต็ม]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env");
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: profile, error: profileError } = await supabaseAdmin
  .from("profiles")
  .insert({ full_name: fullName ?? null, role: "admin" })
  .select("id")
  .single();

if (profileError) {
  console.error("สร้าง profile ไม่สำเร็จ:", profileError.message);
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

const { error: accountError } = await supabaseAdmin
  .from("auth_accounts")
  .insert({ profile_id: profile.id, username, password_hash: passwordHash });

if (accountError) {
  console.error("สร้าง auth_accounts ไม่สำเร็จ:", accountError.message);
  // ลบ profile ที่เพิ่งสร้างทิ้ง กันเหลือ profile ที่ไม่มีทาง login ได้ค้างอยู่
  await supabaseAdmin.from("profiles").delete().eq("id", profile.id);
  process.exit(1);
}

console.log(`สร้างแอดมินสำเร็จ: ${username}`);
