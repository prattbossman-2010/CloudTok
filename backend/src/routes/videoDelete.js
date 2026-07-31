import { authenticate } from "../middleware/auth.js";


export async function deleteVideo(request, env, videoId){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const video =
  await env.DB
  .prepare(
    `SELECT id, user_id FROM videos WHERE id = ?`
  )
  .bind(videoId)
  .first();


  if(!video){
    return Response.json(
      { error: "Video not found" },
      { status: 404 }
    );
  }


  if(video.user_id !== auth.user.id){
    return Response.json(
      { error: "Not authorized to delete this video" },
      { status: 403 }
    );
  }


  await env.DB
  .prepare(
    `DELETE FROM video_comments WHERE video_id = ?`
  )
  .bind(videoId)
  .run();


  await env.DB
  .prepare(
    `DELETE FROM video_likes WHERE video_id = ?`
  )
  .bind(videoId)
  .run();


  await env.DB
  .prepare(
    `DELETE FROM video_saves WHERE video_id = ?`
  )
  .bind(videoId)
  .run();


  await env.DB
  .prepare(
    `DELETE FROM videos WHERE id = ?`
  )
  .bind(videoId)
  .run();


  return Response.json({
    success: true
  });

}
