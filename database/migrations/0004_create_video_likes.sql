CREATE TABLE IF NOT EXISTS video_likes (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    video_id INTEGER NOT NULL,

    user_id INTEGER NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(video_id)
        REFERENCES videos(id)
        ON DELETE CASCADE,


    FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,


    UNIQUE(video_id,user_id)

);
