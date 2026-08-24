import { authenticate } from "./auth.js";

export async function requireAdmin(request, env) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;
  if (auth.user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  return { user: auth.user };
}
