export async function getUserProfile(request, env, username) {

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
      {
        error:"User not found"
      },
      {
        status:404
      }
    );

  }


  const user = results[0];

return Response.json({

  id: user.id,

  username: user.username,

  email: user.email,

  displayName: user.display_name,

  avatar: user.avatar,

  bio: user.bio,

  created_at: user.created_at,

  updated_at: user.updated_at

});

}