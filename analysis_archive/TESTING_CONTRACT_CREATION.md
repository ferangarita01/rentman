# Quick Testing Guide - Contract Creation Feature

## 🚀 How to Test

### 1. Start the Development Server
```bash
cd apps/mobile
npm run dev
```
**Expected:** Server runs on `http://localhost:3000`

---

### 2. Login to the App
1. Navigate to `http://localhost:3000`
2. Login with your test credentials
3. **Expected:** You're redirected to the home page

---

### 3. Navigate to Global Market
1. Click on the **Market** tab in bottom navigation
2. **URL should be:** `http://localhost:3000/market`
3. **Expected:** You see the Global Market feed with contracts

---

### 4. Locate the Create Button
**Look for:**
- A **green circular button** with a **+** icon
- **Position:** Bottom-right corner, floating above the bottom nav
- **Color:** Bright green (#00ff88)
- **Effect:** Hover should make it slightly larger

![FAB Location]
```
┌─────────────────────────────┐
│                             │
│   GLOBAL MARKET FEED        │
│                             │
│   [Contract Card 1]         │
│                             │
│   [Contract Card 2]         │
│                             │
│                        ┌──┐ │ ← FAB Button
│                        │+│  │   (bottom-right)
│                        └──┘ │
├─────────────────────────────┤
│   [Bottom Navigation]       │
└─────────────────────────────┘
```

---

### 5. Open Create Contract Modal
1. **Click** the green + button
2. **Expected:** Modal slides up from bottom (mobile) or appears centered (desktop)

**Modal Header:**
```
✨ Create Contract
Quick Mode
```

**Two Mode Options:**
- ⚡ Quick (AI-assisted - not yet functional)
- 🎨 Custom (Manual entry)

---

### 6. Fill Out the Form (Custom Mode)

#### Click "Custom" Mode or "Switch to Custom Mode"

**Required Fields (marked with *):**

1. **Title***
   - Example: "Deliver groceries to downtown apartment"
   
2. **Description***
   - Example: "Need someone to pick up groceries from Whole Foods and deliver to my apartment. List will be provided."
   
3. **Budget (USD)***
   - Example: 25.00

**Optional Fields:**

4. **Task Type** (default: Delivery 📦)
   - Click different types to select

5. **Location** (optional)
   - Example: "123 Main St, New York, NY 10001"

6. **Required Skills** (optional)
   - Type skill → Click "Add"
   - Example: "driving", "reliable", "quick"
   - Click × to remove skills

---

### 7. Submit the Contract

**Click:** 🚀 Create Contract

**Expected Behavior:**
1. Button text changes to "⏳ Creating..."
2. Short delay (network request)
3. Success toast appears: "Contract created! 🚀 It will appear in the Global Market."
4. Modal closes automatically
5. Market page refreshes
6. **Your new contract appears in the feed!**

---

### 8. Verify in Database (Optional)

**Supabase Dashboard:**
1. Go to Supabase project
2. Navigate to Table Editor → `tasks`
3. Look for newest entry
4. **Verify:**
   - `title` matches what you entered
   - `description` matches
   - `budget_amount` matches
   - `task_type` matches selected type
   - `agent_id` = your user ID
   - `status` = 'open'
   - `priority` = 5
   - `budget_currency` = 'USD'
   - `payment_type` = 'fixed'
   - `payment_status` = 'pending'

---

### 9. Verify in Inbox (Managing Tab)

1. Click **Inbox** tab in bottom nav
2. Click **Managing** sub-tab
3. **Expected:** Your newly created contract appears here
4. **Why?** Because you're the `agent_id` (creator)

---

## ❌ Test Error Handling

### Test 1: Empty Title
- Leave title blank
- Click Create
- **Expected:** Toast error: "Title is required"

### Test 2: Empty Description
- Fill title, leave description blank
- Click Create
- **Expected:** Toast error: "Description is required"

### Test 3: Invalid Budget
- Fill title & description
- Enter "abc" or "-10" in budget
- Click Create
- **Expected:** Toast error: "Please enter a valid budget amount"

### Test 4: Not Logged In
- Logout (if possible)
- Try to create contract
- **Expected:** Toast error: "Please log in first"

---

## ✅ Success Checklist

- [ ] Dev server starts successfully
- [ ] Can navigate to `/market`
- [ ] Green + button is visible and clickable
- [ ] Modal opens when clicking +
- [ ] Can switch between Quick/Custom modes
- [ ] All form fields accept input
- [ ] Skill tags can be added/removed
- [ ] Validation errors show for empty required fields
- [ ] Valid submission creates task in database
- [ ] Success toast appears
- [ ] Modal closes after success
- [ ] New contract appears in Market feed
- [ ] New contract appears in Inbox → Managing tab
- [ ] No errors in browser console

---

## 🐛 Common Issues & Solutions

### Issue: "+ Button not visible"
**Solution:** Check if you're on `/market` page (NOT `/inbox` or home)

### Issue: "createTask is not a function"
**Solution:** Check `supabase-client.ts` exports the function

### Issue: Database error on submit
**Solution:** 
1. Check Supabase RLS policies
2. Run this SQL in Supabase SQL Editor:
```sql
-- Allow authenticated users to create tasks
CREATE POLICY "Users can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = agent_id);
```

### Issue: Modal doesn't close after success
**Solution:** Check `onCreated` callback reloads data

### Issue: TypeScript errors
**Solution:** Run `npm run build` and fix any type errors

---

## 📸 Visual Checkpoints

### Checkpoint 1: Market Page with FAB
**Look for:**
- Contract cards in feed
- Green circular button bottom-right
- Button floats above content
- Button has shadow effect

### Checkpoint 2: Modal Open (Quick Mode)
**Look for:**
- Dark/glassmorphic background
- Header: "✨ Create Contract"
- Two mode buttons (Quick & Custom)
- Close button (X) top-right

### Checkpoint 3: Custom Mode Form
**Look for:**
- Title input field
- Description textarea
- Budget number input
- 6 task type buttons (3x2 grid)
- Location input
- Skills input + Add button
- Create Contract button (disabled until valid)

### Checkpoint 4: Success State
**Look for:**
- Green toast notification
- Modal closed
- Market feed updated with new contract

---

## 🎯 Performance Benchmarks

- **Modal Open:** < 100ms
- **Form Validation:** Instant
- **API Request:** < 2 seconds
- **Toast Display:** 3-5 seconds
- **Feed Refresh:** < 1 second

---

## 🔄 Regression Testing

**Ensure these still work:**
- [ ] Viewing existing contracts in Market
- [ ] Clicking contract cards opens detail view
- [ ] Filtering contracts works
- [ ] Search functionality works
- [ ] Bottom navigation works
- [ ] Inbox functionality unchanged
- [ ] Profile page unchanged
- [ ] Wallet page unchanged

---

## 📱 Mobile Testing (if available)

**Test on different screen sizes:**
- iPhone SE (375px)
- iPhone 12 (390px)
- iPhone 14 Pro Max (430px)
- iPad (768px)

**Expected:**
- Modal is full-width on mobile
- Button is easily tappable (56px)
- Form fields are large enough
- Keyboard doesn't obscure inputs

---

## 🎉 Ready for Production?

**Before deploying:**
- [ ] All tests pass
- [ ] No console errors
- [ ] RLS policies configured
- [ ] Error handling tested
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Performance acceptable
- [ ] Documentation complete

---

**Happy Testing! 🚀**
