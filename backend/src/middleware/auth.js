import { verifyToken } from "../utils/jwt.js";


export async function authenticate(request, env) {

  const authHeader =
    request.headers.get("Authorization");


  if (!authHeader) {

    return {
      error: Response.json(
        {
          error: "Authorization header missing"
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
          error: "Invalid authorization format"
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
          error: "Invalid or expired token"
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
