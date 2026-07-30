import { NextResponse } from "next/server";
import { auth } from "@/auth";

// กันหน้า /admin ไว้ชั้นแรก แต่ proxy ไม่ควรเป็นด่านเดียว — admin/page.tsx และ
// server actions เช็ค role ซ้ำอีกชั้นเสมอ (ดู node_modules/next/dist/docs/.../authentication.md)
export const proxy = auth((request) => {
  if (request.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
