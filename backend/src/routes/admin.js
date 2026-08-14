import { authenticate } from "../middleware/auth.js";
import { hashPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";

export async function adminLogin(request, env) {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
        return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    const { results } = await env.DB.prepare(`
        SELECT id, username, email, display_name, avatar, role, password_hash
        FROM users WHERE email = ?
    `).bind(email).all();

    if (results.length === 0) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = results[0];
    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "admin") {
        return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const token = await createToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    }, env.JWT_SECRET);

    return Response.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        }
    });
}

export async function adminCheck(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    if (auth.user.role !== "admin") {
        return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    return { user: auth.user };
}

export async function adminGetStats(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const users = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const videos = await env.DB.prepare("SELECT COUNT(*) as count FROM videos").first();
    const likes = await env.DB.prepare("SELECT COUNT(*) as count FROM video_likes").first();
    const comments = await env.DB.prepare("SELECT COUNT(*) as count FROM video_comments").first();
    const follows = await env.DB.prepare("SELECT COUNT(*) as count FROM follows").first();

    return Response.json({
        users: users.count,
        videos: videos.count,
        likes: likes.count,
        comments: comments.count,
        follows: follows.count
    });
}

export async function adminGetUsers(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const { results } = await env.DB.prepare(`
        SELECT id, username, display_name, email, avatar, bio, role, status, created_at
        FROM users ORDER BY created_at DESC
    `).all();

    return Response.json({ users: results });
}

export async function adminUpdateUser(request, env, userId) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const body = await request.json();
    const { status, role } = body;

    if (status) {
        await env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(status, userId).run();
    }
    if (role) {
        await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
    }

    return Response.json({ success: true });
}

export async function adminDeleteVideo(request, env, videoId) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    await env.DB.prepare("DELETE FROM video_likes WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_comments WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_saves WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();

    return Response.json({ success: true });
}

export async function adminGetVideos(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const { results } = await env.DB.prepare(`
        SELECT videos.id, videos.caption, videos.video_url, videos.thumbnail_url,
               videos.likes, videos.comments, videos.views, videos.created_at,
               users.username
        FROM videos JOIN users ON videos.user_id = users.id
        ORDER BY videos.created_at DESC
    `).all();

    return Response.json({ videos: results });
}

export async function adminRunMigration(request, env) {
  const auth = await adminCheck(request, env);
  if (auth.error) return auth;

  const results = [];

  // ========== Existing column migrations ==========
  const columnMigrations = [
    { sql: "ALTER TABLE videos ADD COLUMN tags TEXT DEFAULT '[]'", name: "tags" },
    { sql: "ALTER TABLE videos ADD COLUMN category TEXT DEFAULT 'General'", name: "category" },
    { sql: "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'", name: "status" },
    { sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", name: "role" }
  ];

  for (const m of columnMigrations) {
    try {
      await env.DB.prepare(m.sql).run();
      results.push(`Added ${m.name} column`);
    } catch (e) {
      if (e.message && e.message.includes("duplicate column")) {
        results.push(`${m.name} column already exists`);
      } else {
        results.push(`${m.name} error: ${e.message}`);
      }
    }
  }

  // ========== Tables ==========
  const tables = [
    {
      name: "webrtc_signals",
      sql: `CREATE TABLE IF NOT EXISTS webrtc_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_username TEXT NOT NULL,
        to_username TEXT NOT NULL,
        signal_type TEXT NOT NULL,
        signal_data TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      )`
    },
    {
      name: "live_streams",
      sql: `CREATE TABLE IF NOT EXISTS live_streams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        stream_key TEXT UNIQUE NOT NULL,
        title TEXT DEFAULT 'Live Stream',
        status TEXT DEFAULT 'active',
        viewers INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        ended_at TEXT
      )`
    },
    {
      name: "transactions",
      sql: `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        reference TEXT UNIQUE NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now'))
      )`
    },
    {
      name: "storage_events",
      sql: `CREATE TABLE IF NOT EXISTS storage_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        provider TEXT DEFAULT '',
        filename TEXT DEFAULT '',
        file_size INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        error_message TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )`
    }
  ];

  for (const t of tables) {
    try {
      await env.DB.prepare(t.sql).run();
      results.push(`Created ${t.name} table`);
    } catch (e) {
      results.push(`${t.name}: ${e.message}`);
    }
  }

  // ========== Performance Indexes ==========
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category)",
    "CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id)",
    "CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_video_likes_user_video ON video_likes(user_id, video_id)",
    "CREATE INDEX IF NOT EXISTS idx_video_saves_user_id ON video_saves(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_video_saves_video_id ON video_saves(video_id)",
    "CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id)",
    "CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)",
    "CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read)",
    "CREATE INDEX IF NOT EXISTS idx_storage_events_created ON storage_events(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
  ];

  for (const sql of indexes) {
    try {
      await env.DB.prepare(sql).run();
      const name = sql.split(" ON ")[1] || sql;
      results.push("Index ready: " + name);
    } catch (e) {
      results.push("Index error: " + e.message);
    }
  }

  return Response.json({
    success: true,
    message: "Migration completed",
    results
  });
}