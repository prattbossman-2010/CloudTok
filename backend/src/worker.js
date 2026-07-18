import { signup } from "./routes/users.js";
import { login } from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";
import { getUserProfile } from "./routes/profile.js";
import { getVideos } from "./routes/videos.js";

export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;


    if (path === "/") {

      return new Response("CloudTok Backend is alive 🚀", {
        status: 200,
        headers: {
          "Content-Type": "text/plain"
        }
      });

    }


    if (path === "/api") {

      return Response.json({
        name: "CloudTok API",
        version: "1.0.0",
        status: "online"
      });

    }


    if (path === "/api/health") {

      return Response.json({
        status: "healthy",
        uptime: "running"
      });

    }


    if (path === "/api/version") {

      return Response.json({
        version: "1.0.0"
      });

    }


    if (path === "/api/users") {

      const { results } = await env.DB
        .prepare(
          "SELECT id, username, email, avatar, bio, created_at, updated_at FROM users"
        )
        .all();

      return Response.json({
        users: results
      });

    }


    if (
      request.method === "GET" &&
      path.startsWith("/api/users/") &&
      path !== "/api/users/signup" &&
      path !== "/api/users/login"
    ) {

      const userId = path.split("/")[3];

      return getUserProfile(request, env, userId);

    }


    if (path === "/api/users/signup" && request.method === "POST") {

      return signup(request, env);

    }


    if (path === "/api/users/login" && request.method === "POST") {

      return login(request, env);

    }

    if (path === "/api/me") {

          const auth =
            await authenticate(request, env);
        
        
          if (auth.error) {
        
            return auth.error;
        
          }
        
        
          return Response.json({
        
            authenticated: true,
        
            user: auth.user
        
          });
        
            }
        
        if (path === "/api/videos" && request.method === "GET") {
    
      return getVideos(request, env);
    
    }
    
    return new Response("404 - Endpoint Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  }
};