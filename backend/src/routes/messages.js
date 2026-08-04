import { authenticate } from "../middleware/auth.js";
import { createNotification } from "./notifications.js";

async function ensureMsgTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY, user1_id INTEGER, user2_id INTEGER, last_message TEXT, last_message_at TEXT)").run(); } catch(e) {}
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, conversation_id INTEGER, sender_id INTEGER, text TEXT, read INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
}

async function getOrCreateConversation(env, user1Id, user2Id){


  const smaller = Math.min(user1Id, user2Id);
  const larger = Math.max(user1Id, user2Id);


  let conversation =
  await env.DB
  .prepare(
    `SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?`
  )
  .bind(smaller, larger)
  .first();


  if(!conversation){

    const result =
    await env.DB
    .prepare(
      `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`
    )
    .bind(smaller, larger)
    .run();

    conversation = {
      id: result.meta.last_row_id,
      user1_id: smaller,
      user2_id: larger
    };

  }


  return conversation;

}


export async function getConversations(request, env){
  await ensureMsgTables(env);

  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const userId = auth.user.id;


  const { results } =
  await env.DB
  .prepare(
    `
    SELECT
      conversations.id,
      conversations.last_message,
      conversations.last_message_at,
      CASE
        WHEN conversations.user1_id = ? THEN users2.id
        ELSE users1.id
      END AS other_user_id,
      CASE
        WHEN conversations.user1_id = ? THEN users2.username
        ELSE users1.username
      END AS other_username,
      CASE
        WHEN conversations.user1_id = ? THEN users2.display_name
        ELSE users1.display_name
      END AS other_display_name,
      CASE
        WHEN conversations.user1_id = ? THEN users2.avatar
        ELSE users1.avatar
      END AS other_avatar
    FROM conversations
    JOIN users AS users1 ON conversations.user1_id = users1.id
    JOIN users AS users2 ON conversations.user2_id = users2.id
    WHERE conversations.user1_id = ? OR conversations.user2_id = ?
    ORDER BY conversations.last_message_at DESC
    `
  )
  .bind(
    userId, userId, userId, userId, userId, userId
  )
  .all();


  return Response.json({
    conversations: results
  });

}


export async function getMessages(request, env, otherUsername){
  await ensureMsgTables(env);

  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const otherUser =
  await env.DB
  .prepare(
    `SELECT id FROM users WHERE username = ?`
  )
  .bind(otherUsername)
  .first();


  if(!otherUser){
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }


  const conversation =
  await getOrCreateConversation(
    env,
    auth.user.id,
    otherUser.id
  );


  const { results } =
  await env.DB
  .prepare(
    `
    SELECT
      messages.id,
      messages.sender_id,
      messages.text,
      messages.read,
      messages.created_at,
      users.username AS sender_username
    FROM messages
    JOIN users ON messages.sender_id = users.id
    WHERE messages.conversation_id = ?
    ORDER BY messages.created_at ASC
    `
  )
  .bind(conversation.id)
  .all();


  await env.DB
  .prepare(
    `UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ? AND read = 0`
  )
  .bind(conversation.id, auth.user.id)
  .run();


  return Response.json({
    messages: results
  });

}


export async function sendMessage(request, env, otherUsername){
  await ensureMsgTables(env);

  const auth = await authenticate(request, env);

  if(auth.error){
    return auth.error;
  }


  const body = await request.json();
  const text = (body.text || "").trim();

  if(!text){
    return Response.json(
      { error: "Message cannot be empty" },
      { status: 400 }
    );
  }


  const otherUser =
  await env.DB
  .prepare(
    `SELECT id, username FROM users WHERE username = ?`
  )
  .bind(otherUsername)
  .first();


  if(!otherUser){
    return Response.json(
      { error: "User not found" },
      { status: 404 }
    );
  }


  const conversation =
  await getOrCreateConversation(
    env,
    auth.user.id,
    otherUser.id
  );


  const result =
  await env.DB
  .prepare(
    `
    INSERT INTO messages (conversation_id, sender_id, text)
    VALUES (?, ?, ?)
    `
  )
  .bind(
    conversation.id,
    auth.user.id,
    text
  )
  .run();


  await env.DB
  .prepare(
    `
    UPDATE conversations
    SET last_message = ?, last_message_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
  )
  .bind(text, conversation.id)
  .run();


  await createNotification(env, {
    userId: otherUser.id,
    fromUserId: auth.user.id,
    type: "message",
    message: `New message from ${auth.user.username}`,
    referenceId: result.meta.last_row_id,
    referenceType: "message"
  });


  return Response.json({
    success: true,
    messageId: result.meta.last_row_id
  });

}
