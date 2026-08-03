import { authenticate } from "../middleware/auth.js";

export async function sendSignal(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { to_username, signal_type, signal_data } = body;

    if (!to_username || !signal_type) {
        return Response.json({ error: "to_username and signal_type required" }, { status: 400 });
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

    return Response.json({ success: true });
}

export async function pollSignals(request, env) {
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

    return Response.json({
        signals: results.map(r => ({
            id: r.id,
            from: r.from_username,
            type: r.signal_type,
            data: JSON.parse(r.signal_data || "{}")
        }))
    });
}

export async function createLiveStream(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { title } = body;

    const streamKey = `live_${auth.user.username}_${Date.now()}`;

    await env.DB.prepare(
        "INSERT INTO live_streams (user_id, username, stream_key, title, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
        auth.user.id,
        auth.user.username,
        streamKey,
        title || "Live Stream",
        "active",
        new Date().toISOString()
    ).run();

    return Response.json({
        success: true,
        stream_key: streamKey,
        stream_url: `live.html?key=${streamKey}`
    });
}

export async function getLiveStreams(request, env) {
    const { results } = await env.DB.prepare(
        "SELECT ls.*, u.username, u.avatar, u.display_name FROM live_streams ls JOIN users u ON ls.user_id = u.id WHERE ls.status = 'active' ORDER BY ls.created_at DESC"
    ).all();

    const cutoff = Date.now() - 5 * 60 * 1000;
    const active = results.filter(s => {
        const created = new Date(s.created_at).getTime();
        return created > cutoff;
    });

    const seen = new Set();
    const unique = active.filter(s => {
        if(seen.has(s.user_id)) return false;
        seen.add(s.user_id);
        return true;
    });

    return Response.json({ streams: unique });
}

export async function endLiveStream(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { stream_key } = body;

    await env.DB.prepare(
        "UPDATE live_streams SET status = 'ended' WHERE stream_key = ? AND user_id = ?"
    ).bind(stream_key, auth.user.id).run();

    return Response.json({ success: true });
}
