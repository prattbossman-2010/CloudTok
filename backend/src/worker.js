import StorageRouter from "./cloud/storage/router.js";
import { signup } from "./routes/users.js";
import { login } from "./routes/auth.js";
import { getComments, addComment } from "./routes/comments.js";
import { authenticate } from "./middleware/auth.js";
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  getUserVideos
} from "./routes/profile.js";
import { toggleLike } from "./routes/interactions.js";
import { getVideos, createVideo } from "./routes/videos.js";
import { followUser, getFollowers, getFollowing } from "./routes/follows.js";
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  clearNotifications
} from "./routes/notifications.js";
import {
  getConversations,
  getMessages,
  sendMessage
} from "./routes/messages.js";
import { search } from "./routes/search.js";
import { getTrending, getDiscoverVideos } from "./routes/discover.js";
import { toggleSave, getSavedVideos } from "./routes/saves.js";
import { deleteVideo } from "./routes/videoDelete.js";
import { handleCORS, withCORS } from "./middleware/cors.js";
import { adminLogin, adminGetStats, adminGetUsers, adminUpdateUser, adminDeleteVideo, adminGetVideos } from "./routes/admin.js";


export default {

  async fetch(request, env) {


    const corsResponse = handleCORS(request);

    if(corsResponse){
      return corsResponse;
    }


    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;


    if(path === "/"){
      return withCORS(
        new Response("CloudTok Backend is alive 🚀", {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        })
      );
    }


    if(path === "/api"){
      return withCORS(
        Response.json({
          name: "CloudTok API",
          version: "1.0.0",
          status: "online"
        })
      );
    }


    if(path === "/api/health"){
      return withCORS(
        Response.json({ status: "healthy", uptime: "running" })
      );
    }


    if(path === "/api/version"){
      return withCORS(Response.json({ version: "1.0.0" }));
    }


    if(path === "/api/users" && method === "GET"){
      const { results } = await env.DB
        .prepare(`SELECT id, username, email, avatar, bio, display_name, created_at, updated_at FROM users`)
        .all();
      return withCORS(Response.json({ users: results }));
    }


    if(path === "/api/users/signup" && method === "POST"){
      return withCORS(signup(request, env));
    }


    if(path === "/api/users/login" && method === "POST"){
      return withCORS(login(request, env));
    }


    if(path === "/api/me"){
      const auth = await authenticate(request, env);
      if(auth.error){
        return withCORS(auth.error);
      }
      return withCORS(Response.json({ authenticated: true, user: auth.user }));
    }


    if(
      path === "/api/users/search" &&
      method === "GET"
    ){
      return withCORS(search(request, env));
    }


    if(
      path === "/api/search" &&
      method === "GET"
    ){
      return withCORS(search(request, env));
    }


    if(
      path === "/api/videos/trending" &&
      method === "GET"
    ){
      return withCORS(getTrending(request, env));
    }


    if(
      path === "/api/discover" &&
      method === "GET"
    ){
      return withCORS(getDiscoverVideos(request, env));
    }


    if(
      path === "/api/videos/saved" &&
      method === "GET"
    ){
      return withCORS(getSavedVideos(request, env));
    }


    if(
      path === "/api/messages/conversations" &&
      method === "GET"
    ){
      return withCORS(getConversations(request, env));
    }


    if(
      path.startsWith("/api/messages/") &&
      method === "GET" &&
      path !== "/api/messages/conversations"
    ){
      const otherUsername = path.split("/")[3];
      return withCORS(getMessages(request, env, otherUsername));
    }


    if(
      path.startsWith("/api/messages/") &&
      method === "POST"
    ){
      const otherUsername = path.split("/")[3];
      return withCORS(sendMessage(request, env, otherUsername));
    }


    if(
      path === "/api/notifications" &&
      method === "GET"
    ){
      return withCORS(getNotifications(request, env));
    }


    if(
      path === "/api/notifications/read" &&
      method === "POST"
    ){
      return withCORS(markAllRead(request, env));
    }


    if(
      path === "/api/notifications" &&
      method === "DELETE"
    ){
      return withCORS(clearNotifications(request, env));
    }


    if(
      path.match(/^\/api\/notifications\/\d+\/read$/) &&
      method === "POST"
    ){
      const id = parseInt(path.split("/")[3], 10);
      return withCORS(markNotificationRead(request, env, id));
    }


    if(
      path === "/api/videos" &&
      method === "GET"
    ){
      return withCORS(getVideos(request, env));
    }


    if(
      path === "/api/videos" &&
      method === "POST"
    ){
      return withCORS(createVideo(request, env));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/like$/) &&
      method === "POST"
    ){
      const videoId = path.split("/")[3];
      return withCORS(toggleLike(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/comments$/) &&
      method === "GET"
    ){
      const videoId = path.split("/")[3];
      return withCORS(getComments(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/comments$/) &&
      method === "POST"
    ){
      const videoId = path.split("/")[3];
      return withCORS(addComment(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/save$/) &&
      method === "POST"
    ){
      const videoId = parseInt(path.split("/")[3], 10);
      return withCORS(toggleSave(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+$/) &&
      method === "DELETE"
    ){
      const videoId = path.split("/")[3];
      return withCORS(deleteVideo(request, env, videoId));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/videos$/) &&
      method === "GET" &&
      path !== "/api/users/signup" &&
      path !== "/api/users/login" &&
      !path.endsWith("/followers") &&
      !path.endsWith("/following")
    ){
      const username = path.split("/")[3];
      return withCORS(getUserVideos(request, env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/followers$/) &&
      method === "GET"
    ){
      const username = path.split("/")[3];
      return withCORS(getFollowers(env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/following$/) &&
      method === "GET"
    ){
      const username = path.split("/")[3];
      return withCORS(getFollowing(env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/follow$/) &&
      method === "POST"
    ){
      const username = path.split("/")[3];
      return withCORS(followUser(request, env, username));
    }


    if(
      path === "/api/users/profile" &&
      method === "PUT"
    ){
      return withCORS(updateProfile(request, env));
    }


    if(
      path === "/api/users/avatar" &&
      method === "POST"
    ){
      return withCORS(updateAvatar(request, env));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+$/) &&
      method === "GET" &&
      path !== "/api/users/signup" &&
      path !== "/api/users/login"
    ){
      const username = path.split("/")[3];
      return withCORS(getUserProfile(request, env, username));
    }


    if(path === "/api/storage/health"){
      const result = await StorageRouter.healthCheck(env);
      return withCORS(Response.json(result));
    }

    // Admin routes
    if(path === "/api/admin/login" && method === "POST"){
      return withCORS(adminLogin(request, env));
    }

    if(path === "/api/admin/stats" && method === "GET"){
      return withCORS(adminGetStats(request, env));
    }

    if(path === "/api/admin/users" && method === "GET"){
      return withCORS(adminGetUsers(request, env));
    }

    if(path.match(/^\/api\/admin\/users\/\d+$/) && method === "PUT"){
      const userId = path.split("/")[4];
      return withCORS(adminUpdateUser(request, env, userId));
    }

    if(path === "/api/admin/videos" && method === "GET"){
      return withCORS(adminGetVideos(request, env));
    }

    if(path.match(/^\/api\/admin\/videos\/\d+$/) && method === "DELETE"){
      const videoId = path.split("/")[4];
      return withCORS(adminDeleteVideo(request, env, videoId));
    }


    return withCORS(
      new Response("404 - Endpoint Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      })
    );

  }

};
