# Analytics Implementation Guide - Rentman Mobile

## 📊 Analytics Setup

### Configured Services
- **Google Tag Manager (GTM):** GTM-WDCLWK4P
- **Google Analytics 4 (GA4):** G-ND9PT413XV

### Implementation Location
- **Main Setup:** `src/app/layout.tsx`
- **Utilities:** `src/lib/analytics.ts`

---

## 🎯 Implemented Tracking

### 1. Layout (Global Tracking)
**File:** `src/app/layout.tsx`

✅ GTM script in `<head>` (before any other scripts)
✅ GA4 script in `<head>`
✅ GTM noscript iframe in `<body>`

### 2. Authentication Page
**File:** `src/app/auth/page.tsx`

**Events Tracked:**
- `trackPageView('/auth', 'Authentication')` - On page load
- `trackAuthEvent('login', 'email')` - Email login attempt
- `trackAuthEvent('login', 'google')` - Google login attempt
- `trackAuthEvent('signup', 'email')` - Email signup
- `trackAuthEvent('login_failed', method, { error })` - Failed login with error details

### 3. Settings Page
**File:** `src/app/settings/page.tsx`

**Events Tracked:**
- `trackPageView('/settings', 'Settings')` - On page load
- `trackSettingsChange('hardware_camera', value)` - Camera toggle
- `trackSettingsChange('hardware_gps', value)` - GPS toggle
- `trackSettingsChange('hardware_biometric', value)` - Biometric toggle
- `trackSettingsChange('comms_aiLink', value)` - AI Link toggle
- `trackSettingsChange('comms_neural', value)` - Neural notifications toggle
- `trackButtonClick('Emergency Reboot', 'Settings')` - Reboot button
- `trackButtonClick('Open Privacy Policy', 'Settings - Legal')` - Privacy policy link
- `trackButtonClick('Open Terms of Service', 'Settings - Legal')` - Terms link

---

## 📖 Available Analytics Functions

### Core Functions

```typescript
import { 
  trackEvent, 
  trackButtonClick, 
  trackPageView,
  trackFormSubmit,
  trackTaskEvent,
  trackAuthEvent,
  trackNavigation,
  trackMessageEvent,
  trackSettingsChange,
  trackError,
  trackConversion,
  trackSearch,
  trackFeatureUsage
} from '@/lib/analytics';
```

### Usage Examples

#### 1. Track Button Clicks
```typescript
trackButtonClick('Accept Task', 'Task Details Page');
trackButtonClick('Send Message', 'Chat');
```

#### 2. Track Page Views
```typescript
// In useEffect
useEffect(() => {
  trackPageView('/contracts', 'Contracts List');
}, []);
```

#### 3. Track Task Events
```typescript
// When user accepts a task
trackTaskEvent('accept', taskId, 'delivery', { 
  budget: 50,
  location: 'Madrid'
});

// When user completes a task
trackTaskEvent('complete', taskId, 'pickup', {
  duration_minutes: 45
});
```

#### 4. Track Form Submissions
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  trackFormSubmit('Contact Form', {
    subject: 'Support Request'
  });
  // ... submit logic
};
```

#### 5. Track Navigation
```typescript
const navigateToTask = (taskId) => {
  trackNavigation(`/task/${taskId}`, 'Home Feed');
  router.push(`/task/${taskId}`);
};
```

#### 6. Track Message Events
```typescript
// When sending a message
trackMessageEvent('send', threadId, {
  message_length: message.length,
  has_attachment: false
});

// When opening a thread
trackMessageEvent('open_thread', threadId);
```

#### 7. Track Errors
```typescript
try {
  // Some operation
} catch (error) {
  trackError('API_ERROR', error.message, false, {
    endpoint: '/api/tasks',
    status_code: 500
  });
}
```

#### 8. Track Conversions
```typescript
// When task is completed successfully
trackConversion('task_completed', 50, {
  task_type: 'delivery',
  completion_time: '12:45'
});

// When user completes first task
trackConversion('first_task', 0, {
  user_id: userId
});
```

#### 9. Track Search
```typescript
const handleSearch = (query) => {
  const results = performSearch(query);
  trackSearch(query, results.length, {
    category: 'tasks',
    filters_applied: ['nearby', 'high_budget']
  });
};
```

#### 10. Track Feature Usage
```typescript
// When user uses a feature
trackFeatureUsage('Voice Assistant', 'started', {
  context: 'task_creation'
});

