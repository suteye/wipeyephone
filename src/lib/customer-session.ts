import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "wipeye_customer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 วัน

function getSecretKey() {
  const secret = process.env.NEXT_PUBLIC_CUSTOMER_SESSION_SECRET;
  if (!secret) throw new Error("Missing CUSTOMER_SESSION_SECRET environment variable");
  return new TextEncoder().encode(secret);
}

// เรียกหลังยืนยัน LIFF ID token กับ LINE สำเร็จแล้วเท่านั้น (ดู src/lib/liff-verify.ts)
export async function createCustomerSession(profileId: string) {
  const token = await new SignJWT({ sub: profileId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getCustomerSession(): Promise<{ id: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string") return null;
    return { id: payload.sub };
  } catch {
    return null;
  }
}

// ใช้ใน Server Component ของหน้าที่ต้อง login เท่านั้น — เด้งไปหน้า /liff ให้ login ผ่าน LINE ใหม่
export async function requireCustomerPage(): Promise<{ id: string }> {
  const session = await getCustomerSession();
  if (!session) redirect("/liff");
  return session;
}

// ใช้ใน Server Action ที่ลูกค้าเรียก — โยน error แทนการ redirect เพราะ caller จัดการ {error}/{success} เอง
export async function requireCustomerAction(): Promise<{ id: string }> {
  const session = await getCustomerSession();
  if (!session) throw new Error("กรุณาเข้าสู่ระบบผ่าน LINE ก่อนทำรายการ");
  return session;
}
