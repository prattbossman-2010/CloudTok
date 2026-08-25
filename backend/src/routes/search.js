export async function search(request, env){


  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");


  if(!query){
    return Response.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }


  const searchPattern = `%${query}%`;
  const startsPattern = `${query}%`;
  const exactQuery = query;


  const { results: videos } =
  await env.DB
  .prepare(
    `
    SELECT
      videos.id,
      videos.video_url,
      videos.thumbnail_url,
      videos.caption,
      videos.tags,
      videos.category,
      videos.views,
      videos.likes,
      videos.comments,
      videos.created_at,
      users.id AS user_id,
      users.username,
      users.avatar,
      (
        CASE WHEN LOWER(videos.caption) = LOWER(?) THEN 50
             WHEN LOWER(videos.caption) LIKE LOWER(?) THEN 30
             WHEN LOWER(videos.caption) LIKE LOWER(?) THEN 15
             WHEN LOWER(videos.caption) LIKE LOWER(?) THEN 5
             ELSE 0 END
        +
        CASE WHEN LOWER(videos.tags) LIKE LOWER(?) THEN 20
             WHEN LOWER(videos.tags) LIKE LOWER(?) THEN 8
             ELSE 0 END
        +
        CASE WHEN LOWER(videos.category) = LOWER(?) THEN 15
             WHEN LOWER(videos.category) LIKE LOWER(?) THEN 5
             ELSE 0 END
        +
        (videos.likes * 10 + videos.comments * 8 + videos.views * 2)
      ) AS relevance
    FROM videos
    JOIN users ON videos.user_id = users.id
    WHERE videos.caption LIKE ?
       OR videos.tags LIKE ?
       OR videos.category LIKE ?
       OR users.username LIKE ?
       OR users.display_name LIKE ?
    ORDER BY relevance DESC, videos.created_at DESC
    LIMIT ? OFFSET ?
    `
  )
  .bind(
    exactQuery, startsPattern, searchPattern, `%${query}%`,
    searchPattern, `%${query}%`,
    exactQuery, `%${query}%`,
    searchPattern, searchPattern, searchPattern,
    searchPattern, searchPattern,
    limit, offset
  )
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


export async function getHashtagVideos(request, env, hashtag){

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const tagPattern = `%#${hashtag}%`;
  const tagPatternAlt = `%${hashtag}%`;

  const { results: videos } =
  await env.DB
  .prepare(
    `
    SELECT
      videos.id,
      videos.video_url,
      videos.thumbnail_url,
      videos.caption,
      videos.tags,
      videos.category,
      videos.views,
      videos.likes,
      videos.comments,
      videos.created_at,
      users.id AS user_id,
      users.username,
      users.display_name,
      users.avatar
    FROM videos
    JOIN users ON videos.user_id = users.id
    WHERE LOWER(videos.tags) LIKE LOWER(?)
       OR LOWER(videos.caption) LIKE LOWER(?)
    ORDER BY videos.created_at DESC
    LIMIT ? OFFSET ?
    `
  )
  .bind(
    tagPattern,
    tagPatternAlt,
    limit,
    offset
  )
  .all();

  const countResult = await env.DB
  .prepare(
    `SELECT COUNT(*) AS count FROM videos
     WHERE LOWER(tags) LIKE LOWER(?) OR LOWER(caption) LIKE LOWER(?)`
  )
  .bind(tagPattern, tagPatternAlt)
  .first();

  return Response.json({
    hashtag: hashtag,
    count: countResult ? countResult.count : 0,
    videos
  });

}
