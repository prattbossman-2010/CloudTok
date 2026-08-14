import { hashPassword } from "../utils/crypto.js";
import { success, error } from "../utils/response.js";

export async function signup(request, env) {
  try {
    const body = await request.json();
    const { displayName, username, email, password } = body;

    if (!username || !email || !password) {
      return error("Username, email and password are required", 400, "MISSING_FIELDS");
    }

    if (username.length < 3) {
      return error("Username must be at least 3 characters", 400, "INVALID_USERNAME");
    }

    if (password.length < 6) {
      return error("Password must be at least 6 characters", 400, "WEAK_PASSWORD");
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
      userId: result.meta.last_row_id
    }, "Account created successfully");

  } catch (err) {
    if (err.message && err.message.includes("UNIQUE constraint failed")) {
      return error("Username or email already exists", 409, "DUPLICATE_USER");
    }

    return error("Could not create account", 500, "SIGNUP_ERROR");
  }
}