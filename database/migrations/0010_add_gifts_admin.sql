CREATE TABLE IF NOT EXISTS gift_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    gift_name TEXT NOT NULL,
    gift_emoji TEXT DEFAULT '',
    amount_usd REAL NOT NULL,
    stream_id INTEGER,
    conversation_id INTEGER,
    message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER,
    admin_username TEXT DEFAULT '',
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id TEXT DEFAULT '',
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS storage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    provider TEXT DEFAULT '',
    filename TEXT DEFAULT '',
    file_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error_message TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0;
