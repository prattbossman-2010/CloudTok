import { verifyToken } from "../utils/jwt.js";


export async function authenticate(request, env) {

  const authHeader =
    request.headers.get("Authorization");


  if (!authHeader) {

    return {
      error: Response.json(
        {
          error: "session_expired",
          message: "Please log in to continue"
        },
        {
          status: 401
        }
      )
    };

  }


  const parts = authHeader.split(" ");


  if (parts.length !== 2 || parts[0] !== "Bearer") {

    return {
      error: Response.json(
        {
          error: "invalid_token",
          message: "Your session is invalid. Please log out and log back in"
        },
        {
          status: 401
        }
      )
    };

  }


  const token = parts[1];


  const user =
    await verifyToken(
      token,
      env.JWT_SECRET
    );


  if (!user) {

    return {
      error: Response.json(
        {
          error: "invalid_token",
          message: "Your session has expired. Please log out and log back in to continue"
        },
        {
          status: 401
        }
      )
    };

  }


  return {
    user
  };

}
