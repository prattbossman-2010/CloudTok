import { authenticate } from "../middleware/auth.js";

export async function blockUser(request, env, username) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  const { results: targetUser } = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ?"
  ).bind(username).all();
  if (!targetUser.length) return Response.json({ error: "User not found" }, { status: 404 });
  if (targetUser[0].id === auth.user.id) return Response.json({ error: "Cannot block yourself" }, { status: 400 });

  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS user_blocks (id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_id INTEGER NOT NULL, blocked_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(blocker_id, blocked_id))").run(); } catch(e) {}

  const { results: existing } = await env.DB.prepare("SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?").bind(auth.user.id, targetUser[0].id).all();

  if (existing.length > 0) {
    await env.DB.prepare("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?").bind(auth.user.id, targetUser[0].id).run();
    return Response.json({ success: true, blocked: false });
  }

  await env.DB.prepare("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)").bind(auth.user.id, targetUser[0].id).run();
  return Response.json({ success: true, blocked: true });
}

export async function getBlockedUsers(request, env) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;
  try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS user_blocks (id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_id INTEGER NOT NULL, blocked_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(blocker_id, blocked_id))").run(); } catch(e) {}
  const { results } = await env.DB.prepare("SELECT u.username, u.avatar, u.display_name FROM user_blocks b JOIN users u ON b.blocked_id = u.id WHERE b.blocker_id = ?").bind(auth.user.id).all();
  return Response.json({ blocked: results });
}
