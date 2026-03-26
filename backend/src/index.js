import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { startGrpcServer } from './grpc.js';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/apiKeys.js';
import serversRoutes from './routes/servers.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server_id: process.env.SERVER_ID || 'unknown',
    version: '1.0.0',
    timestamp: Math.floor(Date.now() / 1000)
  });
});

app.use('/api', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/servers', serversRoutes);

app.get('/api/metrics/:hostname', serversRoutes);
app.get('/api/metrics/:hostname/history', serversRoutes);
app.get('/api/hardware/:hostname', serversRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized');
    
    startGrpcServer();
    
    app.listen(PORT, () => {
      console.log(`Enorde User Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
