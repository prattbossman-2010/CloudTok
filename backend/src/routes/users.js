import { hashPassword } from "../utils/crypto.js";


export async function signup(request, env) {

  try {

    const body = await request.json();

    const {
      displayName,
      username,
      email,
      password
    } = body;

    console.log({
  displayName,
  username,
  email
});

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
          display_name,
          username,
          email,
          password_hash
        )
        VALUES (?, ?, ?, ?)
        `
      )
      .bind(
          displayName,
          username,
          email,
          passwordHash
        )
      .run();


    return Response.json({
      success: true,
      userId: result.meta.last_row_id
    });


  } catch (error) {


    if (
      error.message.includes("UNIQUE constraint failed")
    ) {

      return Response.json(
        {
          error: "Username or email already exists"
        },
        {
          status: 409
        }
      );

    }


    return Response.json(
      {
        error: "Internal server error"
      },
      {
        status: 500
      }
    );


  }

}