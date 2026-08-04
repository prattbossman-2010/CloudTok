async function ensureTable(env, sql) {
    try { await env.DB.prepare(sql).run(); } catch(e) {}
}

async function ensureAllTables(env) {
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY, admin_user_id INTEGER, admin_username TEXT DEFAULT '', action TEXT NOT NULL, target_type TEXT DEFAULT '', target_id TEXT DEFAULT '', details TEXT DEFAULT '', ip_address TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS gift_config (id INTEGER PRIMARY KEY, gift_name TEXT UNIQUE, price_usd REAL, updated_at TEXT)`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS storage_events (id INTEGER PRIMARY KEY, event_type TEXT NOT NULL, provider TEXT DEFAULT '', filename TEXT DEFAULT '', file_size INTEGER DEFAULT 0, status TEXT DEFAULT 'success', error_message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS gift_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, gift_name TEXT NOT NULL, gift_emoji TEXT DEFAULT '', amount_usd REAL NOT NULL, stream_id INTEGER, conversation_id INTEGER, message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS live_streams (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, username TEXT NOT NULL, stream_key TEXT UNIQUE NOT NULL, title TEXT DEFAULT 'Live Stream', status TEXT DEFAULT 'active', viewers INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), ended_at TEXT)`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, reference TEXT UNIQUE NOT NULL, amount REAL NOT NULL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, conversation_id INTEGER, sender_id INTEGER, text TEXT, read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY, user1_id INTEGER, user2_id INTEGER, last_message TEXT, last_message_at TEXT)`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS video_comments (id INTEGER PRIMARY KEY, user_id INTEGER, video_id INTEGER, text TEXT, created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS webrtc_signals (id INTEGER PRIMARY KEY, from_username TEXT, to_username TEXT, signal_type TEXT, signal_data TEXT, created_at TEXT DEFAULT (datetime('now')))`);
    await ensureTable(env, `CREATE TABLE IF NOT EXISTS live_chat (id INTEGER PRIMARY KEY, stream_key TEXT, sender_id INTEGER, sender_username TEXT, text TEXT, to_username TEXT, created_at TEXT DEFAULT (datetime('now')))`);
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN allow_messages TEXT DEFAULT 'everyone'").run(); } catch(e) {}
}

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
        if (bindArr && bindArr.length > 0) {
            const { results } = await env.DB.prepare(sql).bind(...bindArr).all();
            return results || [];
        } else {
            const { results } = await env.DB.prepare(sql).all();
            return results || [];
        }
    } catch (e) {
        console.error("[Admin] Query error:", e.message);
        return [];
    }
}

export async function adminGetLiveStreams(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT ls.*, u.avatar, u.display_name
             FROM live_streams ls LEFT JOIN users u ON ls.user_id = u.id
             ORDER BY ls.created_at DESC LIMIT 100`);
        return Response.json({ streams: results });
    } catch (e) {
        return Response.json({ streams: [] }, { status: 500 });
    }
}

export async function adminStopStream(request, env, streamKey) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        await env.DB.prepare("UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE stream_key = ?").bind(streamKey).run();
        try { await logActivity(env, auth.username || "", "stop_stream", "live_stream", streamKey, "Admin forced stream end"); } catch(e) {}
        return Response.json({ success: true, message: "Stream stopped" });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetTransactions(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT t.*, u.username, u.avatar FROM transactions t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 100`);
        return Response.json({ transactions: results });
    } catch (e) {
        return Response.json({ transactions: [] }, { status: 500 });
    }
}

export async function adminGetGifts(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT g.*, su.username as sender_username, ru.username as receiver_username
             FROM gift_transactions g
             LEFT JOIN users su ON g.sender_id = su.id
             LEFT JOIN users ru ON g.receiver_id = ru.id
             ORDER BY g.created_at DESC LIMIT 100`);
        return Response.json({ gifts: results });
    } catch (e) {
        return Response.json({ gifts: [] }, { status: 500 });
    }
}

export async function adminGetMessages(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT m.*, su.username as sender_name
             FROM messages m
             LEFT JOIN users su ON m.sender_id = su.id
             ORDER BY m.created_at DESC LIMIT 100`);
        return Response.json({ messages: results });
    } catch (e) {
        return Response.json({ messages: [] }, { status: 500 });
    }
}

