import { redirect } from "next/navigation";
import { auth } from "@/auth";

// จุดเดียวที่ตัดสินใจว่า login แล้วต้องไปหน้าไหน แยกไว้จาก login action
// เพื่อรองรับ provider อื่นในอนาคต (เช่น LINE) ที่ไม่ได้เดินผ่าน actions.ts
export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
}
