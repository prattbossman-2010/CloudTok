export async function search(request, env){


  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();


  if(!query){
    return Response.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }


  const searchPattern = `%${query}%`;


  const { results: videos } =
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
    FROM videos
    JOIN users ON videos.user_id = users.id
    WHERE videos.caption LIKE ?
    ORDER BY videos.created_at DESC
    LIMIT 20
    `
  )
  .bind(searchPattern)
  .all();


  const { results: users } =
  await env.DB
  .prepare(
    `
    SELECT
      id,
      username,
      display_name,
      avatar,
      bio
    FROM users
    WHERE username LIKE ?
       OR display_name LIKE ?
    ORDER BY
      CASE
        WHEN username LIKE ? THEN 0
        ELSE 1
      END,
      username ASC
    LIMIT 20
    `
  )
  .bind(
    searchPattern,
    searchPattern,
    searchPattern
  )
  .all();


  return Response.json({
    videos,
    users
  });

}
