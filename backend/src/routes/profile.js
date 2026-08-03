import { authenticate } from "../middleware/auth.js";
import StorageRouter from "../cloud/storage/router.js";


export async function getUserProfile(request, env, username){


  const { results } = await env.DB
    .prepare(
      `
      SELECT
        id,
        username,
        email,
        display_name,
        avatar,
        bio,
        website,
        role,
        status,
        created_at,
        updated_at
      FROM users
      WHERE username = ?
      `
    )
    .bind(username)
    .all();


  if(results.length === 0){
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }


  const user = results[0];


  const followersCount =
  await env.DB
  .prepare(
    `SELECT COUNT(*) AS count FROM follows WHERE following_id = ?`
  )
  .bind(user.id)
  .first();


  const followingCount =
  await env.DB
  .prepare(
    `SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?`
  )
  .bind(user.id)
  .first();


  const videosCount =
  await env.DB
  .prepare(
    `SELECT COUNT(*) AS count FROM videos WHERE user_id = ?`
  )
  .bind(user.id)
  .first();


  return Response.json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar,
    bio: user.bio,
    website: user.website,
    role: user.role || "user",
    followersCount: followersCount.count,
    followingCount: followingCount.count,
    videosCount: videosCount.count,
    created_at: user.created_at,
    updated_at: user.updated_at
  });

}


export async function updateProfile(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const body = await request.json();
  const { displayName, bio, website } = body;


  await env.DB
  .prepare(
    `
    UPDATE users
    SET display_name = ?, bio = ?, website = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
  .bind(
    displayName || "",
    bio || "",
    website || "",
    auth.user.id
  )
  .run();


  const updated =
  await env.DB
  .prepare(
    `SELECT username FROM users WHERE id = ?`
  )
  .bind(auth.user.id)
  .first();


  return Response.json({
    success: true,
    username: updated.username
  });

}


export async function updateAvatar(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const form = await request.formData();
  const file = form.get("avatar");


  if(!file){
    return Response.json(
      { error: "Avatar file required" },
      { status: 400 }
    );
  }


  const uploadResult =
  await StorageRouter.upload(
    file,
    {
      role: "avatar",
      userId: auth.user.id,
      env
    }
  );


  if(!uploadResult.success){
    return Response.json(
      { error: "Avatar upload failed", details: uploadResult },
      { status: 500 }
    );
  }


  await env.DB
  .prepare(
    `UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  )
  .bind(uploadResult.url, auth.user.id)
  .run();


  return Response.json({
    success: true,
    avatar: uploadResult.url
  });

}


export async function getUserVideos(request, env, username){


  const user =
  await env.DB
  .prepare(
    `SELECT id FROM users WHERE username = ?`
  )
  .bind(username)
  .first();


  if(!user){
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
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
      videos.tags,
      videos.category,
      videos.created_at,
      users.id AS user_id,
      users.username,
      users.avatar
    FROM videos
    JOIN users ON videos.user_id = users.id
    WHERE videos.user_id = ?
    ORDER BY videos.created_at DESC
    `
  )
  .bind(user.id)
  .all();

  const auth = await authenticate(request, env);
  let likedIds = [];
  let savedIds = [];
  if(!auth.error && auth.user){
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

  return Response.json({
    videos
  });

}
