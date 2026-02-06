"use client";

import { useState, useEffect } from 'react';

interface AppUsage {
  appName: string;
  bundleId: string;
  durationMinutes: number;
  limitMinutes?: number;
  exceeded: boolean;
}

interface AppGoal {
  id: string;
  appName: string;
  bundleId: string;
  dailyLimitMinutes: number;
  enableBlocking: boolean;
}

export function useScreenTime(userId: string) {
  const [todayUsage, setTodayUsage] = useState<AppUsage[]>([]);
  const [goals, setGoals] = useState<AppGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  useEffect(() => {
    if (userId) {
      loadUsageData();
      checkPermission();
    }
  }, [userId]);

  async function checkPermission() {
    // Check if device supports Screen Time API
    if ('screenTime' in navigator) {
      try {
        const status = await (navigator as any).screenTime.requestPermission();
        setPermission(status === 'granted' ? 'granted' : 'denied');
      } catch (err) {
        setPermission('denied');
      }
    } else {
      setPermission('denied');
    }
  }

  async function requestPermission() {
    if ('screenTime' in navigator) {
      try {
        const status = await (navigator as any).screenTime.requestPermission();
        setPermission(status === 'granted' ? 'granted' : 'denied');
        if (status === 'granted') {
          loadUsageData();
        }
        return status === 'granted';
      } catch (err) {
        setPermission('denied');
        return false;
      }
    }
    return false;
  }

  async function loadUsageData() {
    try {
      setLoading(true);
      const [usageRes, goalsRes] = await Promise.all([
        fetch(`/api/screen-time/today/${userId}`),
        fetch(`/api/screen-time/goals/${userId}`)
      ]);

      const usageData = await usageRes.json();
      const goalsData = await goalsRes.json();

      if (usageData.success) {
        setTodayUsage(usageData.usage);
      }
      if (goalsData.success) {
        setGoals(goalsData.goals);
      }
    } catch (err) {
      console.error('Error loading screen time data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function setAppGoal(appName: string, bundleId: string, dailyLimitMinutes: number, enableBlocking: boolean) {
    try {
      const res = await fetch('/api/screen-time/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          appName,
          bundleId,
          dailyLimitMinutes,
          enableBlocking
        })
      });

      const data = await res.json();
      if (data.success) {
        await loadUsageData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error setting goal:', err);
      return false;
    }
  }

  async function logAppUsage(appName: string, bundleId: string, durationMinutes: number) {
    try {
      const res = await fetch('/api/screen-time/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          appName,
          bundleId,
          durationMinutes,
          sessionStart: new Date(Date.now() - durationMinutes * 60000).toISOString(),
          sessionEnd: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (data.success && data.limitExceeded) {
        return {
          limitExceeded: true,
          remainingMinutes: data.limitInfo.remainingMinutes
        };
      }
      return { limitExceeded: false };
    } catch (err) {
      console.error('Error logging usage:', err);
      return { limitExceeded: false };
    }
  }

  return {
    todayUsage,
    goals,
    loading,
    permission,
    requestPermission,
    setAppGoal,
    logAppUsage,
    reload: loadUsageData
  };
}
