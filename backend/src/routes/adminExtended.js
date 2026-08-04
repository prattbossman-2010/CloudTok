export async function adminGetLiveStreams(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT ls.*, u.avatar, u.display_name
             FROM live_streams ls LEFT JOIN users u ON ls.user_id = u.id
             ORDER BY ls.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ streams: results });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminStopStream(request, env, streamKey) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        await env.DB.prepare("UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE stream_key = ?").bind(streamKey).run();

        try {
            await env.DB.prepare(
                "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, 'stop_stream', 'live_stream', ?, 'Admin forced stream end')"
            ).bind(payload.username || "", String(streamKey)).run();
        } catch(e) {}

        return Response.json({ success: true, message: "Stream stopped" });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetTransactions(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT t.*, u.username, u.avatar FROM transactions t
             LEFT JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ transactions: results || [] });
    } catch (e) {
        return Response.json({ transactions: [], error: e.message }, { status: 500 });
    }
}

export async function adminGetGifts(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT g.*, su.username as sender_username, ru.username as receiver_username
             FROM gift_transactions g
             LEFT JOIN users su ON g.sender_id = su.id
             LEFT JOIN users ru ON g.receiver_id = ru.id
             ORDER BY g.created_at DESC LIMIT 100`
        ).all();

        return Response.json({ gifts: results || [] });
    } catch (e) {
        return Response.json({ gifts: [], error: e.message }, { status: 500 });
    }
}

export async function adminGetMessages(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT m.*, su.username as sender_name,
             CASE WHEN m.sender_id = c.user1_id THEN u2.username ELSE u1.username END as receiver_name
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             LEFT JOIN users su ON m.sender_id = su.id
             LEFT JOIN users u1 ON c.user1_id = u1.id
             LEFT JOIN users u2 ON c.user2_id = u2.id
             ORDER BY m.created_at DESC LIMIT 100`
        ).all();

        let totalConv = [{ count: 0 }];
        let totalMsg = [{ count: 0 }];
        try {
            const r1 = await env.DB.prepare("SELECT COUNT(*) as count FROM conversations").all();
            totalConv = r1.results || totalConv;
        } catch(e) {}
        try {
            const r2 = await env.DB.prepare("SELECT COUNT(*) as count FROM messages").all();
            totalMsg = r2.results || totalMsg;
        } catch(e) {}

        return Response.json({ messages: results, totalConversations: totalConv[0].count, totalMessages: totalMsg[0].count });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetActivityLogs(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200").all();
        return Response.json({ logs: results || [] });
    } catch (e) {
        return Response.json({ logs: [], error: e.message }, { status: 500 });
    }
}

export async function adminLogActivity(request, env, action, targetType, targetId, details) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return;
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return;

        await env.DB.prepare(
            "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)"
        ).bind(payload.username || "", action, targetType || "", String(targetId || ""), details || "").run();
    } catch (e) {}
}

export async function adminGetStorageHealth(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        let events = [];
        try {
            const r = await env.DB.prepare(
                "SELECT * FROM storage_events ORDER BY created_at DESC LIMIT 50"
            ).all();
            events = r.results || [];
        } catch(e) {}

        let storageStatus = "unknown";
        try {
            const StorageRouter = (await import("../cloud/storage/router.js")).default;
            const health = await StorageRouter.healthCheck(env);
            storageStatus = health.status || "unknown";
        } catch (e) {
            storageStatus = "unavailable";
        }

        return Response.json({ storage: { status: storageStatus, events: events, totalFiles: events.length } });
    } catch (e) {
        return Response.json({ storage: { status: "error", events: [], totalFiles: 0 } }, { status: 500 });
    }
}

export async function adminDeleteComment(request, env, commentId) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        await env.DB.prepare("DELETE FROM video_comments WHERE id = ?").bind(Number(commentId)).run();
        try {
            await logActivity(env, payload.username || "", "delete_comment", "comment", commentId, "Admin deleted comment");
        } catch(e) {}
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetComments(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || !user[0] || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT vc.*, u.username, u.avatar
             FROM video_comments vc
             LEFT JOIN users u ON vc.user_id = u.id
             ORDER BY vc.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ comments: results || [] });
    } catch (e) {
        return Response.json({ comments: [], error: e.message }, { status: 500 });
    }
}

async function logActivity(env, username, action, targetType, targetId, details) {
    try {
        await env.DB.prepare(
            "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)"
        ).bind(username || "", action, targetType || "", String(targetId || ""), details || "").run();
    } catch (e) {}
}
