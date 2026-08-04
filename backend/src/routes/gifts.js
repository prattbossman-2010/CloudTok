async function ensureGiftTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS gift_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL, receiver_id INTEGER NOT NULL, gift_name TEXT NOT NULL, gift_emoji TEXT DEFAULT '', amount_usd REAL NOT NULL, stream_id INTEGER, conversation_id INTEGER, message TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS gift_config (id INTEGER PRIMARY KEY, gift_name TEXT UNIQUE, price_usd REAL, updated_at TEXT)").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0").run(); } catch(e) {}
}

export async function sendGift(request, env) {
    try {
        await ensureGiftTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const senderId = payload.userId || payload.id;
        const body = await request.json();
        const { receiver_username, gift_name, gift_emoji, amount_usd, stream_id, conversation_id, message } = body;

        if (!receiver_username || !gift_name || !amount_usd) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        let finalAmount = Number(amount_usd);
        try {
            const { results: config } = await env.DB.prepare("SELECT price_usd FROM gift_config WHERE gift_name = ?").bind(gift_name).all();
            if (config && config.length > 0) {
                finalAmount = Number(config[0].price_usd);
            }
        } catch(e) {}

        const { results: sender } = await env.DB.prepare("SELECT id, wallet_balance FROM users WHERE id = ?").bind(senderId).all();
        if (!sender || sender.length === 0) return Response.json({ error: "Sender not found" }, { status: 404 });

        if ((sender[0].wallet_balance || 0) < finalAmount) {
            return Response.json({ error: "Insufficient balance. Please fund your wallet first." }, { status: 400 });
        }

        const { results: receiver } = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(receiver_username).all();
        if (!receiver || receiver.length === 0) return Response.json({ error: "Receiver not found" }, { status: 404 });

        const receiverId = receiver[0].id;

        await env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").bind(finalAmount, senderId).run();
        await env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(finalAmount, receiverId).run();

        await env.DB.prepare(
            "INSERT INTO gift_transactions (sender_id, receiver_id, gift_name, gift_emoji, amount_usd, stream_id, conversation_id, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(senderId, receiverId, gift_name, gift_emoji || "", finalAmount, stream_id || null, conversation_id || null, message || "").run();

        await env.DB.prepare(
            "INSERT INTO notifications (user_id, from_user_id, type, message, reference_type, reference_id) VALUES (?, ?, 'gift', ?, 'gift', ?)"
        ).bind(receiverId, senderId, `Sent you a ${gift_emoji} ${gift_name} ($${finalAmount.toFixed(2)})`, senderId).run();

        const { results: updatedSender } = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(senderId).all();

        return Response.json({
            success: true,
            wallet_balance: updatedSender[0].wallet_balance,
            gift: { name: gift_name, emoji: gift_emoji, price: finalAmount },
            message: `Gift sent to @${receiver_username}`
        });
    } catch (e) {
        return Response.json({ error: e.message || "Failed to send gift" }, { status: 500 });
    }
}

export async function getGiftHistory(request, env) {
    try {
        await ensureGiftTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const userId = payload.userId || payload.id;

        const { results: sent } = await env.DB.prepare(
            `SELECT g.*, u.username as receiver_name, u.avatar as receiver_avatar
             FROM gift_transactions g JOIN users u ON g.receiver_id = u.id
             WHERE g.sender_id = ? ORDER BY g.created_at DESC LIMIT 50`
        ).bind(userId).all();

        const { results: received } = await env.DB.prepare(
            `SELECT g.*, u.username as sender_name, u.avatar as sender_avatar
             FROM gift_transactions g JOIN users u ON g.sender_id = u.id
             WHERE g.receiver_id = ? ORDER BY g.created_at DESC LIMIT 50`
        ).bind(userId).all();

        return Response.json({ sent, received });
    } catch (e) {
        return Response.json({ error: e.message || "Failed to load gifts" }, { status: 500 });
    }
}

export async function getWalletBalance(request, env) {
    try {
        await ensureGiftTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const { results } = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(payload.userId || payload.id).all();
        return Response.json({ balance: results[0]?.wallet_balance || 0 });
    } catch (e) {
        return Response.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