export async function adminGetActivityLogs(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200");
        return Response.json({ logs: results });
    } catch (e) {
        return Response.json({ logs: [] }, { status: 500 });
    }
}

export async function adminGetStorageHealth(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        let events = await safeQuery(env, "SELECT * FROM storage_events ORDER BY created_at DESC LIMIT 50");
        let providers = [];
        try {
            const StorageRouter = (await import("../cloud/storage/router.js")).default;
            const health = await StorageRouter.healthCheck(env);
            providers = health.providers || [];
        } catch (e) {
            providers = [{ id: "unknown", status: "unavailable" }];
        }
        return Response.json({ storage: { providers, events, totalFiles: events.length } });
    } catch (e) {
        return Response.json({ storage: { providers: [], events: [], totalFiles: 0 } }, { status: 500 });
    }
}

export async function adminDeleteComment(request, env, commentId) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        await env.DB.prepare("DELETE FROM video_comments WHERE id = ?").bind(Number(commentId)).run();
        try { await logActivity(env, auth.username || "", "delete_comment", "comment", commentId, "Admin deleted comment"); } catch(e) {}
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetComments(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const results = await safeQuery(env,
            `SELECT vc.*, u.username, u.avatar
             FROM video_comments vc LEFT JOIN users u ON vc.user_id = u.id
             ORDER BY vc.created_at DESC LIMIT 100`);
        return Response.json({ comments: results });
    } catch (e) {
        return Response.json({ comments: [] }, { status: 500 });
    }
}

export async function adminAdjustBalance(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const body = await request.json();
        const userId = Number(body.user_id);
        const amount = Number(body.amount);
        const reason = body.reason || "";
        if (!userId || isNaN(amount)) {
            return Response.json({ error: "user_id and amount required" }, { status: 400 });
        }
        await env.DB.prepare("UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?").bind(amount, userId).run();
        try { await logActivity(env, auth.username || "", "adjust_balance", "user", String(userId), `${amount >= 0 ? "Added" : "Removed"} $${Math.abs(amount).toFixed(2)}${reason ? " - " + reason : ""}`); } catch(e) {}
        const { results } = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(userId).all();
        return Response.json({ success: true, balance: results[0]?.wallet_balance || 0 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminUpdateGiftPrice(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const body = await request.json();
        const giftName = body.gift_name;
        const newPrice = Number(body.new_price);
        if (!giftName || isNaN(newPrice)) {
            return Response.json({ error: "gift_name and new_price required" }, { status: 400 });
        }
        const { results: existing } = await env.DB.prepare("SELECT id FROM gift_config WHERE gift_name = ?").bind(giftName).all();
        if (existing && existing.length > 0) {
            await env.DB.prepare("UPDATE gift_config SET price_usd = ?, updated_at = datetime('now') WHERE gift_name = ?").bind(newPrice, giftName).run();
        } else {
            await env.DB.prepare("INSERT INTO gift_config (gift_name, price_usd, updated_at) VALUES (?, ?, datetime('now'))").bind(giftName, newPrice).run();
        }
        try { await logActivity(env, auth.username || "", "update_gift_price", "gift", giftName, `Updated ${giftName} to $${newPrice.toFixed(2)}`); } catch(e) {}
        return Response.json({ success: true });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}

export async function adminGetGiftConfig(request, env) {
    try {
        await ensureAllTables(env);
        const auth = await adminAuth(request, env);
        if (auth.error) return auth.error;
        const config = await safeQuery(env, "SELECT * FROM gift_config ORDER BY price_usd ASC");
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
