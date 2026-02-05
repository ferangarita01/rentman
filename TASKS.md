# RENTMAN - Platform Development Tasks

## Phase 1: Foundation & Database Schema
- [ ] Create Supabase project for Rentman
- [ ] Design and implement core database schema
  - [ ] `agents` table (AI/Robot clients)
  - [ ] `humans` table (service providers)
  - [ ] `tasks` table (job listings)
  - [ ] `task_assignments` table
  - [ ] `reviews` table (bidirectional ratings)
  - [ ] `payments` table (escrow system)
  - [ ] `agent_api_keys` table (M2M authentication)
- [ ] Configure Row Level Security (RLS) policies
- [ ] Set up realtime subscriptions

## Phase 2: M2M API for Agents (API-First)
- [ ] Design OpenAPI specification
- [ ] Implement Edge Functions for agent API
  - [ ] `POST /api/v1/auth/register` - Agent registration
  - [ ] `POST /api/v1/auth/token` - API key generation
  - [ ] `POST /api/v1/tasks` - Create task request
  - [ ] `GET /api/v1/tasks` - List agent's tasks
  - [ ] `GET /api/v1/tasks/:id` - Get task status
  - [ ] `POST /api/v1/tasks/:id/accept` - Accept human offer
  - [ ] `POST /api/v1/tasks/:id/complete` - Mark as complete
  - [ ] `POST /api/v1/tasks/:id/review` - Submit review
- [ ] Implement WebSocket endpoint for real-time updates
- [ ] Add rate limiting and usage tracking
- [ ] Create API documentation (machine-readable)

## Phase 3: Human Mobile App (React Native)
- [ ] Initialize Expo project
- [ ] Implement authentication (Supabase Auth)
- [ ] Create main screens
  - [ ] Onboarding flow
  - [ ] Dashboard with available tasks
  - [ ] Task detail view
  - [ ] Active tasks management
  - [ ] Profile & skills editor
  - [ ] Earnings dashboard
  - [ ] Rating history
- [ ] Push notifications for new tasks
- [ ] Location-based task matching
- [ ] In-app messaging with agents

## Phase 4: Admin Dashboard
- [ ] Initialize Next.js project
- [ ] Platform analytics
- [ ] User/agent management
- [ ] Dispute resolution interface
- [ ] Payment management

## Phase 5: Testing & Deployment
- [ ] Unit tests for Edge Functions
- [ ] Integration tests for API flows
- [ ] Load testing for M2M endpoints
- [ ] Security audit
- [ ] Deploy to production
