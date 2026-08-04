async function adminAuth(request, env) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    const token = authHeader.replace("Bearer ", "");
    const { verifyToken } = await import("../utils/jwt.js");
    const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
    if (!payload) return { error: Response.json({ error: "Invalid token" }, { status: 401 }) };
    const { results: user } = await env.DB.prepare("SELECT role, username FROM users WHERE id = ?").bind(payload.userId).all();
    if (!user || !user[0] || user[0].role !== "admin") return { error: Response.json({ error: "Admin only" }, { status: 403 }) };
    return { userId: payload.userId, username: user[0].username };
}

async function safeQuery(env, sql, bindArr) {
    try {
        const { results } = await env.DB.prepare(sql).bind(...bindArr).all();
        return results || [];
    } catch (e) {
        console.error("[Admin] Query error:", e.message);
        return [];
    }
}

export async function adminGetLiveStreams(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT ls.*, u.avatar, u.display_name
             FROM live_streams ls LEFT JOIN users u ON ls.user_id = u.id
             ORDER BY ls.created_at DESC LIMIT 100`, []);
        return Response.json({ streams: results });
    } catch (e) {
        return Response.json({ streams: [], error: e.message }, { status: 500 });
    }
}

export async function adminStopStream(request, env, streamKey) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        await env.DB.prepare("UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE stream_key = ?").bind(streamKey).run();
        try {
            await env.DB.prepare(
                "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, 'stop_stream', 'live_stream', ?, 'Admin forced stream end')"
            ).bind(auth.username || "", String(streamKey)).run();
        } catch(e) {}
        return Response.json({ success: true, message: "Stream stopped" });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetTransactions(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT t.*, u.username, u.avatar FROM transactions t
             LEFT JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC LIMIT 100`, []);
        return Response.json({ transactions: results });
    } catch (e) {
        return Response.json({ transactions: [] }, { status: 500 });
    }
}

export async function adminGetGifts(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT g.*, su.username as sender_username, ru.username as receiver_username
             FROM gift_transactions g
             LEFT JOIN users su ON g.sender_id = su.id
             LEFT JOIN users ru ON g.receiver_id = ru.id
             ORDER BY g.created_at DESC LIMIT 100`, []);
        return Response.json({ gifts: results });
    } catch (e) {
        return Response.json({ gifts: [] }, { status: 500 });
    }
}

export async function adminGetMessages(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT m.*, su.username as sender_name,
             CASE WHEN m.sender_id = c.user1_id THEN u2.username ELSE u1.username END as receiver_name
             FROM messages m
             JOIN conversations c ON m.conversation_id = c.id
             LEFT JOIN users su ON m.sender_id = su.id
             LEFT JOIN users u1 ON c.user1_id = u1.id
             LEFT JOIN users u2 ON c.user2_id = u2.id
             ORDER BY m.created_at DESC LIMIT 100`, []);
        return Response.json({ messages: results });
    } catch (e) {
        return Response.json({ messages: [] }, { status: 500 });
    }
}

export async function adminGetActivityLogs(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200", []);
        return Response.json({ logs: results });
    } catch (e) {
        return Response.json({ logs: [] }, { status: 500 });
    }
}

export async function adminGetStorageHealth(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;

        let events = await safeQuery(env,
            "SELECT * FROM storage_events ORDER BY created_at DESC LIMIT 50", []);

        let providers = [];
        try {
            const StorageRouter = (await import("../cloud/storage/router.js")).default;
            const health = await StorageRouter.healthCheck(env);
            providers = health.providers || [];
        } catch (e) {
            providers = [{ id: "unknown", status: "error", error: e.message }];
        }

        return Response.json({ storage: { providers, events, totalFiles: events.length } });
    } catch (e) {
        return Response.json({ storage: { providers: [], events: [], totalFiles: 0 } }, { status: 500 });
    }
}

export async function adminDeleteComment(request, env, commentId) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        await env.DB.prepare("DELETE FROM video_comments WHERE id = ?").bind(Number(commentId)).run();
        try {
            await logActivity(env, auth.username || "", "delete_comment", "comment", commentId, "Admin deleted comment");
        } catch(e) {}
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetComments(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT vc.*, u.username, u.avatar
             FROM video_comments vc
             LEFT JOIN users u ON vc.user_id = u.id
             ORDER BY vc.created_at DESC LIMIT 100`, []);
        return Response.json({ comments: results });
    } catch (e) {
        return Response.json({ comments: [] }, { status: 500 });
    }
}

export async function adminAdjustBalance(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const body = await request.json();
        const { user_id, amount, reason } = body;
        if (!user_id || amount === undefined) {
            return Response.json({ error: "user_id and amount required" }, { status: 400 });
        }
        await env.DB.prepare(
            "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?"
        ).bind(Number(amount), Number(user_id)).run();
        try {
            await env.DB.prepare(
                "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, 'adjust_balance', 'user', ?, ?)"
            ).bind(auth.username || "", String(user_id), `Admin ${amount >= 0 ? "added" : "removed"} $${Math.abs(amount).toFixed(2)} ${reason ? "- " + reason : ""}`).run();
        } catch(e) {}
        const { results } = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(Number(user_id)).all();
        return Response.json({ success: true, balance: results[0]?.wallet_balance || 0 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminUpdateGiftPrice(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const body = await request.json();
        const { gift_name, new_price } = body;
        if (!gift_name || new_price === undefined) {
            return Response.json({ error: "gift_name and new_price required" }, { status: 400 });
        }
        try {
            await env.DB.prepare(
                "INSERT INTO gift_config (gift_name, price_usd, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(gift_name) DO UPDATE SET price_usd = ?, updated_at = datetime('now')"
            ).bind(gift_name, Number(new_price), Number(new_price)).run();
        } catch(e) {
            await env.DB.prepare("CREATE TABLE IF NOT EXISTS gift_config (id INTEGER PRIMARY KEY, gift_name TEXT UNIQUE, price_usd REAL, updated_at TEXT)").run();
            await env.DB.prepare(
                "INSERT OR REPLACE INTO gift_config (gift_name, price_usd, updated_at) VALUES (?, ?, datetime('now'))"
            ).bind(gift_name, Number(new_price)).run();
        }
        try {
            await env.DB.prepare(
                "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, 'update_gift_price', 'gift', ?, ?)"
            ).bind(auth.username || "", gift_name, `Updated ${gift_name} price to $${Number(new_price).toFixed(2)}`).run();
        } catch(e) {}
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetGiftConfig(request, env) {
    try {
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        let config = await safeQuery(env, "SELECT * FROM gift_config ORDER BY price_usd ASC", []);
        return Response.json({ config });
    } catch (e) {
        return Response.json({ config: [] }, { status: 500 });
    }
}

async function logActivity(env, username, action, targetType, targetId, details) {
    try {
        await env.DB.prepare(
            "INSERT INTO activity_logs (admin_username, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)"
        ).bind(username || "", action, targetType || "", String(targetId || ""), details || "").run();
    } catch (e) {}
}
