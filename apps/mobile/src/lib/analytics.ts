/**
 * Analytics Tracking Utilities for Rentman Mobile
 * 
 * Uses Google Tag Manager (GTM-WDCLWK4P) and GA4 (G-ND9PT413XV)
 * 
 * Usage:
 * import { trackEvent, trackButtonClick, trackPageView } from '@/lib/analytics';
 * 
 * trackButtonClick('Accept Task', 'Task Details');
 * trackPageView('/contract/123');
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === 'undefined') return;
  
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      ...params,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', eventName, params);
  }
}

/**
 * Track button clicks
 */
export function trackButtonClick(
  buttonText: string,
  location: string,
  additionalParams?: Record<string, any>
) {
  trackEvent('button_click', {
    button_text: buttonText,
    button_location: location,
    event_label: buttonText,
    ...additionalParams,
  });
}

/**
 * Track page views
 */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || path,
    });
  }
}

/**
 * Track form submissions
 */
export function trackFormSubmit(
  formName: string,
  additionalParams?: Record<string, any>
) {
  trackEvent('form_submit', {
    form_name: formName,
    event_category: 'conversion',
    event_label: formName,
    ...additionalParams,
  });
}

/**
 * Track task-related events
 */
export function trackTaskEvent(
  action: 'view' | 'accept' | 'reject' | 'complete' | 'cancel',
  taskId: string,
  taskType?: string,
  additionalParams?: Record<string, any>
) {
  trackEvent(`task_${action}`, {
    task_id: taskId,
    task_type: taskType,
    event_category: 'task_management',
    event_label: `${action}_${taskId}`,
    ...additionalParams,
  });
}

/**
 * Track authentication events
 */
export function trackAuthEvent(
  action: 'login' | 'signup' | 'logout' | 'login_failed',
  method?: 'email' | 'google' | 'wallet',
  additionalParams?: Record<string, any>
) {
  trackEvent(`auth_${action}`, {
    auth_method: method,
    event_category: 'authentication',
    event_label: action,
    ...additionalParams,
  });
}

/**
 * Track navigation events
 */
export function trackNavigation(
  destination: string,
  source?: string
) {
  trackEvent('navigation', {
    destination,
    source,
    event_category: 'navigation',
    event_label: destination,
  });
}

/**
 * Track messaging/inbox events
 */
export function trackMessageEvent(
  action: 'send' | 'read' | 'open_thread',
  threadId?: string,
  additionalParams?: Record<string, any>
) {
  trackEvent(`message_${action}`, {
    thread_id: threadId,
    event_category: 'messaging',
    event_label: action,
    ...additionalParams,
  });
}

/**
 * Track settings changes
 */
export function trackSettingsChange(
  settingName: string,
  newValue: boolean | string | number,
  additionalParams?: Record<string, any>
) {
  trackEvent('settings_change', {
    setting_name: settingName,
    setting_value: newValue,
    event_category: 'settings',
    event_label: settingName,
    ...additionalParams,
  });
}

/**
 * Track errors
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  isFatal: boolean = false,
  additionalParams?: Record<string, any>
) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: `${errorType}: ${errorMessage}`,
      fatal: isFatal,
      ...additionalParams,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('📊 Analytics Error:', errorType, errorMessage);
  }
}

/**
 * Track conversions (high-value events)
 */
export function trackConversion(
  conversionType: 'task_completed' | 'payment_received' | 'first_task',
  value?: number,
  additionalParams?: Record<string, any>
) {
  trackEvent(conversionType, {
    event_category: 'conversion',
    value: value || 0,
    currency: 'USD',
    ...additionalParams,
  });
}

/**
 * Track search events
 */
export function trackSearch(
  searchTerm: string,
  resultsCount?: number,
  additionalParams?: Record<string, any>
) {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    event_category: 'engagement',
    ...additionalParams,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  featureName: string,
  action?: string,
  additionalParams?: Record<string, any>
) {
  trackEvent('feature_usage', {
    feature_name: featureName,
    feature_action: action,
    event_category: 'engagement',
    event_label: featureName,
    ...additionalParams,
  });
}
