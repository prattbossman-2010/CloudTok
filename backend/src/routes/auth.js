import { hashPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";
import { success, error } from "../utils/response.js";

export async function login(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return error("Email and password are required", 400, "MISSING_FIELDS");
    }

    const { results } = await env.DB.prepare(`
      SELECT id, username, email, display_name, avatar, bio, password_hash, role, status
      FROM users
      WHERE email = ?
    `).bind(email).all();

    if (results.length === 0) {
      return error("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const user = results[0];

    if (user.status === "banned" || user.status === "suspended") {
      return error("This account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }

    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
      return error("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const token = await createToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user"
    }, env.JWT_SECRET);

    return success({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role || "user"
      }
    }, "Login successful");

  } catch (err) {
    return error(err.message || "Login failed", 500, "LOGIN_ERROR");
  }
}