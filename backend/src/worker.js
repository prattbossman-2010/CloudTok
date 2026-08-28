import StorageRouter from "./cloud/storage/router.js";
import { signup } from "./routes/users.js";
import { login } from "./routes/auth.js";
import { getComments, addComment } from "./routes/comments.js";
import { authenticate } from "./middleware/auth.js";
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  getUserVideos,
  getCreatorAnalytics
} from "./routes/profile.js";
import { toggleLike, getLikedVideos } from "./routes/interactions.js";
import { getVideos, createVideo, incrementViews, downloadVideo } from "./routes/videos.js";
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
  sendMessage,
  deleteMessage,
  archiveMessage,
  lockMessage,
  bulkDeleteMessages,
  bulkArchiveMessages,
  bulkLockMessages,
  deleteConversation,
  deleteConversations
} from "./routes/messages.js";
import { search, getHashtagVideos } from "./routes/search.js";
import { getTrending, getDiscoverVideos } from "./routes/discover.js";
import { toggleSave, getSavedVideos } from "./routes/saves.js";
import { deleteVideo } from "./routes/videoDelete.js";
import { handleCORS, withCORS, getAllowedOriginForRequest } from "./middleware/cors.js";
import { adminLogin, adminGetStats, adminGetUsers, adminUpdateUser, adminDeleteUser, adminDeleteVideo, adminGetVideos, adminRunMigration } from "./routes/admin.js";
import { initializePayment, verifyPayment, getTransactions, getPaystackConfig } from "./routes/payments.js";
import { sendSignal, pollSignals, createLiveStream, getLiveStreams, endLiveStream, sendLiveChat, getLiveChat } from "./routes/webrtc.js";


import { sendGift, getGiftHistory, getWalletBalance } from "./routes/gifts.js";
import { adminGetLiveStreams, adminStopStream, adminGetTransactions, adminGetGifts, adminGetMessages, adminGetReports, adminUpdateReport, adminGetActivityLogs, adminGetStorageHealth, adminDeleteComment, adminGetComments, adminAdjustBalance, adminUpdateGiftPrice, adminGetGiftConfig, adminClearTable } from "./routes/adminExtended.js";

import {
  testSupabaseUpload,
  listSupabaseVideos
} from "./routes/supabaseTest.js";

import { blockUser, getBlockedUsers } from "./routes/blocks.js";
import { reportVideo, reportUser } from "./routes/reports.js";
import { forgotPassword, verifyResetCode, resetPassword } from "./routes/passwordReset.js";
import { authRateLimit, apiRateLimit } from "./middleware/rateLimit.js";
import { generateOGImage } from "./routes/ogImage.js";

