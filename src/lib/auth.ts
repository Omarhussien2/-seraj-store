import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

/**
 * NextAuth v5 configuration — single admin user, credentials compared with env vars.
 * No database users collection needed.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
        const adminPassword = process.env.ADMIN_PASSWORD; // Backwards compatibility

        let isValidPassword = false;

        if (adminPasswordHash) {
          isValidPassword = await bcrypt.compare(credentials.password as string, adminPasswordHash);
        } else if (adminPassword) {
          // Warning: using plain text password (not recommended)
          isValidPassword = credentials.password === adminPassword;
        }

        if (credentials.email === adminEmail && isValidPassword) {
          return {
            id: "1",
            email: adminEmail!,
            name: "Admin",
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user info in the token on first sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach token data to the session
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
