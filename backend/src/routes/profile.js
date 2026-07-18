export async function getUserProfile(request, env, userId) {

  const { results } = await env.DB
    .prepare(
      `
      SELECT
        id,
        username,
        avatar,
        bio,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      `
    )
    .bind(userId)
    .all();

  if (results.length === 0) {

    return Response.json(
      {
        error: "User not found"
      },
      {
        status: 404
      }
    );

  }

  return Response.json(results[0]);

}
