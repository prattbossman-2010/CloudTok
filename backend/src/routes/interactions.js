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