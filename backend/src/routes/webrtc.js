import { authenticate } from "../middleware/auth.js";

function jsonResp(data, status) {
    return new Response(JSON.stringify(data), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

async function ensureTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS webrtc_signals (id INTEGER PRIMARY KEY, from_username TEXT NOT NULL, to_username TEXT NOT NULL, signal_type TEXT NOT NULL, signal_data TEXT DEFAULT '{}', created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS live_streams (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, username TEXT NOT NULL, stream_key TEXT UNIQUE NOT NULL, title TEXT DEFAULT 'Live Stream', status TEXT DEFAULT 'active', viewers INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), ended_at TEXT)").run(); } catch(e) {}
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS live_chat (id INTEGER PRIMARY KEY, stream_key TEXT, sender_id INTEGER, sender_username TEXT, text TEXT, to_username TEXT, created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
}

export async function sendSignal(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { to_username, signal_type, signal_data } = body;

    if (!to_username || !signal_type) {
        return jsonResp({ error: "to_username and signal_type required" }, 400);
    }

    const from_username = auth.user.username;

    await env.DB.prepare(
        "INSERT INTO webrtc_signals (from_username, to_username, signal_type, signal_data, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(
        from_username,
        to_username,
        signal_type,
        JSON.stringify(signal_data || {}),
        new Date().toISOString()
    ).run();

    return jsonResp({ success: true });
}

export async function pollSignals(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const after = url.searchParams.get("after") || "0";

    const { results } = await env.DB.prepare(
        "SELECT * FROM webrtc_signals WHERE to_username = ? AND id > ? ORDER BY id ASC LIMIT 50"
    ).bind(auth.user.username, parseInt(after) || 0).all();

    if (results.length > 0) {
        const ids = results.map(r => r.id);
        await env.DB.prepare(
            `DELETE FROM webrtc_signals WHERE id IN (${ids.join(",")})`
        ).run();
    }

    return jsonResp({
        signals: results.map(r => ({
            id: r.id,
            from: r.from_username,
            type: r.signal_type,
            data: JSON.parse(r.signal_data || "{}")
        }))
    });
}

export async function createLiveStream(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    let title = "Live Stream";
    try {
        const body = await request.json();
        if (body && body.title) title = body.title;
    } catch(e) {}

    const streamKey = `live_${auth.user.username}_${Date.now()}`;

    try {
        await env.DB.prepare(
            "INSERT INTO live_streams (user_id, username, stream_key, title, status, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
        ).bind(
            auth.user.id,
            auth.user.username,
            streamKey,
            title,
            "active"
        ).run();
    } catch(e) {
        return jsonResp({ error: "Failed to create stream: " + e.message }, 500);
    }

    return jsonResp({
        success: true,
        stream_key: streamKey,
        stream_url: `live.html?key=${streamKey}`
    });
}

export async function getLiveStreams(request, env) {
    await ensureTables(env);

    try {
        await env.DB.prepare(
            "UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE status = 'active' AND created_at < datetime('now', '-8 hours')"
        ).run();
    } catch(e) {}

    const { results } = await env.DB.prepare(
        "SELECT ls.*, u.username, u.avatar, u.display_name FROM live_streams ls JOIN users u ON ls.user_id = u.id WHERE ls.status = 'active' ORDER BY ls.created_at DESC"
    ).all();

    const seen = new Set();
    const unique = (results || []).filter(s => {
        if(seen.has(s.user_id)) return false;
        seen.add(s.user_id);
        return true;
    });

    return jsonResp({ streams: unique });
}

export async function endLiveStream(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { stream_key } = body;

    if (!stream_key) {
        return jsonResp({ error: "stream_key required" }, 400);
    }

    let updated = false;
    try {
        const result = await env.DB.prepare(
            "UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE stream_key = ? AND user_id = ?"
        ).bind(stream_key, auth.user.id).run();
        updated = result.meta && result.meta.changes > 0;
    } catch(e) {}

    try {
        await env.DB.prepare(
            "UPDATE live_streams SET status = 'ended', ended_at = datetime('now') WHERE status = 'active' AND user_id = ? AND stream_key != ?"
        ).bind(auth.user.id, stream_key).run();
    } catch(e) {}

    try {
        await env.DB.prepare(
            "DELETE FROM webrtc_signals WHERE from_username = ? OR to_username = ?"
        ).bind(auth.user.username, auth.user.username).run();
    } catch(e) {}

    try {
        await env.DB.prepare(
            "DELETE FROM live_chat WHERE stream_key = ?"
        ).bind(stream_key).run();
    } catch(e) {}

    return jsonResp({ success: true, updated: updated });
}

export async function sendLiveChat(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { stream_key, text, to_username } = body;

    if (!stream_key || !text) {
        return jsonResp({ error: "stream_key and text required" }, 400);
    }

    try {
        await env.DB.prepare(
            "CREATE TABLE IF NOT EXISTS live_chat (id INTEGER PRIMARY KEY, stream_key TEXT, sender_id INTEGER, sender_username TEXT, text TEXT, to_username TEXT, created_at TEXT)"
        ).run();
    } catch(e) {}

    await env.DB.prepare(
        "INSERT INTO live_chat (stream_key, sender_id, sender_username, text, to_username, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
        stream_key,
        auth.user.id,
        auth.user.username,
        text,
        to_username || null,
        new Date().toISOString()
    ).run();

    return jsonResp({ success: true });
}

export async function getLiveChat(request, env) {
    await ensureTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const streamKey = url.searchParams.get("stream_key");
    const after = parseInt(url.searchParams.get("after") || "0");

    if (!streamKey) {
        return jsonResp({ error: "stream_key required" }, 400);
    }

    let messages = [];
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM live_chat WHERE stream_key = ? AND id > ? ORDER BY id ASC LIMIT 50"
        ).bind(streamKey, after).all();
        messages = results || [];
    } catch(e) {
        try {
            await env.DB.prepare(
                "CREATE TABLE IF NOT EXISTS live_chat (id INTEGER PRIMARY KEY, stream_key TEXT, sender_id INTEGER, sender_username TEXT, text TEXT, to_username TEXT, created_at TEXT)"
            ).run();
        } catch(e2) {}
    }

    return jsonResp({ messages });
}