trackFeatureUsage('GPS Location', 'shared', {
  precision: 'high'
});
```

---

## 🎨 Recommended Tracking Points

### Home Page / Feed
```typescript
// Track page view
trackPageView('/home', 'Home Feed');

// Track task card clicks
trackButtonClick('View Task Details', 'Home Feed');

// Track filter changes
trackFeatureUsage('Task Filter', 'applied', {
  filters: ['nearby', 'high_budget']
});
```

### Task Details Page
```typescript
// Track page view
trackPageView(`/task/${taskId}`, 'Task Details');

// Track accept/reject
trackTaskEvent('accept', taskId, taskType, { budget });
trackTaskEvent('reject', taskId, taskType);

// Track message button
trackButtonClick('Contact Issuer', 'Task Details');
```

### Chat / Inbox
```typescript
// Track page view
trackPageView('/inbox', 'Inbox');

// Track thread open
trackMessageEvent('open_thread', threadId);

// Track message send
trackMessageEvent('send', threadId, { 
  message_type: 'text' 
});
```

### Profile Page
```typescript
// Track page view
trackPageView('/profile', 'User Profile');

// Track edit profile
trackButtonClick('Edit Profile', 'Profile');

// Track stats view
trackFeatureUsage('View Stats', 'opened');
```

---

## 🔍 Testing Analytics

### 1. Development Mode
All analytics events are logged to console in development:
```
📊 Analytics Event: button_click { button_text: "Accept Task", ... }
```

### 2. GTM Preview Mode
1. Go to https://tagmanager.google.com/
2. Select container GTM-WDCLWK4P
3. Click "Preview"
4. Enter your app URL
5. See real-time events

### 3. GA4 Realtime View
1. Go to https://analytics.google.com/
2. Select property G-ND9PT413XV
3. Go to Reports → Realtime
4. See live events as they happen

### 4. GA4 DebugView
1. Enable debug mode in development
2. Go to Admin → DebugView in GA4
3. See detailed event data

---

## 📋 Event Categories

All events are categorized for easier analysis:

- **engagement** - General user interactions
- **conversion** - High-value events (task completion, payments)
- **authentication** - Login/signup events
- **task_management** - Task-related actions
- **navigation** - Page/screen changes
- **messaging** - Chat/inbox interactions
- **settings** - Configuration changes
- **error** - Error tracking

---

## 🚀 Production Checklist

- [x] GTM script in layout.tsx
- [x] GA4 script in layout.tsx
- [x] Analytics utility functions created
- [x] Auth page tracking implemented
- [x] Settings page tracking implemented
- [ ] Home/Feed page tracking
- [ ] Task details tracking
- [ ] Inbox/Chat tracking
- [ ] Profile page tracking
- [ ] Bottom nav tracking

---

## 📊 Custom Events Reference

### Standard GA4 Events (Used)
- `page_view` - Page/screen views
- `button_click` - Button interactions
- `form_submit` - Form submissions
- `search` - Search queries
- `exception` - Errors

### Custom Events (Rentman Specific)
- `auth_login` - User login
- `auth_signup` - User registration
- `auth_logout` - User logout
- `auth_login_failed` - Failed authentication
- `task_accept` - Task accepted
- `task_reject` - Task rejected
- `task_complete` - Task completed
- `task_cancel` - Task cancelled
- `task_view` - Task details viewed
- `message_send` - Message sent
- `message_read` - Message read
- `message_open_thread` - Thread opened
- `settings_change` - Setting modified
- `navigation` - Navigation event
- `feature_usage` - Feature used
- `task_completed` (conversion)
- `payment_received` (conversion)
- `first_task` (conversion)

---

## 🔧 Advanced Configuration

### Add Custom Dimensions (in GTM)
1. User ID
2. User Type (agent/issuer)
3. Task Type
4. Location (city/country)

### Set Up Goals (in GA4)
1. First Task Completed
2. 10 Tasks Completed
3. Account Created
4. Settings Configured

### Create Audiences
1. Active Users (last 7 days)
2. Task Completers
3. High-Value Users (>10 tasks)

---

## 📞 Support

**Analytics Questions:**
- GTM Container: GTM-WDCLWK4P
- GA4 Property: G-ND9PT413XV
- Documentation: SEO-ANALYTICS-MANUAL.md

**Implementation Help:**
- Check console logs in development
- Use GTM Preview mode
- Verify in GA4 Realtime

---

**Last Updated:** 2026-02-08
**Version:** 1.0
