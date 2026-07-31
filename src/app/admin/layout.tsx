import Link from "next/link";
import { AdminNav } from "./admin-nav";
import { AdminMobileNav } from "./admin-mobile-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-card p-5 lg:block">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              W
            </span>
            วิปอายโฟน
          </Link>
          <p className="mt-10 px-3 text-xs font-medium text-muted-foreground">เมนูจัดการร้าน</p>
          <AdminNav />
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="flex items-center gap-2 border-b bg-card px-4 py-3 lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                W
              </span>
              วิปอายโฟน · แอดมิน
            </Link>
          </header>
          <section className="flex-1 p-4 pb-24 sm:p-7 lg:pb-7">{children}</section>
        </div>
      </div>
      <AdminMobileNav />
    </main>
  );
}
