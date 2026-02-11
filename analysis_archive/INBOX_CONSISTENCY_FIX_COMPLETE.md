# Inbox & Feed Consistency Fix - Implementation Complete ✅

**Date:** 2026-02-09  
**Issue:** Discrepancy between Home Feed (1 task) and Inbox (4 threads)  
**Solution:** Role-based filtering with tabs in Inbox

---

## Problem Analysis

### Root Cause
The Feed and Inbox were using different queries with different user role filters:

**Home Feed (`getUserTasks`)**
- Filter: `.eq('assigned_human_id', userId)`  
- Shows: Tasks where user is the **WORKER** (assigned to perform)
- Result: 1 task assigned to user

**Inbox (`getThreads`)**
- Filter: `.or('agent_id.eq.userId, assigned_human_id.eq.userId')`
- Shows: Tasks where user is **EITHER** worker **OR** requester (created the task)
- Result: 1 assigned task + 3 created tasks = 4 total threads

### Why This Happens
Rentman supports **hybrid roles**:
- Users can be **workers** (doing tasks)
- Users can be **requesters/agents** (creating tasks for others)
- Inbox showed ALL involvement, Feed showed only assigned work

---

## Solution Implemented

### Approach: Role-Based Filtering with Tabs

Added **3 filter tabs** to the Inbox to separate user roles:

1. **ALL** - Shows everything (default behavior)
2. **DOING** - Tasks where user is the worker (matches Feed)
3. **MANAGING** - Tasks where user is the requester/creator

---

## Changes Applied

### 1. Updated `Thread` Interface

**File:** `apps/mobile/src/lib/supabase-client.ts`

```typescript
export interface Thread {
  id: string;
  task_id: string;
  task_title: string;
  task_type: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  sender_type: string;
  task_status: string;
  agent_id?: string;           // ✨ NEW: Requester/Creator ID
  assigned_human_id?: string;  // ✨ NEW: Worker ID
}
```

### 2. Updated `getThreads()` Function

**File:** `apps/mobile/src/lib/supabase-client.ts`

Modified thread mapping to include role IDs:

```typescript
return {
  id: `contract-${task.id}`,
  task_id: task.id,
  task_title: task.title,
  task_type: task.task_type,
  last_message: latestMessage?.content || 'No messages yet',
  last_message_at: latestMessage?.created_at || task.status,
  unread_count: unreadCount,
  sender_type: latestMessage?.sender_type || 'system',
  task_status: task.status,
  agent_id: task.agent_id,              // ✨ NEW
  assigned_human_id: task.assigned_human_id  // ✨ NEW
};
```

### 3. Updated Inbox Page UI

**File:** `apps/mobile/src/app/inbox/page.tsx`

#### Added State:
```typescript
const [filterMode, setFilterMode] = useState<'all' | 'doing' | 'managing'>('all');
```

#### Added Filter Logic:
```typescript
const displayedThreads = threads.filter(thread => {
    // Always show AI assistant
    if (thread.task_type === 'ai') return true;
    
    if (!user) return false;
    
    if (filterMode === 'doing') {
        // Show tasks where I'm the worker
        return thread.assigned_human_id === user.id;
    } else if (filterMode === 'managing') {
        // Show tasks where I'm the requester
        return thread.agent_id === user.id;
    }
    
    // 'all' mode: show everything
    return true;
});
```

#### Added Filter Tabs UI:
```tsx
<div className="flex gap-2 mt-4">
    <button
        onClick={() => setFilterMode('all')}
        className={`flex-1 py-2 px-3 rounded text-xs font-mono uppercase ${
            filterMode === 'all' 
                ? 'bg-[#00ff88] text-black font-bold' 
                : 'bg-[#1a1a1a] text-gray-400'
        }`}
    >
        All
    </button>
    <button
        onClick={() => setFilterMode('doing')}
        className={`...`}
    >
        Doing
    </button>
    <button
        onClick={() => setFilterMode('managing')}
        className={`...`}
    >
        Managing
    </button>
</div>
```

