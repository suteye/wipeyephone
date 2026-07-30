import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return { user: session.user };
}
