
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    data?: any;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch initial data & subscribe
    useEffect(() => {
        let mounted = true;
        let channel: any;

        const fetchNotifications = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch recent 20
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (mounted && data) {
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }

            // Realtime Subscription
            channel = supabase
                .channel('dashboard-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${session.user.id}`
                    },
                    (payload: any) => {
                        const newNotif = payload.new as Notification;
                        if (mounted) {
                            setNotifications(prev => [newNotif, ...prev]);
                            setUnreadCount(prev => prev + 1);
                        }
                    }
                )
                .subscribe();
        };

        fetchNotifications();

        // Click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            mounted = false;
            if (channel) supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-[#00ff88]/30 transition-all relative"
            >
                <span className={`material-symbols-outlined text-sm ${unreadCount > 0 ? 'text-[#00ff88]' : 'text-slate-500'}`}>
                    notifications
                </span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#050505] flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-[#00ff88]/20 rounded-lg shadow-[0_0_20px_rgba(0,255,136,0.1)] z-50 overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-[#080808]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-[9px] text-[#00ff88] hover:underline cursor-pointer">
                                MARK_ALL_READ
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center opacity-40">
                                <span className="material-symbols-outlined text-2xl mb-2 text-slate-600">notifications_off</span>
                                <p className="text-[10px] text-slate-500 uppercase">No updates yet</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                    className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.is_read ? 'bg-[#00ff88]/5' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[11px] font-mono ${!notif.is_read ? 'text-[#00ff88]' : 'text-slate-300'}`}>
                                            {notif.title}
                                        </span>
                                        {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] mt-1.5"></span>}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-normal mb-1">{notif.message}</p>
                                    <span className="text-[8px] text-slate-600 uppercase">
                                        {new Date(notif.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
