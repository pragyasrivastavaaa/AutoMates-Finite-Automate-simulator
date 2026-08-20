const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./automata.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key in production

// Register user
app.post('/api/register', async(req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        db.run(query, [username, email, hashedPassword], function(err) {
            if (err) {
                res.status(400).json({ error: 'Username or email already exists' });
            } else {
                res.json({ user_id: this.lastID, message: 'Registration successful' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async(err, user) => {
        if (err || !user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email } });
    });
});

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.headers.authorization,
        split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Save tool search history
app.post('/api/search-history', authenticate, (req, res) => {
    const { tool_name } = req.body;
    const user_id = req.user.user_id;
    const query = `INSERT INTO search_history (user_id, tool_name) VALUES (?, ?)`;
    db.run(query, [user_id, tool_name], function(err) {
        if (err) {
            res.status(500).json({ error: 'Failed to save search history' });
        } else {
            res.json({ history_id: this.lastID });
        }
    });
});

// Get user’s search history
app.get('/api/search-history', authenticate, (req, res) => {
    const user_id = req.user.user_id;
    db.all(`SELECT tool_name, search_time FROM search_history WHERE user_id = ? ORDER BY search_time DESC`, [user_id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve search history' });
        } else {
            res.json(rows);
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});