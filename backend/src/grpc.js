import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, run } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../proto/enordeagent.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition);
const enordeagent = proto.enordeagent;

const userServiceImpl = {
  validateApiKey: async (call, callback) => {
    const { api_key } = call.request;
    
    try {
      const result = query(
        'SELECT user_id FROM api_keys WHERE api_key = ?',
        [api_key]
      );

      if (result.rows.length > 0) {
        callback(null, {
          valid: true,
          user_id: result.rows[0].user_id,
          error_message: '',
        });
      } else {
        callback(null, {
          valid: false,
          user_id: '',
          error_message: 'Invalid API key',
        });
      }
    } catch (error) {
      console.error('ValidateApiKey error:', error);
      callback(null, {
        valid: false,
        user_id: '',
        error_message: 'Internal error',
      });
    }
  },

  invalidateApiKey: async (call, callback) => {
    const { api_key } = call.request;
    
    try {
      run('DELETE FROM api_keys WHERE api_key = ?', [api_key]);
      callback(null, { success: true });
    } catch (error) {
      console.error('InvalidateApiKey error:', error);
      callback(null, { success: false });
    }
  },

  getUserInfo: async (call, callback) => {
    const { user_id } = call.request;
    
    try {
      const result = query(
        'SELECT id, username, email FROM users WHERE id = ?',
        [user_id]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        callback(null, {
          found: true,
          user_id: user.id,
          username: user.username,
          email: user.email,
        });
      } else {
        callback(null, {
          found: false,
          user_id: '',
          username: '',
          email: '',
        });
      }
    } catch (error) {
      console.error('GetUserInfo error:', error);
      callback(null, {
        found: false,
        user_id: '',
        username: '',
        email: '',
      });
    }
  },
};

export function startGrpcServer() {
  const GRPC_PORT = process.env.GRPC_PORT || 50052;
  
  const server = new grpc.Server();
  server.addService(enordeagent.UserService.service, userServiceImpl);
  
  server.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('Failed to bind gRPC server:', err);
      return;
    }
    console.log(`gRPC UserService listening on port ${port}`);
  });
}
