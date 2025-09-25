// lib/auth.ts
import GitHubProvider from "next-auth/providers/github";
import { NextAuthOptions } from "next-auth";
import { supabase } from "@/lib/supabaseClient";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // Runs when user signs in
    async signIn({ user }) {
    

      // 1️⃣ check if profile exists in your profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      // 2️⃣ if not → insert new profile
      if (!profile) {
        await supabase.from("profiles").insert({
          email: user.email,
          full_name: user.name || "",
        });
      }

      return true; // allow sign-in
    },

    // Add email to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },

    // Add email to session so frontend can query preferences
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
