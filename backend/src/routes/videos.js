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
        videos.tags,
        videos.category,
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

  const auth = await authenticate(request, env);
  let likedIds = [];
  let savedIds = [];
  if (!auth.error && auth.user) {
    const { results: likes } = await env.DB
      .prepare("SELECT video_id FROM video_likes WHERE user_id = ?")
      .bind(auth.user.id)
      .all();
    likedIds = likes.map(l => l.video_id);

    const { results: saves } = await env.DB
      .prepare("SELECT video_id FROM video_saves WHERE user_id = ?")
      .bind(auth.user.id)
      .all();
    savedIds = saves.map(s => s.video_id);
  }

  const videos = results.map(v => ({
    ...v,
    liked: likedIds.includes(v.id),
    saved: savedIds.includes(v.id)
  }));

  return Response.json({
    videos
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

const tags =

form.get("tags") || "[]";

const category =

form.get("category") || "General";


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
        role: "video",
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


  let thumbnail_url = null;


if(thumbnail){

    const thumbnailResult =
    await StorageRouter.upload(
        thumbnail,
        {
            role:"thumbnail",
            userId: auth.user.id,
            env
        }
    );


    if(thumbnailResult.success){

        thumbnail_url =
        thumbnailResult.url;

    }

}


  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO videos
        (
          user_id,
          video_url,
          thumbnail_url,
          caption,
          tags,
          category
        )

        VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        auth.user.id,
        video_url,
        thumbnail_url,
        caption || "",
        tags,
        category
      )
      .run();


  return Response.json({

    success: true,

    videoId: result.meta.last_row_id,

    videoUrl: video_url

});

}


export async function incrementViews(request, env, videoId) {

  await env.DB.prepare(
    "UPDATE videos SET views = views + 1 WHERE id = ?"
  ).bind(videoId).run();

  return Response.json({ success: true });

}