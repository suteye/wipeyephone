"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ" };
  }

  try {
    await signIn("credentials", { username, password, redirectTo: "/post-login" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw error;
  }
}
