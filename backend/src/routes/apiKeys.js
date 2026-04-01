import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, run } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
    }

    const apiKeyId = uuidv4();
    const apiKey = uuidv4();
    const createdAt = Math.floor(Date.now() / 1000);

    await run(
      'INSERT INTO api_keys (id, user_id, api_key, name, created_at) VALUES ($1, $2, $3, $4, $5)',
      [apiKeyId, userId, apiKey, name, createdAt]
    );

    res.json({
      success: true,
      api_key: apiKey,
      message: 'API key created successfully'
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create API key'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      'SELECT id, name, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      api_keys: result.rows
    });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list API keys'
    });
  }
});

router.post('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.userId;

    const result = await run(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2',
      [keyId, userId]
    );

    if (result.rowsAffected === 0) {
      return res.json({
        success: false,
        message: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key deleted'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API key'
    });
  }
});

router.get('/installer-info', async (req, res) => {
  try {
    const natsServer = process.env.NATS_SERVER || 'nats.enorde.com:4222';
    const installerUrl = process.env.INSTALLER_URL || 'https://enorde.com/install-agent.sh';

    res.json({
      success: true,
      natsServer,
      installerUrl,
      installerTemplate: `curl -sSL ${installerUrl} | API_KEY={api_key} bash -`
    });
  } catch (error) {
    console.error('Get installer info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get installer info'
    });
  }
});

export default router;
