"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithLiff } from "./actions";

// ป้องกัน open redirect — รับเฉพาะ path ภายในเว็บเราเอง (ขึ้นต้นด้วย / เดี่ยว ไม่ใช่ //)
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

function LiffLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const next = safeNext(searchParams.get("next"));

    async function run() {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        setError("ยังไม่ได้ตั้งค่า LIFF ID (NEXT_PUBLIC_LIFF_ID)");
        return;
      }

      try {
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId, withLoginOnExternalBrowser: true });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          if (!cancelled) setError("ไม่พบข้อมูลยืนยันตัวตนจาก LINE");
          return;
        }

        const result = await loginWithLiff(idToken);
        if (cancelled) return;

        if ("error" in result) {
          setError(result.error);
          return;
        }

        router.replace(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="font-medium text-destructive">เข้าสู่ระบบไม่สำเร็จ</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
              <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">กำลังเข้าสู่ระบบผ่าน LINE...</p>
          </>
        )}
      </div>
    </main>
  );
}

function LiffLoadingFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">กำลังเข้าสู่ระบบผ่าน LINE...</p>
      </div>
    </main>
  );
}

export default function LiffLoginPage() {
  return (
    <Suspense fallback={<LiffLoadingFallback />}>
      <LiffLoginInner />
    </Suspense>
  );
}
