'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Shield, Users, FileText, MessageSquare, Flag, CheckCircle, XCircle, Ban } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { adminService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { formatNumber, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'reports' | 'users'>('reports');

  if (!isAuthenticated || !user?.isAdmin) {
    router.push('/');
    return null;
  }

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports', tab],
    queryFn: () => adminService.getReports('PENDING'),
    enabled: tab === 'reports',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
    enabled: tab === 'users',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.resolveReport(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Report resolved'); },
    onError: () => toast.error('Failed to resolve report'),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      ban ? adminService.banUser(id) : adminService.unbanUser(id),
    onSuccess: (_, { ban }) => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success(ban ? 'User banned' : 'User unbanned'); },
    onError: () => toast.error('Action failed'),
  });

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Questions', value: stats?.totalQuestions, icon: FileText, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Answers', value: stats?.totalAnswers, icon: MessageSquare, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Pending Reports', value: stats?.pendingReports, icon: Flag, color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{formatNumber(value || 0)}</div>
              <div className="text-xs text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setTab('reports')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'reports' ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-zinc-500'}`}>
            Reports {stats?.pendingReports > 0 && <span className="ml-1 bg-red-100 text-red-600 text-xs rounded-full px-1.5">{stats.pendingReports}</span>}
          </button>
          <button onClick={() => setTab('users')} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'users' ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-zinc-500'}`}>
            Users
          </button>
        </div>

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {reportsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 m-4 rounded" />)
            ) : !reportsData?.data?.length ? (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                <Flag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No pending reports
              </div>
            ) : (
              reportsData.data.map((report: any) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs">{report.targetType}</span>
                        <span className="text-xs text-zinc-400">{timeAgo(report.createdAt)}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300"><span className="font-medium">Reason:</span> {report.reason}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Reported by {report.reporter.name} · Target ID: {report.targetId.slice(0, 8)}…</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'RESOLVED' })}
                        disabled={resolveMutation.isPending}
                        className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        title="Resolve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => resolveMutation.mutate({ id: report.id, status: 'DISMISSED' })}
                        disabled={resolveMutation.isPending}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        title="Dismiss"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {usersLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 m-4 rounded" />)
            ) : (
              usersData?.data?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-zinc-900 dark:text-white truncate">{u.name}</p>
                      {u.isBanned && <span className="badge bg-red-100 dark:bg-red-950/30 text-red-600 text-xs">Banned</span>}
                      {u.isAdmin && <span className="badge bg-brand-100 dark:bg-brand-950/30 text-brand-600 text-xs">Admin</span>}
                    </div>
                    <p className="text-xs text-zinc-400">@{u.username} · {u.email} · {u.reputation} rep</p>
                  </div>
                  <div className="text-xs text-zinc-400 hidden sm:block">
                    {u._count?.questions} Q · {u._count?.answers} A
                  </div>
                  {!u.isAdmin && (
                    <button
                      onClick={() => { if (confirm(u.isBanned ? 'Unban this user?' : 'Ban this user?')) banMutation.mutate({ id: u.id, ban: !u.isBanned }); }}
                      disabled={banMutation.isPending}
                      className={`p-1.5 rounded-lg border transition-colors ${u.isBanned ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}
                      title={u.isBanned ? 'Unban user' : 'Ban user'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
