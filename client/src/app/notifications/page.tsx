'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar } from '@/components/layout/Navbar';
import { notificationService } from '@/services';
import { timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const NOTIF_LABELS: Record<string, string> = {
  NEW_ANSWER: 'answered your question',
  ANSWER_ACCEPTED: 'accepted your answer',
  COMMENT_ON_QUESTION: 'commented on your question',
  COMMENT_ON_ANSWER: 'commented on your answer',
  MENTION: 'mentioned you',
  NEW_FOLLOWER: 'started following you',
  QUESTION_UPVOTE: 'upvoted your question',
  ANSWER_UPVOTE: 'upvoted your answer',
  BADGE_EARNED: 'You earned a new badge!',
};

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const getNotifLink = (n: any) => {
    if (n.resourceType === 'question') return `/questions/${n.resourceId}`;
    if (n.resourceType === 'answer') return `/questions/${n.resourceId}`;
    if (n.resourceType === 'user') return `/profile/${n.actor.username}`;
    return '#';
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 dark:bg-brand-950/50 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-zinc-500">{unreadCount} unread</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className="btn-ghost text-sm flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1"><div className="skeleton h-4 w-48" /><div className="skeleton h-3 w-24" /></div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <a key={n.id} href={getNotifLink(n)} className={cn('flex items-start gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors', !n.isRead && 'bg-brand-50/50 dark:bg-brand-950/20')}>
                {!n.isRead && <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
                <Avatar user={n.actor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-semibold text-zinc-900 dark:text-white">{n.actor.name}</span>
                    {' '}{NOTIF_LABELS[n.type] || n.type}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
