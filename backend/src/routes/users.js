import { hashPassword } from "../utils/crypto.js";
import { success, error } from "../utils/response.js";

export async function signup(request, env) {
  try {
    const body = await request.json();

    const displayName = (body.displayName || body.display_name || "").toString().trim();
    const username = (body.username || "").toString().trim().toLowerCase();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    // Validation
    if (!username || !email || !password) {
      return error("Username, email and password are required", 400, "MISSING_FIELDS");
    }

    if (username.length < 3) {
      return error("Username must be at least 3 characters", 400, "USERNAME_TOO_SHORT");
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return error("Username can only contain letters, numbers and underscores", 400, "INVALID_USERNAME");
    }

    if (!email.includes("@")) {
      return error("Please enter a valid email address", 400, "INVALID_EMAIL");
    }

    if (password.length < 6) {
      return error("Password must be at least 6 characters", 400, "PASSWORD_TOO_SHORT");
    }

    const passwordHash = await hashPassword(password);

    const result = await env.DB.prepare(`
      INSERT INTO users (display_name, username, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).bind(
      displayName || username,
      username,
      email,
      passwordHash
    ).run();

    return success({
      userId: result.meta.last_row_id,
      username
    }, "Account created successfully");

  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return error("Username or email already exists", 409, "ALREADY_EXISTS");
    }

    return error(err.message || "Signup failed", 500, "SERVER_ERROR");
  }
}