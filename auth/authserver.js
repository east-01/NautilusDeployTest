const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = 8920;
const JWT_SECRET = 'your_secret_key'; // Use a secure secret key in production
const JWT_REFRESH_SECRET = 'your_refresh_secret_key'; // Use a secure refresh secret key in production

// SQL Server configuration
const sqlConfig = {
    user: 'authagent',
    password: 'AuthenticatorIBarelyKnowHer490',
    server: 'localhost', // e.g., localhost
    database: 'AuthDB',
    options: {
        encrypt: true, // Use true if you're on Windows Azure
        trustServerCertificate: true // Change to false for production
    }
};

// Register Endpoint
app.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Connect to the database
        const pool = await sql.connect(sqlConfig);

        // Check if user exists
        const userExists = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT 1 FROM Users WHERE username = @username');

        if (userExists.recordset.length > 0) {
            return res.status(400).send('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .query('INSERT INTO Users (username, password) VALUES (@username, @password)');

        res.status(201).send('User registered');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login Endpoint
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Connect to the database
        const pool = await sql.connect(sqlConfig);

        // Find user
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT id, password, uid FROM Users WHERE username = @username');

        if (result.recordset.length === 0) {
            return res.status(400).send('Invalid credentials');
        }

        const user = result.recordset[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        // Generate tokens
        const token = jwt.sign({ uid: user.uid, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = uuidv4();

        // Store refresh token
        await pool.request()
            .input('uid', sql.NVarChar, user.uid)
            .input('refreshToken', sql.NVarChar, refreshToken)
            .query('INSERT INTO RefreshTokens (uid, token) VALUES (@uid, @refreshToken)');

        res.json({ uid: user.uid, token, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Token Refresh Endpoint
app.post('/auth/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).send('Refresh token required');
    }

    console.log(`refresh token ${refreshToken} arrived`)

    try {
        // Connect to the database
        const pool = await sql.connect(sqlConfig);

        // Find refresh token
        const result = await pool.request()
            .input('refreshToken', sql.NVarChar, refreshToken)
            .query('SELECT uid FROM RefreshTokens WHERE token = @refreshToken');

        if (result.recordset.length === 0) {
            return res.status(400).send('Invalid refresh token');
        }

        const user = result.recordset[0];

        // Generate new tokens
        const newToken = jwt.sign({ uid: user.uid }, JWT_SECRET, { expiresIn: '1h' });
        const newRefreshToken = uuidv4();

        // Replace old refresh token with new one
        await pool.request()
            .input('uid', sql.NVarChar, user.uid)
            .input('oldRefreshToken', sql.NVarChar, refreshToken)
            .input('newRefreshToken', sql.NVarChar, newRefreshToken)
            .query('UPDATE RefreshTokens SET token = @newRefreshToken WHERE uid = @uid AND token = @oldRefreshToken');

        res.json({ uid: user.uid, token: newToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Verify Token Endpoint
app.post('/auth/verify', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).send('Access denied: No token provided.');
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        console.log(verified);
        res.status(200).send('Verified');
    } catch (err) {
        res.status(400).send('Invalid token');
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
