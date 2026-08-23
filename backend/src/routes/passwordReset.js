import { hashPassword, validatePasswordStrength } from "../utils/crypto.js";
import { success, error } from "../utils/response.js";

const resetTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000;
const CODE_LENGTH = 6;
const MAX_RESET_REQUESTS = 3;
const RESET_WINDOW = 60 * 60 * 1000;

const resetRequestCounts = new Map();

function generateCode() {
  const arr = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b % 10).join("");
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

export async function forgotPassword(request, env) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return error("Email is required", 400, "MISSING_EMAIL");
    }

    const requestKey = email.toLowerCase();
    const record = resetRequestCounts.get(requestKey) || { count: 0, resetAt: 0 };

    if (record.count >= MAX_RESET_REQUESTS && Date.now() < record.resetAt) {
      return error("Too many reset requests. Please try again later.", 429, "RATE_LIMITED");
    }

    if (Date.now() > record.resetAt) {
      record.count = 0;
      record.resetAt = Date.now() + RESET_WINDOW;
    }

    const { results } = await env.DB.prepare(
      "SELECT id, email FROM users WHERE email = ?"
    ).bind(email).all();

    if (results.length === 0) {
      return success(null, "If an account exists with that email, a reset code has been sent.");
    }

    const code = generateCode();
    const token = generateToken();

    resetTokens.set(token, {
      email: email.toLowerCase(),
      code,
      createdAt: Date.now(),
      used: false
    });

    record.count++;
    resetRequestCounts.set(requestKey, record);

    console.log(`[PasswordReset] Code for ${email}: ${code}`);

    return success({
      token,
      message: "If an account exists with that email, a reset code has been sent.",
      devCode: code
    }, "Reset code sent");

  } catch (err) {
    return error("Failed to process reset request", 500, "RESET_ERROR");
  }
}

export async function verifyResetCode(request, env) {
  try {
    const body = await request.json();
    const { token, code } = body;

    if (!token || !code) {
      return error("Token and code are required", 400, "MISSING_FIELDS");
    }

    const resetData = resetTokens.get(token);

    if (!resetData) {
      return error("Invalid or expired reset session", 400, "INVALID_TOKEN");
    }

    if (resetData.used) {
      return error("Reset code already used", 400, "CODE_USED");
    }

    if (Date.now() - resetData.createdAt > TOKEN_EXPIRY) {
      resetTokens.delete(token);
      return error("Reset code expired. Please request a new one.", 400, "CODE_EXPIRED");
    }

    if (resetData.code !== code) {
      return error("Invalid verification code", 400, "INVALID_CODE");
    }

    resetData.verified = true;
    resetTokens.set(token, resetData);

    return success({ verified: true }, "Code verified successfully");

  } catch (err) {
    return error("Failed to verify code", 500, "VERIFY_ERROR");
  }
}

export async function resetPassword(request, env) {
  try {
    const body = await request.json();
    const { token, code, newPassword, confirmPassword } = body;

    if (!token || !code || !newPassword || !confirmPassword) {
      return error("All fields are required", 400, "MISSING_FIELDS");
    }

    if (newPassword !== confirmPassword) {
      return error("Passwords do not match", 400, "PASSWORDS_MISMATCH");
    }

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return error("Password too weak: " + passwordCheck.errors.join(", "), 400, "WEAK_PASSWORD");
    }

    const resetData = resetTokens.get(token);

    if (!resetData) {
      return error("Invalid or expired reset session", 400, "INVALID_TOKEN");
    }

    if (resetData.used) {
      return error("Reset code already used", 400, "CODE_USED");
    }

    if (Date.now() - resetData.createdAt > TOKEN_EXPIRY) {
      resetTokens.delete(token);
      return error("Reset session expired. Please start over.", 400, "SESSION_EXPIRED");
    }

    if (resetData.code !== code) {
      return error("Invalid verification code", 400, "INVALID_CODE");
    }

    if (!resetData.verified) {
      return error("Code not verified. Please verify first.", 400, "NOT_VERIFIED");
    }

    const passwordHash = await hashPassword(newPassword);

    await env.DB.prepare(
      "UPDATE users SET password_hash = ? WHERE email = ?"
    ).bind(passwordHash, resetData.email).run();

    resetData.used = true;
    resetTokens.delete(token);

    return success(null, "Password reset successfully");

  } catch (err) {
    return error("Failed to reset password", 500, "RESET_ERROR");
  }
}
