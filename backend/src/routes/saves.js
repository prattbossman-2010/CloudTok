import { authenticate } from "../middleware/auth.js";

async function ensureSaveTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS video_likes (id INTEGER PRIMARY KEY, video_id INTEGER, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS video_saves (id INTEGER PRIMARY KEY, video_id INTEGER, user_id INTEGER, created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
}

export async function toggleSave(request, env, videoId){
    await ensureSaveTables(env);


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const userId = auth.user.id;


  const video =
  await env.DB
  .prepare(
    `SELECT id FROM videos WHERE id = ?`
  )
  .bind(videoId)
  .first();


  if(!video){
    return Response.json(
      { error: "Video not found" },
      { status: 404 }
    );
  }


  const existing =
  await env.DB
  .prepare(
    `SELECT id FROM video_saves WHERE video_id = ? AND user_id = ?`
  )
  .bind(videoId, userId)
  .first();


  if(existing){

    await env.DB
    .prepare(
      `DELETE FROM video_saves WHERE id = ?`
    )
    .bind(existing.id)
    .run();

    return Response.json({
      success: true,
      saved: false
    });

  }


  await env.DB
  .prepare(
    `INSERT INTO video_saves (video_id, user_id) VALUES (?, ?)`
  )
  .bind(videoId, userId)
  .run();


  return Response.json({
    success: true,
    saved: true
  });

}


export async function getSavedVideos(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const { results } =
  await env.DB
  .prepare(
    `
    SELECT
      videos.id,
      videos.video_url,
      videos.thumbnail_url,
      videos.caption,
      videos.views,
      videos.likes,
      videos.comments,
      videos.created_at,
      users.id AS user_id,
      users.username,
      users.avatar
    FROM video_saves
    JOIN videos ON video_saves.video_id = videos.id
    JOIN users ON videos.user_id = users.id
    WHERE video_saves.user_id = ?
    ORDER BY video_saves.created_at DESC
    `
  )
  .bind(auth.user.id)
  .all();


  return Response.json({
    videos: results
  });

}
