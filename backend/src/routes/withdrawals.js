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

        // Notify admin via email (Resend - same as forgot-password) + SMS (BMS) - fire and forget
        try {
            const { results: u } = await env.DB.prepare("SELECT username, email FROM users WHERE id = ?").bind(userId).all();
            const uname = u && u[0] ? u[0].username : "user#" + userId;
            const details = method === "bank" ? `${account_name} • ${account_number} • ${bank_name}` : method === "mobile_money" ? `${mobile_number}` : method;
            const shortMsg = `CloudTok: New withdrawal $${Number(amount).toFixed(2)} from @${uname} via ${method} (${details}). Check admin panel.`;
            const longText = `New withdrawal request\n\nUser: @${uname} (id ${userId})\nAmount: $${Number(amount).toFixed(2)}\nMethod: ${method}\nDetails: ${details}\n\nApprove/reject at admin panel: /admin.html -> Withdrawals`;
            const adminEmail = env.ADMIN_EMAIL || env.NOTIFY_EMAIL || "";
            const resendKey = env.RESEND_API_KEY || "";
            const fromEmail = env.EMAIL_FROM || "CloudTok <onboarding@resend.dev>";
            // Prioritize Resend (same API as forgot-password at backend/src/routes/passwordReset.js:47)
            if (adminEmail && resendKey) {
                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        from: fromEmail,
                        to: [adminEmail],
                        subject: `New withdrawal: $${Number(amount).toFixed(2)} from @${uname}`,
                        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:#00a69c;">New Withdrawal Request</h2><p><b>User:</b> @${uname} (id ${userId})</p><p><b>Amount:</b> $${Number(amount).toFixed(2)}</p><p><b>Method:</b> ${method}</p><p><b>Details:</b> ${details}</p><p style="margin-top:16px;"><a href="https://prattbossman-2010.github.io/CloudTok/admin.html" style="background:#00a69c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Open Admin → Withdrawals</a></p><p style="color:#888;font-size:12px;margin-top:16px;">You get this because ADMIN_EMAIL is set. SMS is deferred.</p></div>`
                    })
                }).catch(()=>{});
            } else if (adminEmail && env.MAILCHANNELS_ENABLED !== "false") {
                // Fallback MailChannels (deprecated, kept for compat)
                await fetch("https://api.mailchannels.net/tx/v1/send", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email: adminEmail, name: "Admin" }] }],
                        from: { email: "noreply@cloudtok.app", name: "CloudTok" },
                        subject: `New withdrawal request: $${Number(amount).toFixed(2)} from @${uname}`,
                        content: [{ type: "text/plain", value: longText }]
                    })
                }).catch(()=>{});
            }
            // SMS via BMS Ghana (uses BMS_API_KEY + ADMIN_PHONE) - works if you have credits - deferred per your preference
            const bmsKey = env.BMS_API_KEY || env.ARKSEL_API_KEY || "";
            const adminPhone = env.ADMIN_PHONE || env.NOTIFY_PHONE || env.BMS_ADMIN_PHONE || "";
            if (bmsKey && adminPhone) {
                const from = env.BMS_SENDER_ID || "CloudTok";
                const url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${encodeURIComponent(bmsKey)}&to=${encodeURIComponent(adminPhone)}&from=${encodeURIComponent(from)}&sms=${encodeURIComponent(shortMsg)}`;
                // Only send if explicitly enabled - email is priority per your request
                if (env.SMS_ENABLED === "true") await fetch(url).catch(()=>{});
            }
        } catch(e) {}

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
        await env.DB.prepare("UPDATE users SET wallet_balance = COALESCE(wallet_balance,0) - ? WHERE id = ?").bind(req[0].amount, req[0].user_id).run();
        // optional: log transaction
        try { await env.DB.prepare("INSERT INTO transactions (user_id, amount, type, status, reference, created_at) VALUES (?, ?, 'withdrawal', 'completed', ?, datetime('now'))").bind(req[0].user_id, req[0].amount, 'WD-' + id).run(); } catch(e) {}

        return Response.json({ success: true, message: "Withdrawal approved and processed — balance deducted. Please now pay the user manually via " + req[0].method + "." });
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
