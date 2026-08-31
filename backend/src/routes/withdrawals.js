async function ensureWithdrawalTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS withdrawal_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, amount REAL NOT NULL, method TEXT NOT NULL, account_name TEXT, accountNumber TEXT, mobile_number TEXT, bank_name TEXT, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0").run(); } catch(e) {}
}

export async function createWithdrawal(request, env) {
    try {
        await ensureWithdrawalTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const userId = payload.userId || payload.id;
        const body = await request.json();
        const { amount, method, account_name, account_number, mobile_number, bank_name } = body;

        if (!amount || amount <= 0) {
            return Response.json({ error: "Invalid amount" }, { status: 400 });
        }
        if (amount > 1000) {
            return Response.json({ error: "Maximum withdrawal amount is $1000" }, { status: 400 });
        }
        if (!method) {
            return Response.json({ error: "Please select a withdrawal method" }, { status: 400 });
        }
        if (method === "bank" && (!account_name || !account_number || !bank_name)) {
            return Response.json({ error: "Bank details are required for bank withdrawal" }, { status: 400 });
        }
        if (method === "mobile_money" && !mobile_number) {
            return Response.json({ error: "Mobile number is required for mobile money withdrawal" }, { status: 400 });
        }

        const { results: user } = await env.DB.prepare("SELECT wallet_balance FROM users WHERE id = ?").bind(userId).all();
        if (!user || user.length === 0) return Response.json({ error: "User not found" }, { status: 404 });
        const balance = user[0].wallet_balance || 0;
        if (balance < amount) {
            return Response.json({ error: "Insufficient balance" }, { status: 400 });
        }

        await env.DB.prepare("INSERT INTO withdrawal_requests (user_id, amount, method, account_name, accountNumber, mobile_number, bank_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')").bind(userId, amount, method, account_name || null, account_number || null, mobile_number || null, bank_name || null).run();

        return Response.json({ success: true, message: "Processing your withdrawal request — our team is working on getting your money to you shortly." });
    } catch (e) {
        return Response.json({ error: e.message || "Withdrawal failed" }, { status: 500 });
    }
}

export async function getWithdrawals(request, env) {
    try {
        await ensureWithdrawalTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const userId = payload.userId || payload.id;
        const { results } = await env.DB.prepare("SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(userId).all();
        return Response.json({ withdrawals: results || [] });
    } catch (e) {
        return Response.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

export async function approveWithdrawal(request, env) {
    try {
        await ensureWithdrawalTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const { id } = await request.json();
        if (!id) return Response.json({ error: "Withdrawal ID required" }, { status: 400 });

        const { results: req } = await env.DB.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").bind(id).all();
        if (!req || req.length === 0) return Response.json({ error: "Withdrawal request not found" }, { status: 404 });
        if (req[0].status !== "pending") return Response.json({ error: "Already processed" }, { status: 400 });

        await env.DB.prepare("UPDATE withdrawal_requests SET status = 'approved', updated_at = datetime('now') WHERE id = ?").bind(id).run();
        await env.DB.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?").bind(req[0].amount, req[0].user_id).run();

        return Response.json({ success: true, message: "Withdrawal approved and processed" });
    } catch (e) {
        return Response.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

export async function rejectWithdrawal(request, env) {
    try {
        await ensureWithdrawalTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const { id } = await request.json();
        if (!id) return Response.json({ error: "Withdrawal ID required" }, { status: 400 });

        const { results: req } = await env.DB.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").bind(id).all();
        if (!req || req.length === 0) return Response.json({ error: "Withdrawal request not found" }, { status: 404 });
        if (req[0].status !== "pending") return Response.json({ error: "Already processed" }, { status: 400 });

        await env.DB.prepare("UPDATE withdrawal_requests SET status = 'rejected', updated_at = datetime('now') WHERE id = ?").bind(id).run();

        return Response.json({ success: true, message: "Withdrawal rejected" });
    } catch (e) {
        return Response.json({ error: e.message || "Failed" }, { status: 500 });
    }
}

export async function getAllWithdrawals(request, env) {
    try {
        await ensureWithdrawalTables(env);
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { verifyToken } = await import("../utils/jwt.js");
        const payload = await verifyToken(token, env.JWT_SECRET || "cloudtok-secret");
        if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

        const { results } = await env.DB.prepare("SELECT wr.*, u.username FROM withdrawal_requests wr JOIN users u ON wr.user_id = u.id ORDER BY wr.created_at DESC LIMIT 50").all();
        return Response.json({ withdrawals: results || [] });
    } catch (e) {
        return Response.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
