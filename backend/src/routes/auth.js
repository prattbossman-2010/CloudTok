import { verifyPassword, validatePasswordStrength } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";
import { success, error } from "../utils/response.js";

const loginAttempts = new Map();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function isLockedOut(email) {
  const record = loginAttempts.get(email);
  if (!record) return false;
  if (record.count >= LOCKOUT_THRESHOLD) {
    const elapsed = Date.now() - record.lastAttempt;
    if (elapsed < LOCKOUT_DURATION) return true;
    loginAttempts.delete(email);
  }
  return false;
}

function recordFailedAttempt(email) {
  const record = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  record.count++;
  record.lastAttempt = Date.now();
  loginAttempts.set(email, record);
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

export async function login(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log(`[Login] Attempt for email: ${email}`);

    if (!email || !password) {
      return error("Email and password are required", 400, "MISSING_FIELDS");
    }

    if (isLockedOut(email)) {
      return error("Account temporarily locked. Try again in 15 minutes.", 429, "ACCOUNT_LOCKED");
    }

    const { results } = await env.DB.prepare(`
      SELECT id, username, email, display_name, avatar, bio, password_hash, role, status
      FROM users
      WHERE LOWER(email) = LOWER(?)
    `).bind(email).all();

    console.log(`[Login] Email lookup: ${results.length} results`);

    if (results.length === 0) {
      recordFailedAttempt(email);
      return error("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const user = results[0];
    console.log(`[Login] User found: ${user.username}, hash length: ${(user.password_hash || "").length}, hash prefix: ${(user.password_hash || "").substring(0, 10)}`);

    if (user.status === "banned" || user.status === "suspended") {
      return error("This account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    console.log(`[Login] Password valid: ${passwordValid}`);

    if (!passwordValid) {
      recordFailedAttempt(email);
      return error("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    clearAttempts(email);

    const token = await createToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user"
    }, env.JWT_SECRET);

    console.log(`[Login] SUCCESS for ${user.username}`);

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
    console.error(`[Login] ERROR:`, err.message, err.stack);
    return error(err.message || "Login failed", 500, "LOGIN_ERROR");
  }
}