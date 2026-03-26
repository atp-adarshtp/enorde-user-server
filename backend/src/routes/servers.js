import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

const JETSTREAM_SERVICE_URL = process.env.JETSTREAM_SERVICE_URL || 'http://localhost:50051';

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const includeShared = req.query.include_shared !== 'false';

    const response = await fetch(`${JETSTREAM_SERVICE_URL}/api/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        include_shared: includeShared
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }

    const data = await response.json();

    res.json({
      success: true,
      servers: data.servers || [],
      total_count: data.total_count || 0,
      owned_count: data.owned_count || 0,
      shared_count: data.shared_count || 0
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.json({
      success: true,
      servers: [],
      total_count: 0,
      owned_count: 0,
      shared_count: 0
    });
  }
});

router.get('/:hostname', async (req, res) => {
  try {
    const { hostname } = req.params;
    const userId = req.userId;

    const response = await fetch(`${JETSTREAM_SERVICE_URL}/api/servers/${hostname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        hostname
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch server');
    }

    const data = await response.json();

    res.json({
      success: true,
      server: data.server
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(404).json({
      success: false,
      message: 'Server not found'
    });
  }
});

export function getMetricsHandler(req, res) {
  return async (req, res) => {
    try {
      const { hostname } = req.params;
      const userId = req.userId;

      const response = await fetch(`${JETSTREAM_SERVICE_URL}/api/metrics/${hostname}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          hostname
        })
      });

      const data = await response.json();

      res.json({
        success: true,
        metric: data.metric
      });
    } catch (error) {
      console.error('Get metrics error:', error);
      res.json({
        success: false,
        message: 'Metrics not found'
      });
    }
  };
}

export function getHistoryHandler(req, res) {
  return async (req, res) => {
    try {
      const { hostname } = req.params;
      const { from, to, limit } = req.query;
      const userId = req.userId;

      const response = await fetch(`${JETSTREAM_SERVICE_URL}/api/metrics/${hostname}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          hostname,
          from_timestamp: parseInt(from) || 0,
          to_timestamp: parseInt(to) || 0,
          limit: parseInt(limit) || 100
        })
      });

      const data = await response.json();

      res.json({
        success: true,
        metrics: data.metrics || [],
        total_count: data.total_count || 0
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.json({
        success: false,
        message: 'History not found'
      });
    }
  };
}

export function getHardwareHandler(req, res) {
  return async (req, res) => {
    try {
      const { hostname } = req.params;
      const userId = req.userId;

      const response = await fetch(`${JETSTREAM_SERVICE_URL}/api/hardware/${hostname}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          hostname
        })
      });

      const data = await response.json();

      if (data.found) {
        res.json({
          success: true,
          hardware: data.hardware
        });
      } else {
        res.json({
          success: false,
          message: data.error_message || 'Hardware info not found'
        });
      }
    } catch (error) {
      console.error('Get hardware error:', error);
      res.json({
        success: false,
        message: 'Hardware info not found'
      });
    }
  };
}

export default router;
