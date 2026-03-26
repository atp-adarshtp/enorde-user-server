# Enorde User Server & Frontend

A comprehensive web dashboard and REST API server built with **Node.js** (Express) for the backend and **React** (Vite) for the frontend. Provides user management, authentication, API key management, and real-time visualization of server metrics.

## Features

- **User Authentication**: Registration and login with JWT tokens
- **API Key Management**: Create and manage API keys for client agents
- **One-Line Agent Installation**: Generate installation command directly from dashboard
- **React Dashboard**: Modern, responsive web UI with real-time updates
- **Server Management**: View and manage all registered servers
- **Metrics Visualization**: Real-time and historical metrics display
- **Hardware Inventory**: Complete hardware information for each server
- **Server Sharing**: Share servers with other users (read/write permissions)
- **RESTful API**: Full API for programmatic access
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Web Browser                               │
│                   (React Frontend - Vite)                       │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTP/HTTPS
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                 Node.js Backend (Express)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Auth API    │  │  API Keys    │  │  Servers API         │ │
│  │  (JWT)       │  │  Routes      │  │  (Metrics/Hardware)  │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database (pg)                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTP/gRPC
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                  Enorde Client Server                           │
│                                                                 │
│  - API Key Validation                                           │
│  - JetStream Consumer                                           │
│  - Metrics Storage                                              │
└────────────────────────────────────────────────────────────────┘
                             │
                             │ NATS JetStream
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                  Client Agents                                  │
│              (Running on monitored servers)                     │
└────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
# Using Docker
docker run -d \
  --name enorde-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=enorde \
  -e POSTGRES_PASSWORD=enorde \
  -e POSTGRES_DB=users \
  postgres:15
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

Example `.env`:
```bash
PORT=3000
DATABASE_URL=postgres://enorde:enorde@localhost:5432/users
JWT_SECRET=your-secure-secret-key
JWT_EXPIRATION_HOURS=24
JETSTREAM_SERVICE_URL=http://localhost:50051
NATS_SERVER=permanent-nats.enorde.com:4222
```

### 4. Start the Backend

```bash
cd backend
npm run dev
```

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

### 6. Access the Dashboard

Open your browser to `http://localhost:5173` and:

1. Register a new user account
2. Login with your credentials
3. Navigate to "API Keys" to generate an API key
4. Copy the one-line installation command and run it on your server

## Adding a New Server

When you add a server to monitor:

1. **Create an API Key**: Go to API Keys section and create a new key
2. **Copy Installer Command**: After creating the key, you'll see a one-line installation command
3. **Run on Target Server**: Execute the command on the server you want to monitor
4. **View in Dashboard**: The server will automatically appear in your dashboard within seconds

Example installer command:
```bash
curl -sSL https://enorde.com/install-agent.sh | API_KEY=your-api-key-here bash -
```

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgres://enorde:enorde@localhost:5432/users` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key-change-this-in-production` |
| `JWT_EXPIRATION_HOURS` | Token expiration in hours | `24` |
| `JETSTREAM_SERVICE_URL` | Client server URL | `http://localhost:50051` |
| `NATS_SERVER` | Permanent NATS server for installer | `localhost:4222` |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/api/login` | Login and get JWT token |
| GET | `/api/me` | Get current user info |

### API Keys (requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/api-keys` | Create a new API key |
| GET | `/api/api-keys` | List all API keys |
| GET | `/api/api-keys/installer-info` | Get installer configuration |
| POST | `/api/api-keys/:keyId` | Delete an API key |

### Servers (requires JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/servers` | List all registered servers |
| GET | `/api/servers/:hostname` | Get server details |
| GET | `/api/metrics/:hostname` | Get latest metrics |
| GET | `/api/metrics/:hostname/history` | Get historical metrics |
| GET | `/api/hardware/:hostname` | Get hardware inventory |
| POST | `/api/servers/:serverId/share` | Share server with another user |
| POST | `/api/servers/:serverId/revoke` | Revoke server share |
| GET | `/api/servers/shared` | Get shared servers |

### Example API Usage

```bash
# Register a new user
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"secret"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secret"}'

# Create an API key (use token from login)
curl -X POST http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"production-server"}'

# Get installer info
curl http://localhost:3000/api/api-keys/installer-info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get servers
curl http://localhost:3000/api/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://enorde:enorde@postgres:5432/users
      - JWT_SECRET=your-secure-secret
      - JETSTREAM_SERVICE_URL=http://client-server:50051
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=enorde
      - POSTGRES_PASSWORD=enorde
      - POSTGRES_DB=users
    volumes:
      - postgres_data:/var/lib/postgresql/data

  client-server:
    image: enorde-client-server:latest
    ports:
      - "50051:50051"
    environment:
      - DATABASE_URL=postgres://enorde:enorde@postgres:5432/users
      - NATS_URL=nats://nats:4222
      - GRPC_BIND_ADDRESS=0.0.0.0:50051
      - USER_SERVICE_URL=http://backend:3000
    depends_on:
      - postgres
      - nats

  nats:
    image: nats:latest
    command: -js
    ports:
      - "4222:4222"

volumes:
  postgres_data:
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Frontend build
cd frontend
npm run build
# Output will be in frontend/dist/
```

### Code Formatting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## Security Considerations

1. **Change JWT Secret**: Always set a strong `JWT_SECRET` in production
2. **Use HTTPS**: Always use HTTPS in production with a reverse proxy
3. **Secure Database**: Use authentication and restrict network access
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints
5. **Input Validation**: All inputs are validated server-side

## Project Structure

```
enorde-user-server-frontend/
├── backend/                    # Node.js Express Backend
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js    # PostgreSQL connection & queries
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js        # Register, login endpoints
│   │   │   ├── apiKeys.js     # API key management
│   │   │   └── servers.js     # Servers, metrics, hardware
│   │   └── index.js           # Server entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/                  # React Frontend (Vite)
    ├── src/
    │   ├── components/
    │   │   ├── ApiKeysModal.jsx
    │   │   ├── HardwareModal.jsx
    │   │   ├── ServerCard.jsx
    │   │   └── Modal.css
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── LoginPage.css
    │   │   ├── DashboardPage.jsx
    │   │   └── DashboardPage.css
    │   ├── services/
    │   │   └── api.js         # API service layer
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please visit:
https://github.com/henricktom/enorde-user-server-frontend/issues
