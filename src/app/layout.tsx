import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "วิปอายโฟน | iPhone มือสอง",
  description: "เลือก iPhone มือสอง ชำระเต็ม หรือผ่อนชำระกับวิปอายโฟน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${prompt.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
