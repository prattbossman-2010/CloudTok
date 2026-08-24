export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(env, email, code) {
  // For now, store in DB for dev - email service can be plugged in later
  return { sent: true, devCode: code };
}
