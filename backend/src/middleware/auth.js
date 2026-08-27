import { verifyToken } from "../utils/jwt.js";

function authErrorResponse(status, message, code) {
  return new Response(
    JSON.stringify({ error: code, message }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

export async function authenticate(request, env) {

  const authHeader =
    request.headers.get("Authorization");


  if (!authHeader) {

    return {
      error: authErrorResponse(401, "Please log in to continue", "session_expired")
    };

  }


  const parts = authHeader.split(" ");


  if (parts.length !== 2 || parts[0] !== "Bearer") {

    return {
      error: authErrorResponse(401, "Your session is invalid. Please log out and log back in", "invalid_token")
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
      error: authErrorResponse(401, "Your session has expired. Please log out and log back in to continue", "invalid_token")
    };

  }


  return {
    user
  };

}
