import { handlers } from "@/lib/auth";

/**
 * NextAuth v5 route handler — catches all /api/auth/* requests
 */
export const { GET, POST } = handlers;
