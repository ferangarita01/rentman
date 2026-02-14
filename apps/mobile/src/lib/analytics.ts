/**
 * Analytics Tracking Utilities for Rentman Mobile
 * 
 * Uses Google Tag Manager (GTM-WDCLWK4P) and GA4 (G-ND9PT413XV)
 * Integration with Native Firebase Analytics for Android/iOS
 * 
 * Usage:
 * import { trackEvent, trackButtonClick, trackPageView } from '@/lib/analytics';
 * 
 * trackButtonClick('Accept Task', 'Task Details');
 * trackPageView('/contract/123');
 */

import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { Capacitor } from '@capacitor/core';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const isNative = Capacitor.isNativePlatform();

type AnalyticsParamValue = string | number | boolean | undefined | null;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

/**
 * Track custom events
 */
export async function trackEvent(
  eventName: string,
  params?: AnalyticsParams
) {
  try {
    // Native Analytics (Android/iOS)
    if (isNative) {
      // Clean params to remove undefined/null for Firebase
      const cleanParams: Record<string, string | number | boolean> = {};

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            cleanParams[key] = value;
          }
        });
      }

      await FirebaseAnalytics.logEvent({
        name: eventName,
        params: cleanParams,
      });
    }
    // Web Analytics (GTAG)
    else if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'engagement',
        ...params,
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Analytics Event (${isNative ? 'Native' : 'Web'}):`, eventName, params);
    }
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
}

/**
 * Track button clicks
 */
export function trackButtonClick(
  buttonText: string,
  location: string,
  additionalParams?: AnalyticsParams
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
export async function trackPageView(path: string, title?: string) {
  try {
    if (isNative) {
      await FirebaseAnalytics.setCurrentScreen({
        screenName: title || path,
        screenClassOverride: title || path,
      });
      // Also log as an event since GA4 is event-based
      await FirebaseAnalytics.logEvent({
        name: 'screen_view',
        params: {
          firebase_screen: title || path,
          firebase_screen_class: title || path,
        },
      });
    } else if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || path,
      });
    }
  } catch (error) {
    console.error('Failed to log page view:', error);
  }
}

/**
 * Track form submissions
 */
export function trackFormSubmit(
  formName: string,
  additionalParams?: AnalyticsParams
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
  additionalParams?: AnalyticsParams
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
export async function trackAuthEvent(
  action: 'login' | 'signup' | 'logout' | 'login_failed',
  method?: 'email' | 'google' | 'wallet',
  additionalParams?: AnalyticsParams
) {
  if (isNative && action === 'login' && method) {
    try {
      const userId = additionalParams?.userId;
      await FirebaseAnalytics.setUserId({
        userId: typeof userId === 'string' ? userId : 'unknown'
      });
    } catch (e) {
      console.warn('Failed to set User ID', e);
    }
  }

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
  additionalParams?: AnalyticsParams
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
  additionalParams?: AnalyticsParams
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
  additionalParams?: AnalyticsParams
) {
  trackEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: isFatal,
    ...additionalParams
  });

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
  additionalParams?: AnalyticsParams
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
  additionalParams?: AnalyticsParams
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
  additionalParams?: AnalyticsParams
) {
  trackEvent('feature_usage', {
    feature_name: featureName,
    feature_action: action,
    event_category: 'engagement',
    event_label: featureName,
    ...additionalParams,
  });
}
