export function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      cleaned[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

export function validateDisplayName(name) {
  return typeof name === "string" && name.length >= 1 && name.length <= 50;
}

export function validateCaption(caption) {
  return typeof caption === "string" && caption.length <= 500;
}

export function validateComment(text) {
  return typeof text === "string" && text.length >= 1 && text.length <= 1000;
}

export function validateMessage(text) {
  return typeof text === "string" && text.length >= 1 && text.length <= 5000;
}

export function sanitizeHTML(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function stripHTML(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
}

export function validateBody(schema) {
  return function(req) {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req[field];
      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
        continue;
      }
      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be a ${rules.type}`);
        }
        if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
          errors.push(rules.patternMessage || `${field} format is invalid`);
        }
      }
    }
    return errors.length > 0 ? errors : null;
  };
}
