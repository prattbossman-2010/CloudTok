import { authenticate } from "../middleware/auth.js";
import { hashPassword } from "../utils/crypto.js";
import { createToken } from "../utils/jwt.js";

export async function adminLogin(request, env) {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
        return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    const { results } = await env.DB.prepare(`
        SELECT id, username, email, display_name, avatar, role, password_hash
        FROM users WHERE email = ?
    `).bind(email).all();

    if (results.length === 0) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = results[0];
    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "admin") {
        return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const token = await createToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    }, env.JWT_SECRET);

    return Response.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
        }
    });
}

export async function adminCheck(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    if (auth.user.role !== "admin") {
        return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    return { user: auth.user };
}

export async function adminGetStats(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const users = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const videos = await env.DB.prepare("SELECT COUNT(*) as count FROM videos").first();
    const likes = await env.DB.prepare("SELECT COUNT(*) as count FROM video_likes").first();
    const comments = await env.DB.prepare("SELECT COUNT(*) as count FROM video_comments").first();
    const follows = await env.DB.prepare("SELECT COUNT(*) as count FROM follows").first();

    return Response.json({
        users: users.count,
        videos: videos.count,
        likes: likes.count,
        comments: comments.count,
        follows: follows.count
    });
}

export async function adminGetUsers(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const { results } = await env.DB.prepare(`
        SELECT id, username, display_name, email, avatar, bio, role, status, created_at
        FROM users ORDER BY created_at DESC
    `).all();

    return Response.json({ users: results });
}

export async function adminUpdateUser(request, env, userId) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const body = await request.json();
    const { status, role } = body;

    if (status) {
        await env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(status, userId).run();
    }
    if (role) {
        await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, userId).run();
    }

    return Response.json({ success: true });
}

export async function adminDeleteVideo(request, env, videoId) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    await env.DB.prepare("DELETE FROM video_likes WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_comments WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM video_saves WHERE video_id = ?").bind(videoId).run();
    await env.DB.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();

    return Response.json({ success: true });
}

export async function adminGetVideos(request, env) {
    const auth = await adminCheck(request, env);
    if (auth.error) return auth;

    const { results } = await env.DB.prepare(`
        SELECT videos.id, videos.caption, videos.video_url, videos.thumbnail_url,
               videos.likes, videos.comments, videos.views, videos.created_at,
               users.username
        FROM videos JOIN users ON videos.user_id = users.id
        ORDER BY videos.created_at DESC
    `).all();

    return Response.json({ videos: results });
}
