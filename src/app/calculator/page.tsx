import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallmentCalculator } from "@/components/installment-calculator";

export default function CalculatorPage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-17 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Button asChild variant="ghost" className="-ml-2 text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-1 size-4" />
              หน้าแรก
            </Link>
          </Button>
          <Link href="/" className="font-semibold">
            วิปอายโฟน
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <InstallmentCalculator />
      </div>
    </main>
  );
}
