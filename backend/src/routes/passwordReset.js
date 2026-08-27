import { hashPassword, validatePasswordStrength } from "../utils/crypto.js";
import { success, error } from "../utils/response.js";

const TOKEN_EXPIRY = 60 * 60 * 1000;
const CODE_LENGTH = 6;
const MAX_RESET_REQUESTS = 10;
const RESET_WINDOW = 60 * 60 * 1000;

async function ensureResetTable(env) {
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      verified INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run();
  } catch(e) {}
}

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

async function sendResetEmail(env, toEmail, code) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.EMAIL_FROM;

  console.log(`[PasswordReset] RESEND_API_KEY present: ${!!apiKey}, EMAIL_FROM: ${fromEmail || "not set"}`);

  if (!apiKey) {
    console.log(`[PasswordReset] No RESEND_API_KEY set. Code for ${toEmail}: ${code}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail || "CloudTok <noreply@resend.dev>",
        to: [toEmail],
        subject: "Your CloudTok Password Reset Code",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:40px;">
            <h2 style="color:#ff2d55;">CloudTok Password Reset</h2>
            <p>Your verification code is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0;">${code}</div>
            <p style="color:#888;font-size:13px;">This code expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `
      })
    });

    const respText = await res.text();
    console.log(`[PasswordReset] Resend API response: ${res.status} ${respText}`);

    if (!res.ok) {
      console.error(`[PasswordReset] Email send failed: ${res.status} ${respText}`);
      return false;
    }
    return true;
  } catch(e) {
    console.error(`[PasswordReset] Email error:`, e.message);
    return false;
  }
}

export async function forgotPassword(request, env) {
  try {
    await ensureResetTable(env);
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return error("Email is required", 400, "MISSING_EMAIL");
    }

    const emailLower = email.toLowerCase();

    // Clean up old reset records (older than 1 hour)
    await env.DB.prepare(
      "DELETE FROM password_resets WHERE created_at < datetime('now', '-1 hour')"
    ).run();

    const { results } = await env.DB.prepare(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER(?)"
    ).bind(email).all();

    if (results.length === 0) {
      return success(null, "If an account exists with that email, a reset code has been sent.");
    }

    const { results: recent } = await env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM password_resets WHERE email = ? AND used = 0 AND created_at > datetime('now', '-1 hour')"
    ).bind(emailLower).all();

    if (recent[0] && recent[0].cnt >= MAX_RESET_REQUESTS) {
      return error("Too many reset requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const code = generateCode();
    const token = generateToken();

    await env.DB.prepare(
      "INSERT INTO password_resets (email, code, token) VALUES (?, ?, ?)"
    ).bind(emailLower, code, token).run();

    const emailSent = await sendResetEmail(env, results[0].email, code);

    return success({
      token,
      message: "If an account exists with that email, a reset code has been sent.",
      devCode: emailSent ? undefined : code
    }, "Reset code sent");

  } catch (err) {
    return error("Failed to process reset request", 500, "RESET_ERROR");
  }
}

export async function verifyResetCode(request, env) {
  try {
    await ensureResetTable(env);
    const body = await request.json();
    const { token, code } = body;

    if (!token || !code) {
      return error("Token and code are required", 400, "MISSING_FIELDS");
    }

    const { results } = await env.DB.prepare(
      "SELECT * FROM password_resets WHERE token = ?"
    ).bind(token).all();

    if (results.length === 0) {
      return error("Invalid or expired reset session", 400, "INVALID_TOKEN");
    }

    const reset = results[0];

    if (reset.used) {
      return error("Reset code already used", 400, "CODE_USED");
    }

    const created = new Date(reset.created_at + "Z").getTime();
    if (Date.now() - created > TOKEN_EXPIRY) {
      await env.DB.prepare("DELETE FROM password_resets WHERE token = ?").bind(token).run();
      return error("Reset code expired. Please request a new one.", 400, "CODE_EXPIRED");
    }

    if (reset.code !== code) {
      return error("Invalid verification code", 400, "INVALID_CODE");
    }

    await env.DB.prepare(
      "UPDATE password_resets SET verified = 1 WHERE token = ?"
    ).bind(token).run();

    return success({ verified: true }, "Code verified successfully");

  } catch (err) {
    return error("Failed to verify code", 500, "VERIFY_ERROR");
  }
}

export async function resetPassword(request, env) {
  try {
    await ensureResetTable(env);
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

    const { results } = await env.DB.prepare(
      "SELECT * FROM password_resets WHERE token = ?"
    ).bind(token).all();

    if (results.length === 0) {
      return error("Invalid or expired reset session", 400, "INVALID_TOKEN");
    }

    const reset = results[0];

    if (reset.used) {
      return error("Reset code already used", 400, "CODE_USED");
    }

    const created = new Date(reset.created_at + "Z").getTime();
    if (Date.now() - created > TOKEN_EXPIRY) {
      await env.DB.prepare("DELETE FROM password_resets WHERE token = ?").bind(token).run();
      return error("Reset session expired. Please start over.", 400, "SESSION_EXPIRED");
    }

    if (reset.code !== code && !reset.verified) {
      return error("Invalid verification code", 400, "INVALID_CODE");
    }

    if (!reset.verified) {
      return error("Code not verified. Please verify first.", 400, "NOT_VERIFIED");
    }

    const passwordHash = await hashPassword(newPassword);

    await env.DB.prepare(
      "UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)"
    ).bind(passwordHash, reset.email).run();

    await env.DB.prepare("DELETE FROM password_resets WHERE token = ?").bind(token).run();

    return success(null, "Password reset successfully");

  } catch (err) {
    return error("Failed to reset password", 500, "RESET_ERROR");
  }
}
