const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const HASH = "SHA-256";

function generateSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return Array.from(salt)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password, existingSalt) {
  const salt = existingSalt || generateSalt();
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: HASH
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(":");
  if (parts.length === 2) {
    const [salt, hash] = parts;
    const newHash = await hashPassword(password, salt);
    return newHash === storedHash;
  }

  const newHash = await hashPassword(password);
  const newParts = newHash.split(":");
  return newParts[1] === storedHash;
}

export function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    errors.push("One special character");
  return { valid: errors.length === 0, errors };
}
