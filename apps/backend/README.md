# Rentman Backend 🧠

**The Brain of the Rentman Ecosystem**

Enterprise-grade backend service handling payment processing, cryptographic verification, and AI-powered task analysis.

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     RENTMAN BACKEND                          │
│                  (Google Cloud Run)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Stripe     │  │   Supabase   │  │  Vertex AI   │     │
│  │  Payments    │  │   Webhooks   │  │  (Gemini)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  🔐 Cryptographic Signature Verification (NaCl)             │
│  💳 Stripe Connect (Onboarding + Payouts)                   │
│  🤖 AI Safety Analysis (Gemini 2.5 Flash)                   │
│  🔒 Google Cloud Secret Manager Integration                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- Google Cloud SDK (`gcloud`)
- Access to `agent-gen-1` GCP project
- Stripe account (test or live mode)
- Supabase project

### **Local Development**

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your local credentials

# 3. Run tests
npm test

# 4. Start development server
npm run dev
```

Server will start on `http://localhost:8080`

---

## 🔐 **Production Deployment**

### **Step 1: Create Secrets in Google Cloud Secret Manager**

```bash
# Interactive setup
./setup-secrets.ps1 -Create

# Or manually:
gcloud secrets create stripe-secret-key --data-file=- <<< "sk_live_..."
gcloud secrets create webhook-secret --data-file=- <<< "your-random-secret"
gcloud secrets create supabase-service-role-key --data-file=- <<< "eyJ..."
```

### **Step 2: Verify Secrets**

```bash
./setup-secrets.ps1 -Check
```

### **Step 3: Deploy to Cloud Run**

```bash
npm run deploy
```

This will:
1. ✅ Validate all required secrets exist
2. ✅ Build Docker container via Cloud Build
3. ✅ Deploy to Cloud Run with secret injection
4. ✅ Output the service URL

### **Step 4: Configure Supabase Webhook**

**Option A: Using SQL (Recommended)**

1. Open `init-webhook.sql`
2. Replace `__CLOUD_RUN_URL__` with your Cloud Run URL
3. Replace `__WEBHOOK_SECRET__` with your secret value
4. Run in Supabase SQL Editor

**Option B: Using Supabase Dashboard**

1. Go to: Database > Webhooks
2. Create webhook:
   - **Name:** `task_created_webhook`
   - **Table:** `tasks`
   - **Events:** INSERT
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[your-url]/webhooks/tasks`
   - **Headers:**
     ```
     x-webhook-secret: [your-secret]
     Content-Type: application/json
     ```

---

## 📡 **API Endpoints**

### **1. Health Check**
```http
GET /
```
**Response:**
```
Rentman Backend is Active 🧠
```

### **2. Create Payment Intent**
```http
POST /api/create-payment-intent
Content-Type: application/json

{
  "amount": 50,
  "currency": "usd"
}
```

**Use Case:** Dashboard "Buy Credits" feature

### **3. Stripe Connect Onboarding**
```http
POST /api/stripe/onboard
Content-Type: application/json

