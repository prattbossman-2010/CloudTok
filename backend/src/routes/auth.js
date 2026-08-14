import { hashPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";
import { success, error } from "../utils/response.js";

export async function login(request, env) {
  try {
    const body = await request.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    // Validation
    if (!email || !password) {
      return error("Email and password are required", 400, "MISSING_FIELDS");
    }

    if (!email.includes("@")) {
      return error("Please enter a valid email address", 400, "INVALID_EMAIL");
    }

    const { results } = await env.DB.prepare(`
      SELECT id, username, email, display_name, avatar, bio, password_hash, role
      FROM users
      WHERE email = ?
    `).bind(email).all();

    if (results.length === 0) {
      return error("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const user = results[0];
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
    return error(err.message || "Login failed", 500, "SERVER_ERROR");
  }
}