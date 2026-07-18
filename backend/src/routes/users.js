import { hashPassword } from "../utils/crypto.js";


export async function signup(request, env) {

  const body = await request.json();

  const {
    username,
    email,
    password
  } = body;


  if (!username || !email || !password) {

    return Response.json(
      {
        error: "Missing required fields"
      },
      {
        status: 400
      }
    );

  }


  const passwordHash = await hashPassword(password);


  const result = await env.DB
    .prepare(
      `
      INSERT INTO users
      (
        username,
        email,
        password_hash
      )
      VALUES (?, ?, ?)
      `
    )
    .bind(
      username,
      email,
      passwordHash
    )
    .run();


  return Response.json({
    success: true,
    userId: result.meta.last_row_id
  });

}
