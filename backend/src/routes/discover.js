export async function getTrending(request, env) {
    const url = new URL(request.url);
    const category = (url.searchParams.get("category") || "").trim();
    const limit = parseInt(url.searchParams.get("limit") || "30", 10);

    let query = `
        SELECT
            videos.id,
            videos.video_url,
            videos.thumbnail_url,
            videos.caption,
            videos.views,
            videos.likes,
            videos.comments,
            videos.tags,
            videos.category,
            videos.created_at,
            users.id AS user_id,
            users.username,
            users.avatar
        FROM videos
        JOIN users ON videos.user_id = users.id
    `;

    const params = [];

    if (category) {
        query += ` WHERE LOWER(videos.category) = LOWER(?) OR LOWER(videos.caption) LIKE LOWER(?) OR LOWER(videos.tags) LIKE LOWER(?)`;
        params.push(category, `%${category}%`, `%${category}%`);
    }

    query += `
        ORDER BY
            (videos.likes * 10 + videos.comments * 8 + videos.views * 5) DESC,
            videos.created_at DESC
        LIMIT ?
    `;
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return Response.json({ videos: results });
}

export async function getDiscoverVideos(request, env) {
    const url = new URL(request.url);
    const category = (url.searchParams.get("category") || "").trim();
    const limit = parseInt(url.searchParams.get("limit") || "30", 10);

    let query = `
        SELECT
            videos.id,
            videos.video_url,
            videos.thumbnail_url,
            videos.caption,
            videos.views,
            videos.likes,
            videos.comments,
            videos.tags,
            videos.category,
            videos.created_at,
            users.id AS user_id,
            users.username,
            users.avatar
        FROM videos
        JOIN users ON videos.user_id = users.id
    `;

    const params = [];

    if (category && category.toLowerCase() !== "all") {
        query += ` WHERE LOWER(videos.category) = LOWER(?) OR LOWER(videos.caption) LIKE LOWER(?) OR LOWER(videos.tags) LIKE LOWER(?)`;
        params.push(category, `%${category}%`, `%${category}%`);
    }

    query += `
        ORDER BY
            (videos.likes * 10 + videos.comments * 8 + videos.views * 5) DESC,
            videos.created_at DESC
        LIMIT ?
    `;
    params.push(limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return Response.json({ videos: results });
}
