import { authenticate } from "../middleware/auth.js";


export async function getNotifications(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const { results } =
  await env.DB
  .prepare(
    `
    SELECT
      notifications.id,
      notifications.type,
      notifications.message,
      notifications.read,
      notifications.reference_id,
      notifications.reference_type,
      notifications.created_at,
      users.username AS from_username,
      users.display_name AS from_display_name,
      users.avatar AS from_avatar
    FROM notifications
    LEFT JOIN users ON notifications.from_user_id = users.id
    WHERE notifications.user_id = ?
    ORDER BY notifications.created_at DESC
    LIMIT 50
    `
  )
  .bind(auth.user.id)
  .all();


  return Response.json({
    notifications: results
  });

}


export async function markNotificationRead(request, env, notificationId){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  await env.DB
  .prepare(
    `UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`
  )
  .bind(notificationId, auth.user.id)
  .run();


  return Response.json({
    success: true
  });

}


export async function markAllRead(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  await env.DB
  .prepare(
    `UPDATE notifications SET read = 1 WHERE user_id = ?`
  )
  .bind(auth.user.id)
  .run();


  return Response.json({
    success: true
  });

}


export async function clearNotifications(request, env){


  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  await env.DB
  .prepare(
    `DELETE FROM notifications WHERE user_id = ?`
  )
  .bind(auth.user.id)
  .run();


  return Response.json({
    success: true
  });

}


export async function createNotification(env, { userId, fromUserId, type, message, referenceId, referenceType }){


  await env.DB
  .prepare(
    `
    INSERT INTO notifications
      (user_id, from_user_id, type, message, reference_id, reference_type)
    VALUES (?, ?, ?, ?, ?, ?)
    `
  )
  .bind(
    userId,
    fromUserId || null,
    type,
    message,
    referenceId || null,
    referenceType || null
  )
  .run();

}
