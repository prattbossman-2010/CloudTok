CREATE TABLE IF NOT EXISTS videos (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    video_url TEXT NOT NULL,

    thumbnail_url TEXT DEFAULT NULL,

    caption TEXT DEFAULT '',

    views INTEGER DEFAULT 0,

    likes INTEGER DEFAULT 0,

    comments INTEGER DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)

);
