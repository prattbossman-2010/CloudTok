import { authenticate } from "../middleware/auth.js";

export async function reportVideo(request, env, videoId) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const reason = (body.reason || "").trim();
  const details = (body.details || "").trim();

  if (!reason) return Response.json({ error: "Reason required" }, { status: 400 });

  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS content_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL, video_id INTEGER, reason TEXT, details TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}

  await env.DB.prepare("INSERT INTO content_reports (reporter_id, video_id, reason, details) VALUES (?, ?, ?, ?)").bind(auth.user.id, videoId, reason, details).run();
  return Response.json({ success: true });
}

export async function reportUser(request, env, username) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  const body = await request.json();
  const reason = (body.reason || "").trim();

  const { results: targetUser } = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).all();
  if (!targetUser.length) return Response.json({ error: "User not found" }, { status: 404 });

  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS content_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL, reported_user_id INTEGER, reason TEXT, details TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}

  await env.DB.prepare("INSERT INTO content_reports (reporter_id, reported_user_id, reason) VALUES (?, ?, ?)").bind(auth.user.id, targetUser[0].id, reason).run();
  return Response.json({ success: true });
}
