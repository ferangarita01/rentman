'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, FireIcon, PlusIcon } from '@heroicons/react/24/outline';

interface UsageData {
  app_name: string;
  total_minutes: number;
  limit: number;
  percentage: number;
}

export default function UsageTrackerWidget() {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState({
    app_name: '',
    usage_minutes: 15
  });
  const [loading, setLoading] = useState(true);
  const [interventionMessage, setInterventionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTodayUsage();
    // Refresh every 5 minutes
    const interval = setInterval(loadTodayUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadTodayUsage() {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase.auth.token');
      
      const [usageRes, goalsRes] = await Promise.all([
        fetch('/api/screen-time/today', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/screen-time/goals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const usageData = await usageRes.json();
      const goalsData = await goalsRes.json();

      // Combine usage with goals
      const combined = goalsData.goals.map((goal: any) => {
        const used = usageData.usage.find((u: any) => u.app_name === goal.app_name);
        const totalMinutes = used?.total_minutes || 0;
        
        return {
          app_name: goal.app_name,
          total_minutes: totalMinutes,
          limit: goal.daily_limit_minutes,
          percentage: (totalMinutes / goal.daily_limit_minutes) * 100
        };
      });

      setUsage(combined);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  }

  async function logUsage() {
    try {
      const res = await fetch('/api/screen-time/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(logData)
      });

      const data = await res.json();

      // Show Sarah's intervention if any
      if (data.intervention) {
        setInterventionMessage(data.intervention.message);
        setTimeout(() => setInterventionMessage(null), 5000);
      }

      setShowLogModal(false);
      setLogData({ app_name: '', usage_minutes: 15 });
      loadTodayUsage();
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  }

  const totalScreenTime = usage.reduce((sum, u) => sum + u.total_minutes, 0);

  if (loading && usage.length === 0) {
    return (
      <div className="neubrutalist p-4 bg-surface-elevated">
        <p className="text-secondary-global text-center">Loading screen time...</p>
      </div>
    );
  }

  if (usage.length === 0) {
    return (
      <div className="neubrutalist p-6 bg-surface-elevated text-center">
        <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--sarah-primary)' }} />
        <p className="text-secondary-global mb-2">
          No screen time goals yet
        </p>
        <p className="text-sm text-muted-global">
          Set app limits in Settings to track your usage
        </p>
      </div>
    );
  }

  return (
    <div className="neubrutalist p-4 bg-surface-elevated">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5" style={{ color: 'var(--sarah-primary)' }} />
          <h3 className="font-bold text-primary-global">Screen Time Today</h3>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="text-sm px-3 py-1 rounded-lg font-medium neubrutalist transition-opacity hover:opacity-80"
          style={{ 
            background: 'var(--sarah-primary)',
            color: 'var(--sarah-text-on-primary)'
          }}
        >
          <PlusIcon className="w-4 h-4 inline mr-1" />
          Log Time
        </button>
      </div>

      {/* Total */}
      <div className="mb-4 p-3 rounded-lg neubrutalist" style={{ background: 'var(--sarah-surface-hover)' }}>
        <div className="text-3xl font-bold text-primary-global">
          {Math.floor(totalScreenTime / 60)}h {totalScreenTime % 60}m
        </div>
        <div className="text-sm text-secondary-global">
          Total screen time
        </div>
      </div>

      {/* Per App */}
      <div className="space-y-3">
        {usage.map((app) => (
          <div key={app.app_name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-primary-global">
                {app.app_name}
              </span>
              <span className={`font-bold ${
                app.percentage >= 100 
                  ? 'text-red-600 dark:text-red-400' 
                  : app.percentage >= 80
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-secondary-global'
              }`}>
                {app.total_minutes} / {app.limit} min
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-surface rounded-full overflow-hidden neubrutalist-inset">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(app.percentage, 100)}%`,
                  background: app.percentage >= 100 
                    ? 'var(--sarah-error)' 
                    : app.percentage >= 80
                    ? 'var(--sarah-warning, #FF9500)'
                    : 'var(--sarah-primary)'
                }}
              />
            </div>

            {app.percentage >= 100 && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
                <FireIcon className="w-4 h-4" />
                <span>Over limit! Complete a habit to earn more time</span>
              </div>
            )}
            
            {app.percentage >= 80 && app.percentage < 100 && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-1">
                <FireIcon className="w-4 h-4" />
                <span>Almost at limit ({Math.round(app.percentage)}%)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Intervention Message */}
      {interventionMessage && (
        <div className="mt-4 p-3 rounded-lg neubrutalist bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
            💬 AI says: {interventionMessage}
          </p>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="neubrutalist max-w-sm w-full p-6 bg-surface-elevated">
            <h3 className="text-xl font-bold text-primary-global mb-4">
              Log App Usage
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                Which app?
              </label>
              <select
                value={logData.app_name}
                onChange={(e) => setLogData({ ...logData, app_name: e.target.value })}
                className="neubrutalist w-full px-4 py-2 bg-surface text-primary-global focus:ring-2"
                style={{ '--tw-ring-color': 'var(--sarah-primary)' } as any}
              >
                <option value="">Select app...</option>
                {usage.map((app) => (
                  <option key={app.app_name} value={app.app_name}>
                    {app.app_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                How long? (minutes)
              </label>
              <input
                type="number"
                value={logData.usage_minutes}
                onChange={(e) => setLogData({ ...logData, usage_minutes: parseInt(e.target.value) || 0 })}
                min="1"
                max="180"
                className="neubrutalist w-full px-4 py-2 bg-surface text-primary-global"
              />
              <p className="text-xs text-muted-global mt-1">
                Quick options:
              </p>
              <div className="flex gap-2 mt-2">
                {[15, 30, 45, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => setLogData({ ...logData, usage_minutes: min })}
                    className={`neubrutalist px-3 py-1 text-sm transition-colors ${
                      logData.usage_minutes === min
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-surface-hover'
                    }`}
                    style={logData.usage_minutes === min ? {
                      background: 'var(--sarah-primary)',
                      color: 'var(--sarah-text-on-primary)'
                    } : {}}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="neubrutalist flex-1 py-3 bg-surface font-medium text-primary-global hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logUsage}
                disabled={!logData.app_name || logData.usage_minutes < 1}
                className="neubrutalist flex-1 py-3 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: 'var(--sarah-gradient-cta)' }}
              >
                Log Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