#### Updated Empty States:
```tsx
{displayedThreads.length === 0 && (
    <div className="text-center py-12">
        <p className="text-gray-500 text-sm">
            {filterMode === 'doing' && 'No tasks you are working on'}
            {filterMode === 'managing' && 'No tasks you created'}
            {filterMode === 'all' && 'No messages yet'}
        </p>
    </div>
)}
```

---

## User Experience Flow

### Scenario: User with 1 assigned task + 3 created tasks

| View | Filter | Expected Result |
|------|--------|-----------------|
| **Feed (Active)** | N/A | Shows **1 task** (assigned to user) |
| **Inbox (All)** | Default | Shows **4 threads** (1 doing + 3 managing) |
| **Inbox (Doing)** | Worker role | Shows **1 thread** ✅ Matches Feed |
| **Inbox (Managing)** | Creator role | Shows **3 threads** (tasks user created) |

### Benefits

✅ **Clarity** - Users understand their dual roles  
✅ **Consistency** - "Doing" tab matches Feed perfectly  
✅ **Flexibility** - Users can switch context easily  
✅ **Discovery** - Users can track tasks they created  

---

## Build & Deployment

✅ **TypeScript compilation:** SUCCESS  
✅ **Next.js build:** SUCCESS  
✅ **Capacitor sync:** SUCCESS  
✅ **Gradle build:** SUCCESS in 5s  
✅ **ADB installation:** SUCCESS  
✅ **App launched:** RUNNING on device `1163455475003653`

---

## Testing Checklist

### Test Flow:

- [ ] 1. Open Inbox → Should default to "All" tab
- [ ] 2. Verify **4 threads** visible (1 + 3 from scenario)
- [ ] 3. Click "Doing" tab
- [ ] 4. Verify **1 thread** visible (task assigned to user)
- [ ] 5. Click "Managing" tab
- [ ] 6. Verify **3 threads** visible (tasks user created)
- [ ] 7. Go to Feed (Active tab)
- [ ] 8. Verify **1 task** visible (matches Inbox "Doing" tab)
- [ ] 9. Accept a new task from Market
- [ ] 10. Verify it appears in both Feed and Inbox "Doing"

### Expected Behavior Matrix:

| User Role on Task | Feed Active | Inbox All | Inbox Doing | Inbox Managing |
|-------------------|-------------|-----------|-------------|----------------|
| Worker (assigned) | ✅ Shows    | ✅ Shows  | ✅ Shows    | ❌ Hidden      |
| Requester (created)| ❌ Hidden   | ✅ Shows  | ❌ Hidden   | ✅ Shows       |
| Both roles        | ✅ Shows    | ✅ Shows  | ✅ Shows    | ✅ Shows       |

---

## Alternative Approaches Considered

### ❌ Option 1: Make Inbox Match Feed Only
**Approach:** Filter Inbox to show only worker tasks  
**Rejected:** Would hide tasks the user created, losing valuable context

### ❌ Option 2: Make Feed Show Everything  
**Approach:** Change Feed to show both worker and requester tasks  
**Rejected:** Would confuse the Feed's purpose as "My Work To Do"

### ✅ Option 3: Add Role-Based Tabs (Implemented)
**Approach:** Let users filter by their role  
**Chosen:** Provides clarity, flexibility, and consistency

---

## Files Modified

1. `apps/mobile/src/lib/supabase-client.ts`
   - Updated `Thread` interface with `agent_id` and `assigned_human_id`
   - Modified `getThreads()` to return role IDs

2. `apps/mobile/src/app/inbox/page.tsx`
   - Added `filterMode` state
   - Implemented `displayedThreads` filter logic
   - Added filter tabs UI (All/Doing/Managing)
   - Updated empty state messages

---

## Next Steps

- [ ] User testing with real data
- [ ] Monitor usage analytics on tab switching
- [ ] Consider badge counts per tab (e.g., "Doing (1)")
- [ ] Add filter persistence (remember user's preferred tab)
- [ ] Consider adding filter to Feed as well

---

**Status:** ✅ DEPLOYED AND READY FOR TESTING  
**Consistency Issue:** RESOLVED  
**UX Improvement:** TABS ADDED
