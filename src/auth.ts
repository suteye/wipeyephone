import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const supabaseAdmin = createSupabaseAdminClient();
        const { data: account } = await supabaseAdmin
          .from("auth_accounts")
          .select("profile_id, password_hash")
          .eq("username", username)
          .maybeSingle();

        if (!account) return null;

        const passwordMatches = await bcrypt.compare(password, account.password_hash);
        if (!passwordMatches) return null;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", account.profile_id)
          .maybeSingle();

        if (!profile) return null;

        return { id: profile.id, name: profile.full_name ?? username, role: profile.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "customer" | "admin";
        session.user.id = token.sub!;
      }
      return session;
    },
  },
});
