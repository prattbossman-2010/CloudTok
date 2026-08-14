import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";

export async function getComments(request, env, videoId) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT
        video_comments.id,
        video_comments.comment,
        video_comments.created_at,
        users.username,
        users.avatar
      FROM video_comments
      JOIN users ON video_comments.user_id = users.id
      WHERE video_comments.video_id = ?
      ORDER BY video_comments.created_at ASC
    `).bind(videoId).all();

    return success({ comments: results });

  } catch (err) {
    return error(err.message || "Failed to load comments", 500, "GET_COMMENTS_ERROR");
  }
}

export async function addComment(request, env, videoId) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const comment = (body.comment || "").trim();

    if (!comment) {
      return error("Comment cannot be empty", 400, "EMPTY_COMMENT");
    }

    if (comment.length > 500) {
      return error("Comment is too long (max 500 characters)", 400, "COMMENT_TOO_LONG");
    }

    // Check video exists
    const video = await env.DB.prepare(
      `SELECT id FROM videos WHERE id = ?`
    ).bind(videoId).first();

    if (!video) {
      return error("Video not found", 404, "VIDEO_NOT_FOUND");
    }

    await env.DB.prepare(`
      INSERT INTO video_comments (video_id, user_id, comment)
      VALUES (?, ?, ?)
    `).bind(videoId, auth.user.id, comment).run();

    await env.DB.prepare(`
      UPDATE videos SET comments = comments + 1 WHERE id = ?
    `).bind(videoId).run();

    return success(null, "Comment added");

  } catch (err) {
    return error(err.message || "Failed to add comment", 500, "ADD_COMMENT_ERROR");
  }
}