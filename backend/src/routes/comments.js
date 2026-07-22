import { authenticate } from "../middleware/auth.js";

export async function getComments(request, env, videoId) {

    const { results } = await env.DB
        .prepare(`
            SELECT
                video_comments.id,
                video_comments.comment,
                video_comments.created_at,
                users.username,
                users.avatar
            FROM video_comments
            JOIN users
            ON video_comments.user_id = users.id
            WHERE video_comments.video_id = ?
            ORDER BY video_comments.created_at ASC
        `)
        .bind(videoId)
        .all();

    return Response.json({
        comments: results
    });

}

export async function addComment(request, env, videoId) {

    const auth = await authenticate(request, env);

    if (auth.error) {
        return auth.error;
    }

    const body = await request.json();

    const comment = (body.comment || "").trim();

    if (!comment) {

        return Response.json(
            {
                error: "Comment cannot be empty"
            },
            {
                status: 400
            }
        );

    }

    await env.DB
        .prepare(`
            INSERT INTO video_comments
            (
                video_id,
                user_id,
                comment
            )
            VALUES (?, ?, ?)
        `)
        .bind(
            videoId,
            auth.user.id,
            comment
        )
        .run();

    await env.DB
        .prepare(`
            UPDATE videos
            SET comments = comments + 1
            WHERE id = ?
        `)
        .bind(videoId)
        .run();

    return Response.json({
        success: true
    });

}