export default {

  async fetch(request, env) {


    const corsResponse = handleCORS(request);

    if(corsResponse){
      return corsResponse;
    }

    try{

    const cors = (responseOrPromise) => withCORS(responseOrPromise, request);

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if(path === "/api/og" && method === "GET"){
      return generateOGImage(request, env);
    }

    if(path === "/"){
      return cors(
        new Response("CloudTok Backend is alive 🚀", {
          status: 200,
          headers: { "Content-Type": "text/plain" }
        })
      );
    }


    if(path === "/api"){
      return cors(
        Response.json({
          name: "CloudTok API",
          version: "1.0.0",
          status: "online"
        })
      );
    }


    if(path === "/api/health"){
      return cors(
        Response.json({ status: "healthy", uptime: "running" })
      );
    }


    if(path === "/api/version"){
      return cors(Response.json({ version: "1.0.0" }));
    }


    if(path === "/api/users" && method === "GET"){
      const { results } = await env.DB
        .prepare(`SELECT id, username, email, avatar, bio, display_name, created_at, updated_at FROM users`)
        .all();
      return cors(Response.json({ users: results }));
    }


    if(path === "/api/users/signup" && method === "POST"){
      return cors(signup(request, env));
    }


    if(path === "/api/users/login" && method === "POST"){
      return cors(login(request, env));
    }

    if(path === "/api/auth/forgot-password" && method === "POST"){
      const rateLimitResponse = authRateLimit(request);
      if (rateLimitResponse) return cors(rateLimitResponse);
      return cors(forgotPassword(request, env));
    }

    if(path === "/api/auth/verify-code" && method === "POST"){
      return cors(verifyResetCode(request, env));
    }

    if(path === "/api/auth/reset-password" && method === "POST"){
      const rateLimitResponse = authRateLimit(request);
      if (rateLimitResponse) return cors(rateLimitResponse);
      return cors(resetPassword(request, env));
    }


    if(path === "/api/me"){
      const auth = await authenticate(request, env);
      if(auth.error){
        return cors(auth.error);
      }
      return cors(Response.json({ authenticated: true, user: auth.user }));
    }


    if(
      path === "/api/users/search" &&
      method === "GET"
    ){
      return cors(search(request, env));
    }


    if(
      path === "/api/search" &&
      method === "GET"
    ){
      return cors(search(request, env));
    }

    if(path.match(/^\/api\/hashtag\/[^\/]+$/) && method === "GET"){
      const tag = path.split("/")[3];
      return cors(getHashtagVideos(request, env, decodeURIComponent(tag)));
    }


    if(
      path === "/api/videos/trending" &&
      method === "GET"
    ){
      return cors(getTrending(request, env));
    }


    if(
      path === "/api/discover" &&
      method === "GET"
    ){
      return cors(getDiscoverVideos(request, env));
    }


    if(
      path === "/api/videos/saved" &&
      method === "GET"
    ){
      return cors(getSavedVideos(request, env));
    }


    if(
      path === "/api/videos/liked" &&
      method === "GET"
    ){
      return cors(getLikedVideos(request, env));
    }


    if(
      path === "/api/messages/conversations" &&
      method === "GET"
    ){
      return cors(getConversations(request, env));
    }

    if(path === "/api/messages/bulk-delete" && method === "POST"){
      return cors(bulkDeleteMessages(request, env));
    }
    if(path === "/api/messages/bulk-archive" && method === "POST"){
      return cors(bulkArchiveMessages(request, env));
    }
    if(path === "/api/messages/bulk-lock" && method === "POST"){
      return cors(bulkLockMessages(request, env));
    }
    if(path === "/api/messages/delete-conversations" && method === "POST"){
      return cors(deleteConversations(request, env));
    }

    const convMatch = path.match(/^\/api\/conversations\/(\d+)$/);
    if(convMatch && method === "DELETE"){
      return cors(deleteConversation(request, env, parseInt(convMatch[1], 10)));
    }

    const msgMatch = path.match(/^\/api\/messages\/(\d+)(\/archive|\/lock)?$/);
    if(msgMatch && method === "DELETE"){
      return cors(deleteMessage(request, env, msgMatch[1]));
    }
    if(msgMatch && msgMatch[2] === "/archive" && method === "POST"){
      return cors(archiveMessage(request, env, msgMatch[1]));
    }
    if(msgMatch && msgMatch[2] === "/lock" && method === "POST"){
      return cors(lockMessage(request, env, msgMatch[1]));
    }

    if(
      path.startsWith("/api/messages/") &&
      method === "GET" &&
      path !== "/api/messages/conversations"
    ){
      const otherUsername = path.split("/")[3];
      return cors(getMessages(request, env, otherUsername));
    }


    if(
      path.startsWith("/api/messages/") &&
      method === "POST"
    ){
      const otherUsername = path.split("/")[3];
      return cors(sendMessage(request, env, otherUsername));
    }


    if(
      path === "/api/notifications" &&
      method === "GET"
    ){
      return cors(getNotifications(request, env));
    }


    if(
      path === "/api/notifications/read" &&
      method === "POST"
    ){
      return cors(markAllRead(request, env));
    }


    if(
      path === "/api/notifications" &&
      method === "DELETE"
    ){
      return cors(clearNotifications(request, env));
    }


    if(
      path.match(/^\/api\/notifications\/\d+\/read$/) &&
      method === "POST"
    ){
      const id = parseInt(path.split("/")[3], 10);
      return cors(markNotificationRead(request, env, id));
    }


    if(
      path === "/api/videos" &&
      method === "GET"
    ){
      return cors(getVideos(request, env));
    }


    if(
      path === "/api/videos" &&
      method === "POST"
    ){
      return cors(createVideo(request, env));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/like$/) &&
      method === "POST"
    ){
      const videoId = path.split("/")[3];
      return cors(toggleLike(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/view$/) &&
      method === "POST"
    ){
      const videoId = path.split("/")[3];
      return cors(incrementViews(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/comments$/) &&
      method === "GET"
    ){
      const videoId = path.split("/")[3];
      return cors(getComments(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/comments$/) &&
      method === "POST"
    ){
      const videoId = path.split("/")[3];
      return cors(addComment(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+\/save$/) &&
      method === "POST"
    ){
      const videoId = parseInt(path.split("/")[3], 10);
      return cors(toggleSave(request, env, videoId));
    }


    if(
      path.match(/^\/api\/videos\/\d+$/) &&
      method === "DELETE"
    ){
      const videoId = path.split("/")[3];
      return cors(deleteVideo(request, env, videoId));
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
      return cors(getUserVideos(request, env, username));
    }

    if(
      path.match(/^\/api\/users\/[^\/]+\/analytics$/) &&
      method === "GET"
    ){
      const username = path.split("/")[3];
      return cors(getCreatorAnalytics(request, env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/followers$/) &&
      method === "GET"
    ){
      const username = path.split("/")[3];
      return cors(getFollowers(env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/following$/) &&
      method === "GET"
    ){
      const username = path.split("/")[3];
      return cors(getFollowing(env, username));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+\/follow$/) &&
      method === "POST"
    ){
      const username = path.split("/")[3];
      return cors(followUser(request, env, username));
    }


    if(
      path === "/api/users/profile" &&
      method === "PUT"
    ){
      return cors(updateProfile(request, env));
    }


    if(
      path === "/api/users/avatar" &&
      method === "POST"
    ){
      return cors(updateAvatar(request, env));
    }


    if(
      path.match(/^\/api\/users\/[^\/]+$/) &&
      method === "GET" &&
      path !== "/api/users/signup" &&
      path !== "/api/users/login"
    ){
      const username = path.split("/")[3];
      return cors(getUserProfile(request, env, username));
    }


    if(path === "/api/storage/health"){
      const result = await StorageRouter.healthCheck(env);
      return cors(Response.json(result));
    }
      
      if(
path === "/api/storage/test/supabase-upload" &&
method === "POST"
){
return cors(
testSupabaseUpload(request, env)
);
}

      if(
  path === "/api/storage/test/supabase-videos" &&
  method === "GET"
){
  return cors(
    listSupabaseVideos(request, env)
  );
}
      
    // Admin routes
    if(path === "/api/admin/login" && method === "POST"){
      return cors(adminLogin(request, env));
    }

    if(path === "/api/admin/stats" && method === "GET"){
      return cors(adminGetStats(request, env));
    }

    if(path === "/api/admin/users" && method === "GET"){
      return cors(adminGetUsers(request, env));
    }

    if(path.match(/^\/api\/admin\/users\/\d+$/) && method === "PUT"){
      const userId = path.split("/")[4];
      return cors(adminUpdateUser(request, env, userId));
    }

    if(path.match(/^\/api\/admin\/users\/\d+$/) && method === "DELETE"){
      const userId = path.split("/")[4];
      return cors(adminDeleteUser(request, env, userId));
    }

    if(path === "/api/admin/videos" && method === "GET"){
      return cors(adminGetVideos(request, env));
    }

    if(path.match(/^\/api\/admin\/videos\/\d+$/) && method === "DELETE"){
      const videoId = path.split("/")[4];
      return cors(adminDeleteVideo(request, env, videoId));
    }

    if(path === "/api/admin/migrate" && method === "POST"){
      return cors(adminRunMigration(request, env));
    }

    if(path === "/api/payments/config" && method === "GET"){
      return cors(getPaystackConfig(request, env));
    }

    if(path === "/api/payments/initialize" && method === "POST"){
      return cors(initializePayment(request, env));
    }

    if(path === "/api/payments/verify" && method === "POST"){
      return cors(verifyPayment(request, env));
    }

    if(path === "/api/payments/transactions" && method === "GET"){
      return cors(getTransactions(request, env));
    }

    if(path === "/api/webrtc/signal" && method === "POST"){
      return cors(sendSignal(request, env));
    }

    if(path === "/api/webrtc/poll" && method === "GET"){
      return cors(pollSignals(request, env));
    }

    if(path === "/api/live/create" && method === "POST"){
      return cors(createLiveStream(request, env));
    }

    if(path === "/api/live/streams" && method === "GET"){
      return cors(getLiveStreams(request, env));
    }

    if(path === "/api/live/end" && method === "POST"){
      return cors(endLiveStream(request, env));
    }
    if(path === "/api/live/chat" && method === "POST"){
      return cors(sendLiveChat(request, env));
    }
    if(path === "/api/live/chat" && method === "GET"){
      return cors(getLiveChat(request, env));
    }

    // Gift routes
    if(path === "/api/gifts/send" && method === "POST"){
      return cors(sendGift(request, env));
    }
    if(path === "/api/gifts/history" && method === "GET"){
      return cors(getGiftHistory(request, env));
    }
    if(path === "/api/wallet/balance" && method === "GET"){
      return cors(getWalletBalance(request, env));
    }
    if(path === "/api/gift-config" && method === "GET"){
      try {
        const { results } = await env.DB.prepare("SELECT gift_name, price_usd FROM gift_config").all();
        return cors(Response.json({ config: results || [] }));
      } catch(e) {
        return cors(Response.json({ config: [] }));
      }
    }

    // Extended admin routes
    if(path === "/api/admin/streams" && method === "GET"){
      return cors(adminGetLiveStreams(request, env));
    }
    if(path.match(/^\/api\/admin\/streams\/[^\/]+\/stop$/) && method === "POST"){
      const streamKey = decodeURIComponent(path.split("/")[4]);
      return cors(adminStopStream(request, env, streamKey));
    }
    if(path === "/api/admin/transactions" && method === "GET"){
      return cors(adminGetTransactions(request, env));
    }
    if(path === "/api/admin/gifts" && method === "GET"){
      return cors(adminGetGifts(request, env));
    }
    if(path === "/api/admin/messages" && method === "GET"){
      return cors(adminGetMessages(request, env));
    }
    if(path === "/api/admin/reports" && method === "GET"){
      return cors(adminGetReports(request, env));
    }
    if(path.match(/^\/api\/admin\/reports\/\d+$/) && method === "PUT"){
      const reportId = path.split("/")[4];
      return cors(adminUpdateReport(request, env, reportId));
    }
    if(path === "/api/admin/comments" && method === "GET"){
      return cors(adminGetComments(request, env));
    }
    if(path.match(/^\/api\/admin\/comments\/\d+$/) && method === "DELETE"){
      const commentId = path.split("/")[4];
      return cors(adminDeleteComment(request, env, commentId));
    }
    if(path === "/api/admin/logs" && method === "GET"){
      return cors(adminGetActivityLogs(request, env));
    }
    if(path === "/api/admin/storage" && method === "GET"){
      return cors(adminGetStorageHealth(request, env));
    }
    if(path === "/api/admin/balance" && method === "POST"){
      return cors(adminAdjustBalance(request, env));
    }
    if(path === "/api/admin/gift-config" && method === "GET"){
      return cors(adminGetGiftConfig(request, env));
    }
    if(path === "/api/admin/gift-config" && method === "POST"){
      return cors(adminUpdateGiftPrice(request, env));
    }

    if(path.startsWith("/api/admin/clear/") && method === "POST"){
      const table = path.split("/api/admin/clear/")[1];
      return cors(adminClearTable(request, env, table));
    }


    // Block routes
    if(path.match(/^\/api\/users\/[^\/]+\/block$/) && method === "POST"){
      const username = path.split("/")[3];
      return cors(blockUser(request, env, username));
    }
    if(path === "/api/users/blocked" && method === "GET"){
      return cors(getBlockedUsers(request, env));
    }

    // Report routes
    if(path.match(/^\/api\/videos\/\d+\/report$/) && method === "POST"){
      const videoId = path.split("/")[3];
      return cors(reportVideo(request, env, videoId));
    }
    if(path.match(/^\/api\/users\/[^\/]+\/report$/) && method === "POST"){
      const username = path.split("/")[3];
      return cors(reportUser(request, env, username));
    }

    // Download route
    if(path.match(/^\/api\/videos\/\d+\/download$/) && method === "GET"){
      const videoId = path.split("/")[3];
      return cors(downloadVideo(request, env, videoId));
    }

    // DEBUG endpoint - remove after testing
    if(path === "/api/debug/test-login" && method === "POST"){
      try {
        const body = await request.json();
        const { email, password } = body;
        const { verifyPassword } = await import("./utils/crypto.js");

        const debug = { step: "start", email };

        const { results } = await env.DB.prepare(
          "SELECT id, username, email, password_hash, role, status FROM users WHERE LOWER(email) = LOWER(?)"
        ).bind(email).all();

        debug.userCount = results.length;

        if (results.length === 0) {
          debug.failAt = "email_lookup";
          debug.reason = "No user found with that email";
          return cors(new Response(JSON.stringify(debug, null, 2), { status: 200, headers: { "Content-Type": "application/json" } }));
        }

        const user = results[0];
        debug.userId = user.id;
        debug.username = user.username;
        debug.status = user.status;
        debug.hashPresent = !!user.password_hash;
        debug.hashLength = (user.password_hash || "").length;
        debug.hashPrefix = (user.password_hash || "").substring(0, 20);
        debug.hashSuffix = (user.password_hash || "").substring((user.password_hash || "").length - 20);

        let pwValid = false;
        let pwError = null;
        try {
          pwValid = await verifyPassword(password, user.password_hash);
        } catch(e) {
          pwError = e.message;
        }

        debug.passwordValid = pwValid;
        debug.passwordError = pwError;

        if (!pwValid) {
          debug.failAt = "password_verify";
          debug.reason = "Password hash mismatch";
        } else {
          debug.failAt = "none";
          debug.reason = "Login should succeed - password is correct";
        }

        return cors(new Response(JSON.stringify(debug, null, 2), { status: 200, headers: { "Content-Type": "application/json" } }));
      } catch(e) {
        return cors(new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } }));
      }
    }

    // DEBUG: Reset password hash directly (fixes truncated hashes)
    if(path === "/api/debug/set-password" && method === "POST"){
      try {
        const body = await request.json();
        const { email, newPassword } = body;
        const { hashPassword } = await import("./utils/crypto.js");

        if (!email || !newPassword) {
          return cors(new Response(JSON.stringify({ error: "email and newPassword required" }), { status: 400, headers: { "Content-Type": "application/json" } }));
        }

        const newHash = await hashPassword(newPassword);

        const { results } = await env.DB.prepare(
          "SELECT id, username, password_hash FROM users WHERE LOWER(email) = LOWER(?)"
        ).bind(email).all();

        if (results.length === 0) {
          return cors(new Response(JSON.stringify({ error: "No user with that email" }), { status: 404, headers: { "Content-Type": "application/json" } }));
        }

        const oldHashLen = (results[0].password_hash || "").length;

        await env.DB.prepare(
          "UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)"
        ).bind(newHash, email).run();

        return cors(new Response(JSON.stringify({
          success: true,
          username: results[0].username,
          oldHashLength: oldHashLen,
          newHashLength: newHash.length,
          newHashPrefix: newHash.substring(0, 20),
          message: "Password updated. You can now login."
        }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } }));
      } catch(e) {
        return cors(new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } }));
      }
    }

    // DEBUG: Recreate users table with correct password_hash column type
    if(path === "/api/debug/fix-users-table" && method === "POST"){
      try {
        const results = [];

        // Disable foreign keys for migration
        await env.DB.prepare("PRAGMA foreign_keys = OFF").run();
        results.push("Foreign keys disabled");

        // Step 1: Get all users
        const { results: users } = await env.DB.prepare("SELECT * FROM users").all();
        results.push(`Found ${users.length} users to migrate`);

        // Step 2: Create new table with TEXT password_hash
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          display_name TEXT,
          password_hash TEXT,
          avatar TEXT,
          bio TEXT,
          role TEXT DEFAULT 'user',
          status TEXT DEFAULT 'active',
          wallet_balance REAL DEFAULT 0,
          allow_messages TEXT DEFAULT 'everyone',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )`).run();
        results.push("Created users_new table");

        // Step 3: Copy users
        let copied = 0;
        for (const u of users) {
          try {
            await env.DB.prepare(
              `INSERT INTO users_new (id, username, email, display_name, password_hash, avatar, bio, role, status, wallet_balance, allow_messages, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(u.id, u.username, u.email, u.display_name, u.password_hash, u.avatar, u.bio, u.role || 'user', u.status || 'active', u.wallet_balance || 0, u.allow_messages || 'everyone', u.created_at, u.updated_at).run();
            copied++;
          } catch(e) {
            results.push(`Error copying user ${u.username}: ${e.message}`);
          }
        }
        results.push(`Copied ${copied} users`);

        // Step 4: Drop old table
        await env.DB.prepare("DROP TABLE users").run();
        results.push("Dropped old users table");

        // Step 5: Rename new table
        await env.DB.prepare("ALTER TABLE users_new RENAME TO users").run();
        results.push("Renamed users_new to users");

        // Re-enable foreign keys
        await env.DB.prepare("PRAGMA foreign_keys = ON").run();
        results.push("Foreign keys re-enabled");

        return cors(new Response(JSON.stringify({ success: true, results }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } }));
      } catch(e) {
        return cors(new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } }));
      }
    }

    return cors(
      new Response("404 - Endpoint Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      })
    );

    }
    catch(error){
      const errorOrigin = getAllowedOriginForRequest(request);
      return new Response(JSON.stringify({error:error.message||"Server error"}),{
        status:500,
        headers:{
          "Access-Control-Allow-Origin":errorOrigin,
          "Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":"Content-Type, Authorization",
          "Content-Type":"application/json"
        }
      });
    }

  }

};
