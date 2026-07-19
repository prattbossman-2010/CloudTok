import { hashPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";


export async function login(request, env) {

  const body = await request.json();


  const {
username,
displayName,
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
      SELECT
  id,
  username,
  email,
  display_name,
  avatar,
  bio,
  password_hash
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


  const passwordHash =
    await hashPassword(password);


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


  const token = await createToken(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    env.JWT_SECRET
  );


  return Response.json({

    success: true,

    token,

    user: {

      id: user.id,

      username: user.username,

      displayName:user.display_name,

      email: user.email,

      avatar: user.avatar,

      bio: user.bio

    }

  });

}