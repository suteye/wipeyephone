"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="grid min-h-dvh place-items-center bg-secondary/40 px-4">
      <section className="w-full max-w-sm rounded-2xl border bg-card p-6 sm:p-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            W
          </span>
          วิปอายโฟน
        </Link>
        <h1 className="mt-8 text-2xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ติดตามรายการซื้อและค่างวดของคุณ
        </p>
        <Button disabled className="mt-6 h-11 w-full rounded-xl" title="เร็วๆ นี้">
          <MessageCircle className="mr-2 size-4" />
          เข้าสู่ระบบด้วย LINE (เร็วๆ นี้)
        </Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          หรือ
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              name="username"
              className="mt-1.5 h-11"
              placeholder="ชื่อผู้ใช้ของคุณ"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              รหัสผ่าน
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              className="mt-1.5 h-11"
              placeholder="รหัสผ่าน"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button
            type="submit"
            disabled={pending}
            className="h-11 w-full rounded-xl"
          >
            <LockKeyhole className="mr-2 size-4" />
            {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          ยังไม่มีบัญชี? ติดต่อร้านผ่าน LINE เพื่อสมัครใช้งาน
        </p>
      </section>
    </main>
  );
}
