import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "customer" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "customer" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "customer" | "admin";
  }
}
