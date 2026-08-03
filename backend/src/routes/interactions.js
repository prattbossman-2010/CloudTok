import { authenticate } from "../middleware/auth.js";


export async function toggleLike(request, env, videoId){

    const auth =
    await authenticate(request, env);


    if(auth.error){

        return auth.error;

    }


    const userId =
    auth.user.id;



    const existing =
    await env.DB
    .prepare(
        `
        SELECT id
        FROM video_likes
        WHERE video_id = ?
        AND user_id = ?
        `
    )
    .bind(
        videoId,
        userId
    )
    .first();



    if(existing){


        await env.DB
        .prepare(
            `
            DELETE FROM video_likes
            WHERE id = ?
            `
        )
        .bind(
            existing.id
        )
        .run();



        await env.DB
        .prepare(
            `
            UPDATE videos
            SET likes = MAX(likes - 1, 0)
            WHERE id = ?
            `
        )
        .bind(videoId)
        .run();



        return Response.json({

            success:true,

            liked:false

        });


    }



    await env.DB
    .prepare(
        `
        INSERT INTO video_likes
        (
            video_id,
            user_id
        )
        VALUES (?,?)
        `
    )
    .bind(
        videoId,
        userId
    )
    .run();



    await env.DB
    .prepare(
        `
        UPDATE videos
        SET likes = likes + 1
        WHERE id = ?
        `
    )
    .bind(videoId)
    .run();



    return Response.json({

        success:true,

        liked:true

    });


}


export async function getLikedVideos(request, env){

    const auth = await authenticate(request, env);
    if(auth.error){
        return auth.error;
    }

    const { results } = await env.DB
        .prepare(`
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
                users.username,
                users.avatar
            FROM video_likes
            JOIN videos ON video_likes.video_id = videos.id
            JOIN users ON videos.user_id = users.id
            WHERE video_likes.user_id = ?
            ORDER BY video_likes.id DESC
        `)
        .bind(auth.user.id)
        .all();

    const likedIds = results.map(v => v.id);
    const videos = results.map(v => ({
        ...v,
        liked: true,
        saved: false
    }));

    return Response.json({ videos });
}