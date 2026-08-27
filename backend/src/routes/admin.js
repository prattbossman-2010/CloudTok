import { authenticate } from "../middleware/auth.js";
import { verifyPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";

export async function adminLogin(request, env) {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { results } = await env.DB.prepare(`
        SELECT id, username, email, display_name, avatar, role, password_hash
        FROM users WHERE email = ?
    `).bind(email).all();

    if (results.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const user = results[0];
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    const token = await createToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    }, env.JWT_SECRET);

    return new Response(JSON.stringify({
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
    }), { headers: { "Content-Type": "application/json" } });
}

export async function adminCheck(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    if (auth.user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json" } });
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

    return new Response(JSON.stringify({
        users: users.count,
        videos: videos.count,
        likes: likes.count,
        comments: comments.count,
        follows: follows.count
    }), { headers: { "Content-Type": "application/json" } });
}

export async function adminGetUsers(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const { results } = await env.DB.prepare(`
        SELECT id, username, display_name, email, avatar, bio, role, status, wallet_balance, created_at
        FROM users ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({ users: results }), { headers: { "Content-Type": "application/json" } });
}

export async function adminDeleteUser(request, env, userId) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const uid = parseInt(userId);
    if (!uid) return new Response(JSON.stringify({ error: "Invalid user ID" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const user = await env.DB.prepare("SELECT id, username, role FROM users WHERE id = ?").bind(uid).first();
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    if (user.role === "admin") return new Response(JSON.stringify({ error: "Cannot delete admin accounts" }), { status: 400, headers: { "Content-Type": "application/json" } });

    const tables = [
        "video_likes", "video_saves", "video_comments",
        "notifications", "messages", "conversations",
        "follows", "content_reports", "live_chat",
        "gift_transactions", "transactions"
    ];
    for (const t of tables) {
        try { await env.DB.prepare(`DELETE FROM ${t} WHERE user_id = ?`).bind(uid).run(); } catch(e) {}
        try { await env.DB.prepare(`DELETE FROM ${t} WHERE sender_id = ?`).bind(uid).run(); } catch(e) {}
        try { await env.DB.prepare(`DELETE FROM ${t} WHERE receiver_id = ?`).bind(uid).run(); } catch(e) {}
    }
    try { await env.DB.prepare("DELETE FROM videos WHERE user_id = ?").bind(uid).run(); } catch(e) {}
    try { await env.DB.prepare("DELETE FROM live_streams WHERE user_id = ?").bind(uid).run(); } catch(e) {}
    try { await env.DB.prepare("DELETE FROM user_blocks WHERE blocker_id = ? OR blocked_id = ?").bind(uid, uid).run(); } catch(e) {}

    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(uid).run();
    return new Response(JSON.stringify({ success: true, message: "User deleted" }), { headers: { "Content-Type": "application/json" } });
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

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
}

export async function adminDeleteVideo(request, env, videoId) {
  const auth = await adminCheck(request, env);
  if (auth.error) return auth;

  try {
    // Get the video first so we can delete the actual files
    const video = await env.DB.prepare(
      `SELECT id, video_url, thumbnail_url FROM videos WHERE id = ?`
    ).bind(videoId).first();

    if (!video) {
      return new Response(JSON.stringify({ success: false, error: "Video not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    // Try to delete from storage (best effort)
    let storageResult = {};
    try {
      const StorageRouter = (await import("../cloud/storage/router.js")).default;

      if (video.video_url) {
        storageResult.video = await StorageRouter.delete(video.video_url, env);
      }
      if (video.thumbnail_url) {
        storageResult.thumbnail = await StorageRouter.delete(video.thumbnail_url, env);
      }
    } catch (e) {
      storageResult.error = e.message;
    }

    // Clean database
    await env.DB.prepare("DELETE FROM video_likes WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_comments WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_saves WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();

    // Log it
    try {
      await env.DB.prepare(`
        INSERT INTO storage_events (event_type, provider, filename, status, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "admin_delete",
        "system",
        video.video_url || String(videoId),
        "success",
        JSON.stringify(storageResult).slice(0, 800)
      ).run();
    } catch (e) {}

    return new Response(JSON.stringify({
      success: true,
      message: "Video deleted by admin",
      storage: storageResult
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message || "Failed to delete video"
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
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

    return new Response(JSON.stringify({ videos: results }), { headers: { "Content-Type": "application/json" } });
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

  return new Response(JSON.stringify({
    success: true,
    message: "Migration completed",
    results
  }), { headers: { "Content-Type": "application/json" } });
}