{
  "userId": "user-123",
  "email": "operator@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Returns:** Stripe Connect onboarding URL

### **4. Transfer/Payout**
```http
POST /api/stripe/transfer
Content-Type: application/json

{
  "amount": 30,
  "destinationAccountId": "acct_abc123"
}
```

**Use Case:** Pay operator after task completion

### **5. Webhook (Task Created)**
```http
POST /webhooks/tasks
x-webhook-secret: your-secret-here
Content-Type: application/json

{
  "type": "INSERT",
  "table": "tasks",
  "record": {
    "id": "task-123",
    "title": "Deliver package",
    "agent_id": "agent-456",
    "signature": "base64-encoded-signature",
    "metadata": { "timestamp": 1234567890, "nonce": "abc123" }
  }
}
```

**Flow:**
1. ✅ Verify webhook secret
2. ✅ Validate NaCl signature
3. ✅ Update task status to `verifying`
4. ✅ Trigger AI analysis (async)
5. ✅ Update task to `matching` or `flagged`

---

## 🧪 **Testing**

### **Unit Tests**

```bash
npm test
```

**Tests:**
- ✅ Valid signature verification
- ✅ Tampered message rejection
- ✅ Wrong public key rejection

### **Manual Testing**

```bash
# Test health endpoint
curl http://localhost:8080

# Test webhook (should return 401)
curl -X POST http://localhost:8080/webhooks/tasks

# Test webhook with secret
curl -X POST http://localhost:8080/webhooks/tasks \
  -H "x-webhook-secret: your-local-secret" \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","table":"tasks","record":{...}}'
```

---

## 🔒 **Security**

### **Secret Management**

| Secret | Storage | Access |
|--------|---------|--------|
| **Local Dev** | `.env` file | Gitignored |
| **Production** | Google Cloud Secret Manager | IAM-controlled |

### **Webhook Security**

- ✅ Header-based authentication (`x-webhook-secret`)
- ✅ Not logged in URLs (unlike query parameters)
- ✅ Validated before processing

### **Cryptographic Verification**

- ✅ Ed25519 signatures (NaCl/TweetNaCl)
- ✅ Public key stored in `agents` table
- ✅ Deterministic message format: `title:agent_id:timestamp:nonce`

---

## 🤖 **AI Analysis**

### **Model Configuration**

- **Model:** Gemini 2.5 Flash
- **Temperature:** 0.4 (deterministic)
- **Max Tokens:** 2048
- **Timeout:** 30 seconds
- **Retry:** 1 automatic retry on failure

### **Analysis Flow**

1. Task created → Webhook triggered
2. Signature verified → Status: `verifying`
3. AI analyzes task for:
   - Safety score (0-100)
   - Viability (legal, achievable)
   - Complexity (low/medium/high)
   - Tags
4. Decision:
   - ✅ `safety_score > 70` → Status: `matching`
   - ❌ `safety_score ≤ 70` → Status: `flagged`
   - ⚠️ AI error → Status: `manual_review`

### **AI Prompt Template**

```
You are the "Rentman Brain", an AI safety analyzer.

Task Title: [title]
Description: [description]
Budget: $[amount]
Type: [task_type]

Respond ONLY with valid JSON:
{
  "viable": true,
  "safety_score": 85,
  "complexity": "medium",
  "reasoning": "Clear task with reasonable budget",
  "tags": ["delivery", "urban"]
}
```

---

## 📊 **Monitoring**

### **Cloud Run Logs**

```bash
# View recent logs
gcloud run logs read rentman-backend --limit=50

# Tail logs
gcloud run logs tail rentman-backend

# Filter errors only
gcloud run logs read rentman-backend --limit=50 | grep ERROR
```

### **Key Metrics**

- Request count
- Average latency
- Error rate
- AI analysis timeout rate
- Signature verification failures

---

## 🛠️ **Troubleshooting**

### **Problem: Server won't start**

**Symptom:**
```
❌ FATAL: Missing required environment variables:
   - STRIPE_SECRET_KEY
```

**Solution:**
```bash
# Local: Create .env file
cp .env.example .env
# Fill in values

# Production: Check secrets
./setup-secrets.ps1 -Check
```

---

### **Problem: Webhook returns 401**

**Symptom:**
```
⛔ Webhook blocked: Invalid or missing x-webhook-secret header
```

**Solution:**
1. Verify header name: `x-webhook-secret` (not `Authorization`)
2. Check secret value matches:
   ```bash
   gcloud secrets versions access latest --secret=webhook-secret
   ```
3. Update Supabase webhook configuration

---

### **Problem: AI analysis stuck**

**Symptom:**
Tasks remain in `verifying` state

**Solution:**
1. Check Cloud Run logs for AI errors
2. Verify Vertex AI API is enabled
3. Check project permissions for Vertex AI
4. Increase timeout if needed (currently 30s)

---

### **Problem: Stripe transfer fails**

**Symptom:**
```
💥 STRIPE TRANSFER FAILED
Error Type: StripeInvalidRequestError
Error Code: account_invalid
```

**Solution:**
1. Verify destination account completed onboarding
2. Check account has `transfers` capability
3. Ensure sufficient balance in platform account

---

## 📚 **Documentation**

- **Production Readiness:** `BACKEND_PRODUCTION_READINESS.md`
- **Webhook SQL:** `init-webhook.sql`
- **Secret Setup:** `setup-secrets.ps1 -h`
- **Deployment:** `deploy.ps1`

---

## 🔧 **Scripts**

| Script | Command | Description |
|--------|---------|-------------|
| **Start** | `npm start` | Run production server |
| **Dev** | `npm run dev` | Run with auto-reload |
| **Test** | `npm test` | Run unit tests |
| **Deploy** | `npm run deploy` | Deploy to Cloud Run |

---

## 🏆 **Production Readiness**

| Category | Status | Grade |
|----------|--------|-------|
| **Security** | ✅ Complete | A |
| **Testing** | ✅ Unit tests | B+ |
| **Monitoring** | ✅ Cloud Logs | A- |
| **Documentation** | ✅ Complete | A |
| **Overall** | ✅ Production Ready | **A-** |

---

## 🤝 **Contributing**

When making changes:

1. ✅ Run tests: `npm test`
2. ✅ Update documentation if needed
3. ✅ Test locally before deploying
4. ✅ Never commit secrets (check `.gitignore`)

---

## 📞 **Support**

**Issues?**
1. Check logs: `gcloud run logs read rentman-backend --limit=50`
2. Verify secrets: `./setup-secrets.ps1 -Check`
3. Test locally: `npm run dev`

**Secrets Management:**
```bash
# Check status
./setup-secrets.ps1 -Check

# Create new secrets
./setup-secrets.ps1 -Create

# Update existing secret
./setup-secrets.ps1 -Update
```

---

**Built with ❤️ for the Rentman Ecosystem**

**Platform:** Google Cloud Run  
**Runtime:** Node.js 18+  
**Security:** Google Cloud Secret Manager  
**AI:** Vertex AI (Gemini 2.5 Flash)  
**Payments:** Stripe Connect  

---

*Last Updated: 2026-02-08*  
*Version: 1.0.0 (Production Ready)*
