"use client";

import { useState } from 'react';
import { useScreenTime } from '@/hooks/useScreenTime';
import { Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  userId: string;
}

const commonApps = [
  { name: 'Instagram', bundleId: 'com.burbn.instagram', icon: '📸' },
  { name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', icon: '🎵' },
  { name: 'Twitter/X', bundleId: 'com.twitter.twitter-iphone', icon: '𝕏' },
  { name: 'Facebook', bundleId: 'com.facebook.Facebook', icon: '👤' },
  { name: 'YouTube', bundleId: 'com.google.ios.youtube', icon: '▶️' }
];

export default function ScreenTimeMonitor({ userId }: Props) {
  const { todayUsage, goals, permission, requestPermission, setAppGoal, loading } = useScreenTime(userId);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [limitMinutes, setLimitMinutes] = useState(30);
  const [enableBlocking, setEnableBlocking] = useState(false);

  async function handleRequestPermission() {
    const granted = await requestPermission();
    if (granted) {
      alert('✅ Permission granted! Sarah can now monitor your screen time.');
    } else {
      alert('❌ Permission denied. Sarah needs access to help you break bad habits.');
    }
  }

  async function handleSetGoal() {
    if (!selectedApp) return;
    
    const app = commonApps.find(a => a.bundleId === selectedApp);
    if (!app) return;

    const success = await setAppGoal(app.name, app.bundleId, limitMinutes, enableBlocking);
    if (success) {
      alert(`✅ Limit set for ${app.name}: ${limitMinutes} minutes/day`);
      setSelectedApp(null);
    }
  }

  if (permission === 'denied') {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-sarah-primary" />
          <h3 className="text-xl font-bold">Screen Time Monitoring</h3>
        </div>
        <p className="text-sarah-text-secondary mb-4">
          Sarah needs permission to monitor your app usage and help you break doomscrolling habits.
        </p>
        <button
          onClick={handleRequestPermission}
          className="btn-primary w-full"
        >
          Grant Permission
        </button>
      </div>
    );
  }

  if (permission === 'pending') {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-sarah-primary animate-spin" />
          <p>Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Usage */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-sarah-primary" />
          Today&apos;s Screen Time
        </h3>
        {loading ? (
          <p className="text-sarah-text-secondary">Loading...</p>
        ) : todayUsage.length === 0 ? (
          <p className="text-sarah-text-secondary">No usage data yet today</p>
        ) : (
          <div className="space-y-3">
            {todayUsage.map((usage, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-sarah-surface-hover rounded-xl">
                <div>
                  <p className="font-semibold">{usage.appName}</p>
                  <p className="text-sm text-sarah-text-secondary">
                    {usage.durationMinutes} min {usage.limitMinutes ? `/ ${usage.limitMinutes} min` : ''}
                  </p>
                </div>
                {usage.exceeded ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Limits */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sarah-primary" />
          Set App Limits
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Choose App</label>
            <select
              value={selectedApp || ''}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="w-full p-3 rounded-xl bg-sarah-surface border border-sarah-primary/20 focus:border-sarah-primary focus:outline-none"
            >
              <option value="">Select an app...</option>
              {commonApps.map(app => (
                <option key={app.bundleId} value={app.bundleId}>
                  {app.icon} {app.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Daily Limit: {limitMinutes} minutes
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={limitMinutes}
              onChange={(e) => setLimitMinutes(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableBlocking"
              checked={enableBlocking}
              onChange={(e) => setEnableBlocking(e.target.checked)}
              className="w-5 h-5 rounded accent-sarah-primary"
            />
            <label htmlFor="enableBlocking" className="text-sm">
              Enable Sarah&apos;s Hardcore Mode (blocks app until you complete a habit)
            </label>
          </div>

          <button
            onClick={handleSetGoal}
            disabled={!selectedApp}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set Limit
          </button>
        </div>
      </div>

      {/* Active Goals */}
      {goals.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Active Limits</h3>
          <div className="space-y-2">
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-sarah-surface-hover rounded-xl">
                <div>
                  <p className="font-semibold">{goal.appName}</p>
                  <p className="text-sm text-sarah-text-secondary">
                    Limit: {goal.dailyLimitMinutes} min/day
                  </p>
                </div>
                {goal.enableBlocking && (
                  <Shield className="w-5 h-5 text-sarah-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
