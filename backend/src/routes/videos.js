import { authenticate } from "../middleware/auth.js";


export async function getVideos(request, env) {

  const { results } = await env.DB
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

      FROM videos

      JOIN users
      ON videos.user_id = users.id

      ORDER BY videos.created_at DESC
      `
    )
    .all();


  return Response.json({
    videos: results
  });

}



export async function createVideo(request, env) {


  const auth =
    await authenticate(request, env);


  if (auth.error) {

    return auth.error;

  }


  const body =
    await request.json();


  const {
    video_url,
    thumbnail_url,
    caption
  } = body;


  if (!video_url) {

    return Response.json(
      {
        error: "Video URL required"
      },
      {
        status: 400
      }
    );

  }


  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO videos
        (
          user_id,
          video_url,
          thumbnail_url,
          caption
        )

        VALUES (?, ?, ?, ?)
        `
      )
      .bind(
        auth.user.id,
        video_url,
        thumbnail_url || null,
        caption || ""
      )
      .run();



  return Response.json({

    success: true,

    videoId: result.meta.last_row_id

  });


}