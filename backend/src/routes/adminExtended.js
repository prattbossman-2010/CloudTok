export async function adminGetLiveStreams(request, env) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT ls.*, u.avatar, u.display_name,
             (SELECT COUNT(*) FROM gift_transactions WHERE stream_id = ls.id) as gift_count,
             (SELECT COALESCE(SUM(amount_usd), 0) FROM gift_transactions WHERE stream_id = ls.id) as gift_revenue
             FROM live_streams ls LEFT JOIN users u ON ls.user_id = u.id
             ORDER BY ls.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ streams: results });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminStopStream(request, env, streamId) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
        const { results: user } = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(payload.userId).all();
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        await env.DB.prepare("UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE id = ?").bind(streamId).run();

        await env.DB.prepare(
            "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, 'stop_stream', 'live_stream', ?, 'Admin forced stream end')"
        ).bind(payload.username, String(streamId)).run();

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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT t.*, u.username, u.avatar FROM transactions t
             LEFT JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ transactions: results });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT g.*, su.username as sender_name, ru.username as receiver_name
             FROM gift_transactions g
             LEFT JOIN users su ON g.sender_id = su.id
             LEFT JOIN users ru ON g.receiver_id = ru.id
             ORDER BY g.created_at DESC LIMIT 100`
        ).all();

        const { results: totals } = await env.DB.prepare(
            "SELECT COALESCE(SUM(amount_usd), 0) as total_gifted, COUNT(*) as total_gifts FROM gift_transactions"
        ).all();

        return Response.json({ gifts: results, totals: totals[0] });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT m.*, su.username as sender_name, ru.username as receiver_name,
             c.user1_id, c.user2_id
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             LEFT JOIN users su ON m.sender_id = su.id
             LEFT JOIN users ru ON (ru.id = CASE WHEN ru.id = c.user1_id THEN c.user2_id ELSE c.user1_id END)
             ORDER BY m.created_at DESC LIMIT 100`
        ).all();

        const { results: totalConv } = await env.DB.prepare("SELECT COUNT(*) as count FROM conversations").all();
        const { results: totalMsg } = await env.DB.prepare("SELECT COUNT(*) as count FROM messages").all();

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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200").all();
        return Response.json({ logs: results });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results: events } = await env.DB.prepare(
            "SELECT * FROM storage_events ORDER BY created_at DESC LIMIT 50"
        ).all();

        let storageStatus = "unknown";
        try {
            const StorageRouter = (await import("../cloud/storage/router.js")).default;
            const health = await StorageRouter.healthCheck(env);
            storageStatus = health.status || "unknown";
        } catch (e) {
            storageStatus = "error: " + e.message;
        }

        return Response.json({ status: storageStatus, events });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        await env.DB.prepare("DELETE FROM video_comments WHERE id = ?").bind(commentId).run();
        await logActivity(env, payload.username, "delete_comment", "comment", commentId, "Admin deleted comment");
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
        if (!user || user[0].role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

        const { results } = await env.DB.prepare(
            `SELECT vc.*, u.username, u.avatar, v.caption as video_caption
             FROM video_comments vc
             LEFT JOIN users u ON vc.user_id = u.id
             LEFT JOIN videos v ON vc.video_id = v.id
             ORDER BY vc.created_at DESC LIMIT 100`
        ).all();
        return Response.json({ comments: results });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

async function logActivity(env, username, action, targetType, targetId, details) {
    try {
        await env.DB.prepare(
            "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)"
        ).bind(username || "", action, targetType || "", String(targetId || ""), details || "").run();
    } catch (e) {}
}
