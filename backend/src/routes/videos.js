import { authenticate } from "../middleware/auth.js";
import StorageRouter from "../cloud/storage/router.js";


export async function getVideos(request, env) {

  const { results } = await env.DB
    .prepare(
      `
      SELECT
        videos.id,
        videos.video_url,
        videos.thumbnail_url,
        videos.caption,
        videos.views,
        videos.likes,
        videos.comments,
        videos.created_at,

        users.id AS user_id,
        users.username,
        users.avatar

      FROM videos

      JOIN users
      ON videos.user_id = users.id

      ORDER BY videos.created_at DESC
      `
    )
    .all();

  return Response.json({
    videos: results
  });

}



export async function createVideo(request, env) {

  const auth =
    await authenticate(request, env);

  if (auth.error) {
    return auth.error;
  }

  const form =

await request.formData();


const file =

form.get("file");


const caption =

form.get("caption") || "";


const thumbnail =

form.get("thumbnail");


  if (!file) {

    return Response.json(
      {
        error: "Video file required"
      },
      {
        status: 400
      }
    );

  }


  const uploadResult =

await StorageRouter.upload(
    file,
    {
        type: "video",
        userId: auth.user.id,
        env
    }
);


  if (!uploadResult.success) {

    return Response.json(
      {
        error: "Video upload failed",
        details: uploadResult
      },
      {
        status: 500
      }
    );

  }


  const video_url =
    uploadResult.url;


  const thumbnail_url =
    thumbnail || null;


  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO videos
        (
          user_id,
          video_url,
          thumbnail_url,
          caption
        )

        VALUES (?, ?, ?, ?)
        `
      )
      .bind(
        auth.user.id,
        video_url,
        thumbnail_url,
        caption || ""
      )
      .run();


  return Response.json({

    success: true,

    videoId: result.meta.last_row_id

  });

}