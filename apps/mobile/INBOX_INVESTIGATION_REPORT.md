# 🔍 Inbox Investigation Report

**Date:** 2026-02-08 04:43 UTC  
**Status:** ✅ PROBLEM IDENTIFIED

---

## Problem Summary

The inbox page shows "Failed to load message threads" because:

1. ✅ **Messages table EXISTS** in database
2. ❌ **Messages table is EMPTY** (0 messages)
3. ❌ **Code references `requester_id` column** which doesn't exist in `tasks` table

---

## Database Investigation Results

### Tables Status
- ✅ `messages` table: **EXISTS** (but empty)
- ✅ `tasks` table: **EXISTS** (5 tasks found)
- ✅ `profiles` table: **EXISTS** (1 profile found)

### Tasks Table Structure

**User/Agent Columns:**
- ✅ `agent_id` - Currently NULL for all tasks
- ✅ `assigned_human_id` - Currently NULL
- ❌ `requester_id` - **DOES NOT EXIST**
- ✅ `metadata.agent_id` - Contains agent UUID (e.g., "55ea7c98-132d-450b-8712-4f369d763261")

**Sample Task Metadata:**
```json
{
  "nonce": "iy0fyo",
  "title": "Test iOS login flow",
  "agent_id": "55ea7c98-132d-450b-8712-4f369d763261",
  "location": {
    "lat": 40.7128,
    "lng": -74.006,
    "address": "New York, NY"
  },
  "task_type": "verification",
  "timestamp": 1770413619583,
  "description": "Test login functionality...",
  "budget_amount": 15,
  "required_skills": ["iOS testing", "TestFlight"]
}
```

---

## Code Issues

### Issue 1: Wrong Column Reference

**File:** `src/lib/supabase-client.ts`  
**Line:** ~200

**Current Code (BROKEN):**
```typescript
.or(`agent_id.eq.${userId},requester_id.eq.${userId}`)
```

**Problem:** `requester_id` doesn't exist in `tasks` table

**Solution Options:**

**Option A:** Use `agent_id` and `assigned_human_id`
```typescript
.or(`agent_id.eq.${userId},assigned_human_id.eq.${userId}`)
```

**Option B:** Extract from metadata (requires JSON query)
```typescript
.or(`agent_id.eq.${userId},assigned_human_id.eq.${userId},metadata->agent_id.eq.${userId}`)
```

**Recommended:** Option B (covers all cases)

---

### Issue 2: No Messages in Database

**Current State:** 0 messages in `messages` table

**Why:**
- Step 8 of `SETUP_INBOX_MESSAGES.sql` tries to create messages
- But it references `requester_id` which doesn't exist
- SQL fails silently (uses `ON CONFLICT DO NOTHING`)

**Solution:** Update SQL script to use correct columns

---

## Fixes Required

### Fix 1: Update `getThreads()` Function

**File:** `src/lib/supabase-client.ts`  
**Lines:** 187-252

**Changes:**

1. Replace column reference:
```typescript
// OLD (lines ~200)
.or(`agent_id.eq.${userId},requester_id.eq.${userId}`)

// NEW
.or(`agent_id.eq.${userId},assigned_human_id.eq.${userId}`)
```

2. Handle creator ID extraction:
```typescript
// When creating initial message, use:
const creatorId = task.agent_id || task.assigned_human_id || task.metadata?.agent_id;
```

---

### Fix 2: Update SQL Migration Script

**File:** `SETUP_INBOX_MESSAGES.sql`  
**Line:** ~83

**Changes:**

```sql
-- OLD (BROKEN)
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    t.id,
    t.requester_id,  -- ❌ Column doesn't exist
    'system',
    ...
FROM tasks t

-- NEW (FIXED)
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    t.id,
    COALESCE(
        t.agent_id, 
        t.assigned_human_id,
        (t.metadata->>'agent_id')::uuid
    ),
    'system',
    ...
FROM tasks t
```

---

### Fix 3: Create Initial Messages

After fixing the SQL, run it to populate messages:

```sql
-- This will create system messages for all existing tasks
INSERT INTO messages (task_id, sender_id, sender_type, content, message_type)
SELECT 
    t.id,
    COALESCE(
        t.agent_id,
        t.assigned_human_id,
        (t.metadata->>'agent_id')::uuid,
        '5b3b3f7e-5529-4f6f-b132-2a34dc935160'::uuid  -- Fallback to first profile
    ) as sender_id,
    'system',
    CASE 
        WHEN t.status = 'pending' THEN 'Contract created and awaiting agent assignment.'
        WHEN t.status = 'assigned' THEN 'Agent assigned. Ready to begin.'
        WHEN t.status = 'in_progress' THEN 'Task in progress.'
        WHEN t.status = 'completed' THEN 'Task completed successfully.'
        WHEN t.status = 'open' THEN 'Contract open. Awaiting agent acceptance.'
        ELSE 'Contract initialized.'
    END,
    'system'
FROM tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM messages WHERE messages.task_id = t.id
);
```

---

## Implementation Priority

### High Priority (Required for Inbox to Work)
1. ✅ Fix `getThreads()` column reference
2. ✅ Update SQL migration script
3. ✅ Run SQL to create initial messages

### Medium Priority (Improvements)
4. Add better error handling (already implemented)
5. Handle empty messages gracefully (already implemented)

---

## Testing Plan

After applying fixes:

1. **Run Fixed SQL Script**
   - Execute updated `SETUP_INBOX_MESSAGES.sql`
   - Verify messages created: `SELECT COUNT(*) FROM messages;`
   - Expected: 5 messages (one per task)

2. **Test getThreads() Logic**
   - Run `node deep-inspect-db.js`
   - Should show threads with messages

3. **Test in App**
   - Open inbox page
   - Should show 5 contract threads + 1 AI thread
   - No "failed to load" error

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/lib/supabase-client.ts` | Fix column references | HIGH |
| `SETUP_INBOX_MESSAGES.sql` | Fix sender_id extraction | HIGH |
| Supabase Database | Run fixed SQL | HIGH |

---

## Summary

**Root Cause:** Schema mismatch  
**Impact:** Inbox completely broken  
**Severity:** HIGH  
**Fix Complexity:** LOW (simple column name changes)  
**ETA:** 15-20 minutes  

---

**Next Steps:**
1. Apply code fixes to `supabase-client.ts`
2. Update and run SQL migration
3. Verify with inspection scripts
4. Build and deploy updated APK
5. Test inbox functionality

---

*Investigation completed: 2026-02-08 04:43 UTC*  
*Tools used: Node.js + Supabase JS Client*  
*Database: uoekolfgbbmvhzsfkjef.supabase.co*
