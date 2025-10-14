// lib/auth.ts
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

// Extend NextAuth types to include id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "dummy-github-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "dummy-github-secret",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-google-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-google-secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "dummy-secret",
  session: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    // Runs when user signs in
    async signIn({ user }) {
      // Temporarily disable DB checks to avoid errors
      // TODO: Re-enable once Supabase is properly configured
      return true; // allow sign-in
    },

    // Add email to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },

    // Add email and id to session so frontend can query preferences
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        // Temporarily set dummy id
        session.user.id = "dummy-id";
      }
      return session;
    },
  },
};
