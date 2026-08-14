import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";

async function ensureLikeTables(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS video_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        user_id INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `).run();
  } catch (e) {}
}

export async function toggleLike(request, env, videoId) {
  await ensureLikeTables(env);

  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  try {
    const userId = auth.user.id;

    // Check video exists
    const video = await env.DB.prepare(
      `SELECT id, likes FROM videos WHERE id = ?`
    ).bind(videoId).first();

    if (!video) {
      return error("Video not found", 404, "VIDEO_NOT_FOUND");
    }

    const existing = await env.DB.prepare(`
      SELECT id FROM video_likes
      WHERE video_id = ? AND user_id = ?
    `).bind(videoId, userId).first();

    if (existing) {
      // Unlike
      await env.DB.prepare(`DELETE FROM video_likes WHERE id = ?`)
        .bind(existing.id).run();

      await env.DB.prepare(`
        UPDATE videos SET likes = MAX(likes - 1, 0) WHERE id = ?
      `).bind(videoId).run();

      return success({ liked: false, likes: Math.max((video.likes || 1) - 1, 0) });
    }

    // Like
    await env.DB.prepare(`
      INSERT INTO video_likes (video_id, user_id) VALUES (?, ?)
    `).bind(videoId, userId).run();

    await env.DB.prepare(`
      UPDATE videos SET likes = likes + 1 WHERE id = ?
    `).bind(videoId).run();

    return success({ liked: true, likes: (video.likes || 0) + 1 });

  } catch (err) {
    return error(err.message || "Failed to toggle like", 500, "LIKE_ERROR");
  }
}

export async function getLikedVideos(request, env) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  try {
    const { results } = await env.DB.prepare(`
      SELECT
        videos.id,
        videos.video_url,
        videos.thumbnail_url,
        videos.caption,
        videos.views,
        videos.likes,
        videos.comments,
        videos.tags,
        videos.category,
        videos.created_at,
        users.username,
        users.avatar
      FROM video_likes
      JOIN videos ON video_likes.video_id = videos.id
      JOIN users ON videos.user_id = users.id
      WHERE video_likes.user_id = ?
      ORDER BY video_likes.id DESC
    `).bind(auth.user.id).all();

    const videos = results.map(v => ({
      ...v,
      liked: true,
      saved: false
    }));

    return success({ videos });

  } catch (err) {
    return error(err.message || "Failed to load liked videos", 500, "LIKED_VIDEOS_ERROR");
  }
}