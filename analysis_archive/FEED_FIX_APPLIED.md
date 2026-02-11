# Feed Fix - Implementation Complete ✅

**Date:** 2026-02-09  
**Issue:** Tasks disappeared from Feed after being accepted from Market

## Problem Summary

When a user accepted a task from the Market (`/market`), the task would vanish from their Feed (`/`) because:
- Market correctly shows tasks with `status = 'open'`
- Feed was using the same logic, filtering only `'open'` or `'completed'` tasks
- Accepted tasks get status `'assigned'`, which didn't match either filter
- Result: Task disappeared after acceptance ❌

## Solution Implemented

Separated the responsibilities of Feed and Market:

### 1. **Market** (`/market`) 
Shows **ALL OPEN tasks** available to any user (unchanged)

### 2. **Feed** (`/`)
Shows **MY TASKS** (tasks assigned to logged-in user)

## Changes Applied

### File: `apps/mobile/src/lib/supabase-client.ts`

Added new function `getUserTasks()`:

```typescript
export async function getUserTasks(
  userId: string, 
  statusFilter: 'active' | 'completed' = 'active'
) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('assigned_human_id', userId)
    .order('created_at', { ascending: false });

  if (statusFilter === 'active') {
    // Active tasks include: assigned, accepted, in_progress, dispute
    query = query.in('status', ['assigned', 'accepted', 'in_progress', 'dispute']);
  } else {
    query = query.eq('status', 'completed');
  }

  const { data, error } = await query;
  if (error) console.error('Error fetching user tasks:', error);
  return { data: data as Task[] | null, error };
}
```

### File: `apps/mobile/src/app/page.tsx`

**Updated imports:**
```typescript
import { getTasks, getUserTasks, Task } from '@/lib/supabase-client';
```

**Modified loadTasks() function:**
```typescript
async function loadTasks() {
  console.log('📊 Loading tasks from Supabase for tab:', activeTab);
  setLoadingTasks(true);
  
  // Map tab name to status filter
  const statusFilter = activeTab === 'active' ? 'active' : 'completed';
  
  // Use getUserTasks to fetch tasks assigned to the current user
  const { data, error } = await getUserTasks(user!.id, statusFilter);

  if (error) {
    console.error('❌ Error loading tasks:', error);
  } else {
    console.log('✅ Loaded user tasks:', data?.length || 0);
    setTasks(data || []);
  }
  setLoadingTasks(false);
}
```

**Improved empty state with CTA:**
```tsx
{loadingTasks ? (
  // Loading spinner
) : tasks.length === 0 ? (
  <div className="text-center py-12">
    <span className="material-symbols-outlined text-6xl text-gray-700">work_off</span>
    <p className="text-gray-400 mt-4" style={{ fontFamily: FONTS.mono }}>
      {activeTab === 'active' ? 'NO ACTIVE TASKS' : 'NO COMPLETED TASKS'}
    </p>
    
    {/* Redirect to Market if no active tasks */}
    {activeTab === 'active' && (
      <button
        onClick={() => router.push('/market')}
        className="mt-6 px-6 py-3 rounded bg-[#00ff88] text-black font-bold uppercase tracking-wider hover:bg-[#00cc6d] transition-colors"
        style={{ fontFamily: FONTS.mono }}
      >
        FIND TASKS
      </button>
    )}
  </div>
) : (
  // Task list
)}
```

## Validation Flow

1. ✅ User A goes to **Market** → sees all open tasks
2. ✅ User A **accepts** a task → status changes to `'assigned'`
3. ✅ User A goes to **Feed** → calls `getUserTasks(userA, 'active')`
4. ✅ **Feed shows the accepted task** (status: `'assigned'` matches active filter)
5. ✅ If no tasks, user sees "FIND TASKS" button to go back to Market

## Build Status

✅ TypeScript compilation: **SUCCESS**  
✅ Next.js build: **SUCCESS**  
✅ Dev server: **RUNNING**

## Task Status Mapping

| Task Status       | Market | Feed (Active) | Feed (Complete) |
|-------------------|--------|---------------|-----------------|
| `open`            | ✅     | ❌            | ❌              |
| `assigned`        | ❌     | ✅            | ❌              |
| `accepted`        | ❌     | ✅            | ❌              |
| `in_progress`     | ❌     | ✅            | ❌              |
| `dispute`         | ❌     | ✅            | ❌              |
| `completed`       | ❌     | ❌            | ✅              |

## Next Steps

- [ ] Test in production with real user flow
- [ ] Monitor for edge cases (e.g., task reassignment)
- [ ] Consider adding filters/sorting to Feed
- [ ] Add notification when task status changes

---

**Status:** ✅ READY FOR TESTING
