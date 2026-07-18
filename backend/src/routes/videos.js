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
