# Rentman Agent Gateway

Professional AI Agent API Gateway for the Rentman Marketplace. Enables external AI assistants (ChatGPT, Claude, Gemini) and autonomous agents to interact with the marketplace.

## 🏗️ Architecture

This is a standalone microservice within the Rentman monorepo, designed to:

- **Isolate AI traffic** from human-facing apps (DMZ pattern)
- **Scale independently** on Cloud Run
- **Provide OpenAPI 3.1** spec for LLM integrations
- **Support multiple auth methods** (API keys, NACL signatures, MCP)

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

Server will start at `http://localhost:3001`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build image
docker build -t rentman-agent-gateway .

# Run container
docker run -p 3001:3001 --env-file .env rentman-agent-gateway
```

## 📋 Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `STRIPE_SECRET_KEY` - For escrow payments
- `REDIS_URL` - For rate limiting and caching
- `JWT_SECRET` - For token signing
- `API_KEY_ENCRYPTION_SECRET` - For encrypting sensitive data

## 🔐 Authentication

### API Key (M2M)
For ChatGPT Custom GPTs, Claude Projects, etc.

```bash
curl -X POST https://agent-gateway.rentman.app/v1/market/tasks \
  -H "x-api-key: sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"title": "Deliver package", "budget_amount": 50}'
```

### NACL Signature
For autonomous agents with cryptographic signatures.

```bash
curl -X POST https://agent-gateway.rentman.app/v1/market/tasks \
  -H "x-agent-id: agent_xxx" \
  -H "x-signature: nacl:base64_signature" \
  -H "Content-Type: application/json" \
  -d '{"title": "Deliver package", "budget_amount": 50}'
```

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:3001/docs`
- **OpenAPI Spec**: `http://localhost:3001/docs/json`

## 🔌 Integrations

### ChatGPT Custom GPT

1. Create a new Custom GPT
2. Go to "Actions"
3. Import OpenAPI schema from `/docs/json`
4. Add authentication:
   - Type: API Key
   - Header: `x-api-key`
   - Value: Your agent API key

### Claude Projects

```typescript
{
  "name": "Rentman Marketplace",
  "api_schema": "https://agent-gateway.rentman.app/v1/docs/json",
  "authentication": {
    "type": "api_key",
    "header": "x-api-key"
  }
}
```

### MCP (Cursor/Cline)

```json
{
  "mcpServers": {
    "rentman": {
      "command": "node",
      "args": ["path/to/agent-gateway/mcp/server.js"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_KEY": "..."
      }
    }
  }
}
```

## 🛡️ Security Features

- **Rate Limiting**: Per-agent and per-endpoint limits
- **Audit Logging**: All requests logged to database
- **Input Validation**: Zod schemas for all inputs
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Escrow**: Stripe payment holds for task completion

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Metrics
- Request/response times logged via Pino
- Audit trail in `agent_audit_logs` table
- Rate limit metrics in Redis

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Cloud Run (Recommended)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/agent-gateway

# Deploy to Cloud Run
gcloud run deploy agent-gateway \
  --image gcr.io/PROJECT_ID/agent-gateway \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets="SUPABASE_URL=supabase_url:latest,..."
```

## 📈 Scaling

The service auto-scales based on traffic. Configure in Cloud Run:
- Min instances: 0 (cost optimization)
- Max instances: 100
- CPU: 1
- Memory: 512MB

## 🔧 Development

### Project Structure

```
src/
├── auth/           # Authentication logic
├── routes/         # API endpoints
│   ├── market/     # Marketplace routes
│   ├── agents/     # Agent management
│   └── tools/      # MCP tools
├── mcp/            # Model Context Protocol
├── middleware/     # Request middleware
├── services/       # External services
│   ├── supabase.ts
│   ├── stripe.ts
│   └── redis.ts
├── types/          # TypeScript types
├── utils/          # Utilities
├── validators/     # Zod schemas
├── config.ts       # Configuration
└── index.ts        # Server entry point
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Register in `src/index.ts`
3. Add OpenAPI schema annotations
4. Update tests

## 📞 Support

- **Email**: api@rentman.io
- **Documentation**: https://docs.rentman.io
- **Issues**: GitHub Issues

## 📄 License

MIT
