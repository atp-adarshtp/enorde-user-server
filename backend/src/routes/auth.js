import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query, run } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and email are required'
      });
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = Math.floor(Date.now() / 1000);

    await run(
      'INSERT INTO users (id, username, password_hash, email, created_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, username, passwordHash, email, createdAt]
    );

    const token = generateToken(userId);

    res.json({
      success: true,
      token,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const result = await query(
      'SELECT id, password_hash FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
