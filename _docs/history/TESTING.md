# 🧪 Testing Guide - Rentman v1

## Pre-Deployment Testing (Local)

### Test 1: CLI Login
```bash
cd rentman-cli
node bin/rentman.js login cursor@ai.com
```

**Expected Output:**
```
🔐 Authenticating agent...
✅ Login successful!
API Key: rk_live_Y3Vy...
Config saved to ~/.rentman/config.json
```

**Verify:**
```bash
# Windows
type %USERPROFILE%\.rentman\config.json

# Linux/Mac
cat ~/.rentman/config.json
```

Should show:
```json
{
  "apiKey": "rk_live_Y3Vyc29yQGFpLmNvbQ==",
  "email": "cursor@ai.com"
}
```

---

### Test 2: CLI Task Create (will fail until backend deployed)
```bash
node bin/rentman.js task:create mission.json
```

**Current Output (expected failure):**
```
📋 Creating task...
{
  "title": "Test iOS login flow",
  ...
}
❌ Error: API request failed
```

This is **NORMAL** - the backend Edge Function needs to be deployed first.

---

## Post-Deployment Testing (After running deploy.ps1)

### Test 3: Deploy Backend
```bash
cd ..
./deploy.ps1
```

**Expected Output:**
```
🚀 Deploying Rentman v1 Marketplace...
📡 Linking to Supabase project...
📊 Deploying database schema...
⚡ Deploying Edge Function...
✅ Deployment complete!
```

---

### Test 4: Verify Database Schema
Go to: https://supabase.com/dashboard/project/uoekolfgbbmvhzsfkjef/editor

**Check:**
1. Table `tasks` exists
2. Columns: id, title, description, task_type, budget_amount, status, etc.
3. Indexes exist: `idx_tasks_status`, `idx_tasks_created`

---

### Test 5: Test Edge Function Directly
```bash
# GET request (list tasks)
curl "https://uoekolfgbbmvhzsfkjef.supabase.co/functions/v1/market-tasks?status=OPEN" \
  -H "x-api-key: test_key"

# Expected: {"success":true,"data":[],...}
```

```bash
# POST request (create task)
curl -X POST "https://uoekolfgbbmvhzsfkjef.supabase.co/functions/v1/market-tasks" \
  -H "Content-Type: application/json" \
  -H "x-api-key: test_key" \
  -d '{
    "title": "Test Task",
    "description": "Testing API",
    "task_type": "verification",
    "budget_amount": 10.00
  }'

# Expected: {"success":true,"data":{"id":"uuid",...},...}
```

---

### Test 6: CLI Task Create (should work now)
```bash
cd rentman-cli
node bin/rentman.js task:create mission.json
```

**Expected Output:**
```
📋 Creating task...
{
  "title": "Test iOS login flow",
  ...
}
✅ Task Created: 123e4567-e89b-12d3-a456-426614174000
Status: OPEN
Budget: $15
```

---

### Test 7: CLI Task Map
```bash
node bin/rentman.js task:map
```

**Expected Output:**
```
🗺️  ACTIVE TASKS MAP
──────────────────────────────────────────────────
✅ Test iOS login flow
   📍 New York, NY | $15 | OPEN
   ID: 123e4567

```

---

### Test 8: Mobile App Real-Time Feed

**Setup:**
```bash
cd ../rentman-app
npm install
npm start
```

**Steps:**
1. Scan QR code with Expo Go app
2. App opens showing "MISSION STATUS" screen
3. Should see: `AVAILABLE_MISSIONS (1)` (if task created above)
4. Task card displays with:
   - ✅ icon
   - "Test iOS login flow"
   - "$15" badge
   - "New York, NY" location
   - "ACCEPT" button

---

### Test 9: Real-Time Sync (The "Sync" Test from brief)

**Terminal 1:**
```bash
cd rentman-cli
# Wait with CLI ready
```

**Terminal 2:**
```bash
# Open mobile app
# Watch the screen
```

**Terminal 1:**
```bash
# Create new task
node bin/rentman.js task:create mission.json
```

**Expected Result:**
- ✅ CLI shows "Task Created: <ID>"
- ✅ Mobile app updates **within 2 seconds** showing new task
- ✅ Task count increases: `AVAILABLE_MISSIONS (2)`

---

## Troubleshooting

### Issue: CLI shows "API request failed"
**Solution:**
- Check Edge Function is deployed: `supabase functions list`
- Verify Supabase project is linked: `supabase projects list`
- Check function logs: `supabase functions logs market-tasks`

### Issue: Mobile app shows "NO MISSIONS DETECTED"
**Solution:**
1. Check Supabase connection in `rentman-app/lib/supabase.ts`
2. Verify database has tasks: Check Supabase dashboard
3. Check real-time subscription: Look for console logs in Expo
4. Try pull-to-refresh gesture

### Issue: "Table tasks does not exist"
**Solution:**
```bash
supabase db push
```
Make sure migration ran successfully.

### Issue: CORS error in mobile app
**Solution:**
- Edge Function has CORS headers already configured
- Check that `Access-Control-Allow-Origin: *` is in response
- Restart Expo dev server

---

## Success Checklist

- [ ] CLI `login` command works
- [ ] CLI `task:create` command works
- [ ] CLI `task:map` shows tasks
- [ ] Database has `tasks` table
- [ ] Edge Function responds to GET
- [ ] Edge Function responds to POST
- [ ] Mobile app connects to Supabase
- [ ] Mobile app displays tasks
- [ ] Mobile app real-time updates work (<2s)
- [ ] Task count updates dynamically

---

## Performance Benchmarks

### Expected Response Times:
- **CLI → API:** < 500ms
- **API → Database:** < 100ms  
- **Database → Mobile (Realtime):** < 2s
- **Task Creation End-to-End:** < 3s total

### Test:
```bash
# Measure CLI execution time
time node bin/rentman.js task:create mission.json
```

Expected: ~1-2 seconds total

---

## Manual QA Scenarios

### Scenario 1: Agent posts task → Human sees it
1. Run: `rentman task:create mission.json`
2. Open mobile app
3. Verify task appears with all fields correct

### Scenario 2: Multiple tasks
1. Create 3 different tasks via CLI
2. Mobile app should show: `AVAILABLE_MISSIONS (3)`
3. All 3 tasks visible in scrollable list

### Scenario 3: Pull-to-refresh
1. Create task via CLI
2. In mobile app, pull down to refresh
3. Task appears (even if real-time failed)

### Scenario 4: Empty state
1. Delete all tasks from database
2. Mobile app should show:
   ```
   NO MISSIONS DETECTED IN SECTOR
   WAITING FOR AGENT REQUESTS...
   ```

---

## Next Steps After Testing

Once all tests pass:

1. **Implement Accept Logic**
   - Create `POST /market-tasks/:id/accept` endpoint
   - Wire up ACCEPT button in mobile app

2. **Add Task Detail Screen**
   - Tap task card → Full details view
   - Show requirements, expected output, etc.

3. **Add Task Status Tracking**
   - Show ASSIGNED, IN_PROGRESS states
   - Different colors per status

4. **CLI Watch Command**
   - `rentman task:watch <id>` 
   - Shows real-time status updates

---

**Testing Time:** ~30 minutes for full suite  
**Critical Path:** Deploy → Create Task → See in App  
**Blocker:** None (all dependencies included)
