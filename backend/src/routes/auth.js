import { hashPassword } from "../utils/crypto.js";


export async function login(request, env) {

  const body = await request.json();

  const {
    email,
    password
  } = body;


  if (!email || !password) {

    return Response.json(
      {
        error: "Email and password required"
      },
      {
        status: 400
      }
    );

  }


  const { results } = await env.DB
    .prepare(
      `
      SELECT id, username, email, avatar, bio, password_hash
      FROM users
      WHERE email = ?
      `
    )
    .bind(email)
    .all();


  if (results.length === 0) {

    return Response.json(
      {
        error: "Invalid email or password"
      },
      {
        status: 401
      }
    );

  }


  const user = results[0];


  const passwordHash = await hashPassword(password);


  if (passwordHash !== user.password_hash) {

    return Response.json(
      {
        error: "Invalid email or password"
      },
      {
        status: 401
      }
    );

  }


  return Response.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    }
  });

}
