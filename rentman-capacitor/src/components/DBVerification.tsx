'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Database Verification Component
 * Shows connection status, table access, and data counts
 */
export default function DBVerification() {
    const { user } = useAuth();
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const runDiagnostics = async () => {
        if (!user) {
            toast.error('No user logged in');
            return;
        }

        setLoading(true);
        const diagnostics: any = {
            userId: user.id,
            timestamp: new Date().toISOString(),
            tests: []
        };

        try {
            // Test 1: Check connection
            diagnostics.tests.push({
                name: 'Supabase Connection',
                status: 'testing'
            });

            const { data: connectionTest, error: connError } = await supabase
                .from('habits')
                .select('count')
                .limit(1);

            if (connError) {
                diagnostics.tests[0].status = 'failed';
                diagnostics.tests[0].error = connError.message;
                toast.error('Connection failed');
            } else {
                diagnostics.tests[0].status = 'passed';
                toast.success('Connected to Supabase');
            }

            // Test 2: Count habit_logs (all)
            const { count: totalLogs, error: countError } = await supabase
                .from('habit_logs')
                .select('*', { count: 'exact', head: true });

            diagnostics.tests.push({
                name: 'Total habit_logs in DB',
                count: totalLogs,
                status: countError ? 'failed' : 'passed',
                error: countError?.message
            });

            // Test 3: Count user's habit_logs
            const { count: userLogs, error: userError } = await supabase
                .from('habit_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            diagnostics.tests.push({
                name: 'User habit_logs',
                count: userLogs,
                status: userError ? 'failed' : 'passed',
                error: userError?.message
            });

            if (userError) {
                toast.error(`RLS Error: ${userError.message}`);
            } else {
                toast(`Found ${userLogs || 0} logs for this user`, {
                    icon: '📊',
                    duration: 3000
                });
            }

            // Test 4: Fetch actual logs
            const { data: logs, error: fetchError } = await supabase
                .from('habit_logs')
                .select('id, habit_id, user_id, completed_at, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            diagnostics.tests.push({
                name: 'Fetch user logs',
                count: logs?.length || 0,
                status: fetchError ? 'failed' : 'passed',
                error: fetchError?.message,
                sample: logs?.slice(0, 3)
            });

            // Test 5: Check RLS policies (skip if RPC not available)
            try {
                const { data: policies, error: policyError } = await supabase
                    .rpc('get_table_policies', { table_name: 'habit_logs' });

                diagnostics.tests.push({
                    name: 'RLS Policies',
                    status: policyError ? 'unknown' : 'checked',
                    policies: policies || 'N/A'
                });
            } catch (e) {
                diagnostics.tests.push({
                    name: 'RLS Policies',
                    status: 'skipped',
                    note: 'RPC not available'
                });
            }

            // Test 6: Check habits table
            const { count: habitsCount, error: habitsError } = await supabase
                .from('habits')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            diagnostics.tests.push({
                name: 'User habits',
                count: habitsCount,
                status: habitsError ? 'failed' : 'passed'
            });

            setResults(diagnostics);

            // Summary toast
            const passedTests = diagnostics.tests.filter((t: any) => t.status === 'passed').length;
            const totalTests = diagnostics.tests.length;
            
            if (passedTests === totalTests) {
                toast.success(`✅ All tests passed (${passedTests}/${totalTests})`);
            } else {
                toast.error(`⚠️ ${totalTests - passedTests} tests failed`);
            }

        } catch (error: any) {
            toast.error(`Fatal error: ${error.message}`);
            diagnostics.tests.push({
                name: 'Fatal Error',
                status: 'failed',
                error: error.message
            });
            setResults(diagnostics);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Database Diagnostics</h2>
                <button
                    onClick={runDiagnostics}
                    disabled={loading || !user}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                    {loading ? 'Testing...' : 'Run Tests'}
                </button>
            </div>

            {!user && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    ⚠️ Please login first
                </div>
            )}

            {results && (
                <div className="space-y-3">
                    <div className="p-4 bg-card-bg border border-card-border rounded-lg">
                        <div className="text-xs opacity-60 mb-2">User ID</div>
                        <div className="font-mono text-xs">{results.userId}</div>
                    </div>

                    {results.tests.map((test: any, i: number) => (
                        <div
                            key={i}
                            className={`p-4 border rounded-lg ${
                                test.status === 'passed'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : test.status === 'failed'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-gray-500/10 border-gray-500/30'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">{test.name}</div>
                                <div className="text-xs">
                                    {test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️'}
                                </div>
                            </div>
                            
                            {test.count !== undefined && (
                                <div className="text-sm opacity-80">Count: {test.count}</div>
                            )}
                            
                            {test.error && (
                                <div className="text-xs text-red-400 mt-2 font-mono">
                                    Error: {test.error}
                                </div>
                            )}
                            
                            {test.sample && (
                                <div className="text-xs opacity-60 mt-2">
                                    Sample: {JSON.stringify(test.sample, null, 2)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
