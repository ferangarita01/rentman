'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface AppGoal {
  id: string;
  app_name: string;
  daily_limit_minutes: number;
  intervention_level: 'gentle' | 'firm' | 'hardcore';
  notification_enabled: boolean;
}

const POPULAR_APPS = [
  { name: 'TikTok', emoji: '🎵', avgUsage: '2h 15m' },
  { name: 'Instagram', emoji: '📸', avgUsage: '1h 45m' },
  { name: 'Twitter/X', emoji: '🐦', avgUsage: '1h 20m' },
  { name: 'YouTube', emoji: '📺', avgUsage: '2h 30m' },
  { name: 'Facebook', emoji: '👥', avgUsage: '55m' },
  { name: 'Reddit', emoji: '🤖', avgUsage: '1h 10m' },
];

export default function ScreenTimeSettings() {
  const [goals, setGoals] = useState<AppGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    app_name: '',
    daily_limit_minutes: 30,
    intervention_level: 'gentle' as const
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoading(true);
      const res = await fetch('/api/screen-time/goals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addGoal() {
    try {
      const res = await fetch('/api/screen-time/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(newGoal)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewGoal({ app_name: '', daily_limit_minutes: 30, intervention_level: 'gentle' });
        loadGoals();
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm('Remove this app limit?')) return;

    try {
      await fetch(`/api/screen-time/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }

  if (loading) {
    return (
      <div className="neubrutalist p-8 text-center bg-surface-elevated">
        <p className="text-secondary-global">Loading screen time settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Cog6ToothIcon className="w-6 h-6" style={{ color: 'var(--sarah-primary)' }} />
          <h2 className="text-2xl font-bold text-primary-global">
            Screen Time Goals
          </h2>
        </div>
        <p className="text-secondary-global">
          Sarah will help you stay accountable to your app limits
        </p>
      </div>

      {/* Current Goals */}
      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="neubrutalist p-4 bg-surface-elevated hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {POPULAR_APPS.find(a => a.name === goal.app_name)?.emoji || '📱'}
                    </span>
                    <div>
                      <h3 className="font-bold text-primary-global">
                        {goal.app_name}
                      </h3>
                      <p className="text-sm text-secondary-global">
                        {goal.daily_limit_minutes} min/day limit
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Intervention Level Badge */}
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold neubrutalist ${goal.intervention_level === 'hardcore'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : goal.intervention_level === 'firm'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}
                  >
                    {goal.intervention_level.toUpperCase()}
                  </span>

                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    aria-label="Delete app limit"
                  >
                    <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="neubrutalist p-8 text-center bg-surface-elevated">
          <p className="text-secondary-global mb-4">
            No app limits set yet. Add one to get started!
          </p>
          <p className="text-sm text-muted-global">
            Sarah will nudge you when you exceed your limits 📱
          </p>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="neubrutalist w-full py-4 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        style={{ background: 'var(--sarah-gradient-cta)' }}
      >
        <PlusIcon className="w-6 h-6 inline mr-2" />
        Add App Limit
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="neubrutalist max-w-md w-full p-6 bg-surface-elevated max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-primary-global mb-4">
              Set App Limit
            </h3>

            {/* Quick Select Popular Apps */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                Popular Apps
              </label>
              <div className="grid grid-cols-3 gap-2">
                {POPULAR_APPS.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => setNewGoal({ ...newGoal, app_name: app.name })}
                    className={`neubrutalist p-3 text-center transition-all hover:bg-surface-hover ${newGoal.app_name === app.name
                        ? 'ring-2 ring-offset-2'
                        : ''
                      }`}
                    style={newGoal.app_name === app.name ? {
                      '--tw-ring-color': 'var(--sarah-primary)',
                      '--tw-ring-offset-color': 'var(--sarah-surface)'
                    } as React.CSSProperties : {}}
                  >
                    <div className="text-2xl mb-1">{app.emoji}</div>
                    <div className="text-xs font-medium text-primary-global">
                      {app.name}
                    </div>
                    <div className="text-xs text-muted-global">
                      Avg: {app.avgUsage}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom App Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                Or enter custom app name
              </label>
              <input
                type="text"
                value={newGoal.app_name}
                onChange={(e) => setNewGoal({ ...newGoal, app_name: e.target.value })}
                placeholder="e.g., Netflix"
                className="neubrutalist w-full px-4 py-2 bg-surface text-primary-global placeholder-muted-global focus:ring-2"
                style={{ '--tw-ring-color': 'var(--sarah-primary)' } as any}
              />
            </div>

            {/* Daily Limit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                Daily Limit (minutes)
              </label>
              <input
                type="number"
                value={newGoal.daily_limit_minutes}
                onChange={(e) => setNewGoal({ ...newGoal, daily_limit_minutes: parseInt(e.target.value) })}
                min="5"
                max="300"
                step="5"
                className="neubrutalist w-full px-4 py-2 bg-surface text-primary-global"
              />
              <p className="text-xs text-muted-global mt-1">
                = {Math.floor(newGoal.daily_limit_minutes / 60)}h {newGoal.daily_limit_minutes % 60}m per day
              </p>
            </div>

            {/* Intervention Level */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-global mb-2">
                Sarah's Intervention Style
              </label>
              <div className="space-y-2">
                {[
                  { value: 'gentle', label: 'Gentle', desc: 'Friendly reminders 😊' },
                  { value: 'firm', label: 'Firm', desc: 'Must complete 1 habit ⚠️' },
                  { value: 'hardcore', label: 'Hardcore', desc: 'Complete ALL habits 😈' }
                ].map((level) => (
                  <label
                    key={level.value}
                    className="neubrutalist flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-hover transition-colors"
                  >
                    <input
                      type="radio"
                      name="intervention_level"
                      value={level.value}
                      checked={newGoal.intervention_level === level.value}
                      onChange={(e) => setNewGoal({ ...newGoal, intervention_level: e.target.value as any })}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--sarah-primary)' }}
                    />
                    <div>
                      <div className="font-medium text-primary-global">
                        {level.label}
                      </div>
                      <div className="text-xs text-secondary-global">
                        {level.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="neubrutalist flex-1 py-3 bg-surface font-medium text-primary-global hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                disabled={!newGoal.app_name || newGoal.daily_limit_minutes < 5}
                className="neubrutalist flex-1 py-3 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: 'var(--sarah-gradient-cta)' }}
              >
                Set Limit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
