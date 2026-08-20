const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./automata.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create Users table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create SearchHistory table
db.run(`
  CREATE TABLE IF NOT EXISTS search_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tool_name TEXT NOT NULL,
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id)
  )
`, (err) => {
    if (err) {
        console.error('Error creating tables:', err.message);
    } else {
        console.log('Database tables created successfully.');
    }
    db.close();
});