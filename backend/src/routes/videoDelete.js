import { authenticate } from "../middleware/auth.js";
import { success, error } from "../utils/response.js";
import StorageRouter from "../cloud/storage/router.js";

export async function deleteVideo(request, env, videoId) {

  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  try {
    // 1. Find the video
    const video = await env.DB.prepare(
      `SELECT id, user_id, video_url, thumbnail_url 
       FROM videos 
       WHERE id = ?`
    ).bind(videoId).first();

    if (!video) {
      return error("Video not found", 404, "VIDEO_NOT_FOUND");
    }

    // 2. Ownership check
    if (video.user_id !== auth.user.id && auth.user.role !== "admin") {
      return error("You are not allowed to delete this video", 403, "FORBIDDEN");
    }

    // 3. Try to delete the actual files from storage
    // (We do this best-effort – database cleanup still happens even if storage delete fails)
    let storageResult = { video: null, thumbnail: null };

    try {
      // Most providers still return "not implemented", but we call them for future support
      if (video.video_url) {
        // We pass the full URL for now. Later we can improve provider delete methods.
        storageResult.video = await StorageRouter.delete?.(video.video_url, env) 
          || { success: false, message: "Storage delete not fully implemented yet" };
      }

      if (video.thumbnail_url) {
        storageResult.thumbnail = await StorageRouter.delete?.(video.thumbnail_url, env)
          || { success: false, message: "Storage delete not fully implemented yet" };
      }
    } catch (e) {
      storageResult.error = e.message;
    }

    // 4. Delete related database records
    await env.DB.prepare(`DELETE FROM video_comments WHERE video_id = ?`).bind(videoId).run();
    await env.DB.prepare(`DELETE FROM video_likes WHERE video_id = ?`).bind(videoId).run();
    await env.DB.prepare(`DELETE FROM video_saves WHERE video_id = ?`).bind(videoId).run();
    await env.DB.prepare(`DELETE FROM videos WHERE id = ?`).bind(videoId).run();

    // 5. Log the deletion for admin
    try {
      await env.DB.prepare(`
        INSERT INTO storage_events 
        (event_type, provider, filename, status, error_message)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "delete",
        "system",
        video.video_url || String(videoId),
        "success",
        JSON.stringify(storageResult).slice(0, 800)
      ).run();
    } catch (e) {}

    return success({
      videoId: Number(videoId),
      storage: storageResult
    }, "Video deleted successfully");

  } catch (err) {
    return error(err.message || "Failed to delete video", 500, "DELETE_ERROR");
  }
}