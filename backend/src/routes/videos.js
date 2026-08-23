import { authenticate } from "../middleware/auth.js";
import StorageRouter from "../cloud/storage/router.js";
import { success, error } from "../utils/response.js";

export async function getVideos(request, env) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const user = (url.searchParams.get("user") || "").trim();

    let query = `
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
        users.id AS user_id,
        users.username,
        users.avatar
      FROM videos
      JOIN users ON videos.user_id = users.id
    `;
    const params = [];

    if (user) {
      query += ` WHERE users.username = ?`;
      params.push(user);
    }

    query += ` ORDER BY videos.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    const auth = await authenticate(request, env);
    let likedIds = [];
    let savedIds = [];

    if (!auth.error && auth.user) {
      const { results: likes } = await env.DB
        .prepare("SELECT video_id FROM video_likes WHERE user_id = ?")
        .bind(auth.user.id)
        .all();
      likedIds = likes.map(l => l.video_id);

      const { results: saves } = await env.DB
        .prepare("SELECT video_id FROM video_saves WHERE user_id = ?")
        .bind(auth.user.id)
        .all();
      savedIds = saves.map(s => s.video_id);
    }

    const videos = results.map(v => ({
      ...v,
      liked: likedIds.includes(v.id),
      saved: savedIds.includes(v.id)
    }));

    return success({ videos });
  } catch (err) {
    return error(err.message || "Failed to load videos", 500, "GET_VIDEOS_ERROR");
  }
}

export async function createVideo(request, env) {
  const auth = await authenticate(request, env);
  if (auth.error) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const caption = (form.get("caption") || "").toString().trim();
    const tags = form.get("tags") || "[]";
    const category = form.get("category") || "General";
    const thumbnail = form.get("thumbnail");

    // ========== Validation ==========
    if (!file) {
      return error("Video file is required", 400, "MISSING_FILE");
    }

    if (!file.type || !file.type.startsWith("video/")) {
      return error("Only video files are allowed", 400, "INVALID_FILE_TYPE");
    }

    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
      return error("Video is too large (maximum 100 MB)", 400, "FILE_TOO_LARGE");
    }

    // ========== Upload video ==========
    const uploadResult = await StorageRouter.upload(file, {
      role: "video",
      userId: auth.user.id,
      env
    });

    if (!uploadResult.success) {
      // Log failure for admin
      try {
        await env.DB.prepare(`
          INSERT INTO storage_events 
          (event_type, provider, filename, file_size, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          "upload",
          uploadResult.attempts
            ? uploadResult.attempts.map(a => a.provider).join(", ")
            : "unknown",
          file.name || "unknown",
          file.size || 0,
          "failed",
          JSON.stringify(uploadResult).slice(0, 900)
        ).run();
      } catch (e) {}

            return error(
        "Video upload failed",
        500,
        "UPLOAD_FAILED",
        uploadResult
      );
    }

    // ========== Thumbnail ==========
    let thumbnail_url = null;

if (thumbnail) {
  try {

    // Already a remote thumbnail URL
    if (
      typeof thumbnail === "string" &&
      thumbnail.startsWith("http")
    ) {

      thumbnail_url = thumbnail;

    }

    // Browser-generated canvas data URL
    else if (
      typeof thumbnail === "string" &&
      thumbnail.startsWith("data:image/")
    ) {

      const commaIndex = thumbnail.indexOf(",");

      if (commaIndex !== -1) {

        const header = thumbnail.substring(0, commaIndex);
        const base64Data = thumbnail.substring(commaIndex + 1);

        const mimeMatch =
          header.match(/^data:(image\/[^;]+);base64$/);

        if (mimeMatch) {

          const mimeType = mimeMatch[1];

          const binaryString =
            atob(base64Data);

          const bytes =
            new Uint8Array(binaryString.length);

          for (
            let i = 0;
            i < binaryString.length;
            i++
          ) {
            bytes[i] =
              binaryString.charCodeAt(i);
          }

          const thumbnailBlob =
            new Blob(
              [bytes],
              { type: mimeType }
            );

          const thumbResult =
            await StorageRouter.upload(
              thumbnailBlob,
              {
                role: "thumbnail",
                userId: auth.user.id,
                env
              }
            );

          if (thumbResult.success && thumbResult.url) {

  thumbnail_url = thumbResult.url;

} else {

  console.error(
    "THUMBNAIL STORAGE ERROR:",
    JSON.stringify(thumbResult)
  );

}

        }

      }

    }

    // File or Blob thumbnail
    else if (
      thumbnail instanceof File ||
      thumbnail instanceof Blob
    ) {

      const thumbResult =
        await StorageRouter.upload(
          thumbnail,
          {
            role: "thumbnail",
            userId: auth.user.id,
            env
          }
        );

      if (thumbResult.success && thumbResult.url) {

  thumbnail_url = thumbResult.url;

} else {

  console.error(
    "THUMBNAIL STORAGE ERROR:",
    JSON.stringify(thumbResult)
  );

}

    }

 } catch (e) {

  console.error(
    "THUMBNAIL UPLOAD EXCEPTION:",
    e?.message || e
  );

  // Thumbnail failure should not block video upload

}
}

    // ========== Save to database ==========
    const result = await env.DB.prepare(`
      INSERT INTO videos
        (user_id, video_url, thumbnail_url, caption, tags, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      auth.user.id,
      uploadResult.url,
      thumbnail_url,
      caption || "New video",
      tags,
      category
    ).run();

    // Log success for admin
    try {
      await env.DB.prepare(`
        INSERT INTO storage_events 
        (event_type, provider, filename, file_size, status)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        "upload",
        uploadResult.provider || "unknown",
        file.name || "unknown",
        file.size || 0,
        "success"
      ).run();
    } catch (e) {}

    return success({
      videoId: result.meta.last_row_id,
      videoUrl: uploadResult.url,
      thumbnailUrl: thumbnail_url,
      provider: uploadResult.provider
    }, "Video uploaded successfully");

  } catch (err) {
    return error(err.message || "Internal server error", 500, "SERVER_ERROR");
  }
}

export async function incrementViews(request, env, videoId) {
  try {
    await env.DB.prepare(
      "UPDATE videos SET views = views + 1 WHERE id = ?"
    ).bind(videoId).run();

    return success(null, "View counted");
  } catch (err) {
    return error(err.message || "Failed to update views", 500, "VIEW_ERROR");
  }
}