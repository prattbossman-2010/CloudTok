import { signup } from "./routes/users.js";

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


    if (path === "/api/users/signup" && request.method === "POST") {

      return signup(request, env);

    }


    return new Response("404 - Endpoint Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  }
};