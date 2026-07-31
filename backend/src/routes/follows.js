import { authenticate } from "../middleware/auth.js";


export async function followUser(request, env, targetUsername){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const followerId = auth.user.id;


  const target =
  await env.DB
  .prepare(
    `SELECT id, username FROM users WHERE username = ?`
  )
  .bind(targetUsername)
  .first();


  if(!target){
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }


  if(followerId === target.id){
    return Response.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }


  const existing =
  await env.DB
  .prepare(
    `SELECT id FROM follows WHERE follower_id = ? AND following_id = ?`
  )
  .bind(followerId, target.id)
  .first();


  if(existing){

    await env.DB
    .prepare(
      `DELETE FROM follows WHERE id = ?`
    )
    .bind(existing.id)
    .run();

    return Response.json({
      success: true,
      following: false
    });

  }


  await env.DB
  .prepare(
    `INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`
  )
  .bind(followerId, target.id)
  .run();


  await env.DB
  .prepare(
    `INSERT INTO notifications (user_id, from_user_id, type, message, reference_type)
     VALUES (?, ?, 'follow', ?, 'user')`
  )
  .bind(
    target.id,
    followerId,
    `${auth.user.username} started following you`
  )
  .run();


  return Response.json({
    success: true,
    following: true
  });

}


export async function getFollowers(env, username){


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
      users.id,
      users.username,
      users.display_name,
      users.avatar,
      users.bio
    FROM follows
    JOIN users ON follows.follower_id = users.id
    WHERE follows.following_id = ?
    ORDER BY follows.created_at DESC
    `
  )
  .bind(user.id)
  .all();


  return Response.json({
    followers: results
  });

}


export async function getFollowing(env, username){


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
      users.id,
      users.username,
      users.display_name,
      users.avatar,
      users.bio
    FROM follows
    JOIN users ON follows.following_id = users.id
    WHERE follows.follower_id = ?
    ORDER BY follows.created_at DESC
    `
  )
  .bind(user.id)
  .all();


  return Response.json({
    following: results
  });

}


export async function getFollowState(env, targetUsername, currentUsername){


  const target =
  await env.DB
  .prepare(
    `SELECT id FROM users WHERE username = ?`
  )
  .bind(targetUsername)
  .first();


  const current =
  await env.DB
  .prepare(
    `SELECT id FROM users WHERE username = ?`
  )
  .bind(currentUsername)
  .first();


  if(!target || !current){
    return Response.json(
      { following: false }
    );
  }


  const exists =
  await env.DB
  .prepare(
    `SELECT id FROM follows WHERE follower_id = ? AND following_id = ?`
  )
  .bind(current.id, target.id)
  .first();


  return Response.json({
    following: Boolean(exists)
  });

}
