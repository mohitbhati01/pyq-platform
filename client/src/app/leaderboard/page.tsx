'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Trophy, Medal } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar } from '@/components/layout/Navbar';
import { userService } from '@/services';
import { cn, formatNumber, reputationToLevel } from '@/lib/utils';

export default function LeaderboardPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => userService.getLeaderboard(50),
  });

  const rankColor = (i: number) => {
    if (i === 0) return 'text-amber-500';
    if (i === 1) return 'text-zinc-400';
    if (i === 2) return 'text-amber-600';
    return 'text-zinc-300 dark:text-zinc-600';
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Leaderboard</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Top contributors ranked by reputation</p>
          </div>
        </div>

        {/* Top 3 podium */}
        {!isLoading && users.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8">
            {[users[1], users[0], users[2]].map((u: any, podiumIdx) => {
              const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights = ['h-24', 'h-32', 'h-20'];
              return (
                <Link key={u.id} href={`/profile/${u.username}`} className="flex flex-col items-center gap-2 group">
                  <Avatar user={u} size="lg" />
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 text-center">{u.name.split(' ')[0]}</div>
                  <div className={cn('w-20 rounded-t-xl flex items-center justify-center text-2xl font-bold', heights[podiumIdx],
                    rank === 1 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                    rank === 2 ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
                    'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-600'
                  )}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="skeleton w-8 h-5" />
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-20" /></div>
                <div className="skeleton w-16 h-5" />
              </div>
            ))
          ) : (
            users.map((u: any, i: number) => (
              <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <div className={cn('w-8 text-center font-bold text-lg', rankColor(i))}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                </div>
                <Avatar user={u} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{u.name}</p>
                  <p className="text-xs text-zinc-500">@{u.username} · {reputationToLevel(u.reputation)}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatNumber(u._count?.questions || 0)} Qs</span>
                  <span>{formatNumber(u._count?.answers || 0)} As</span>
                  <div className="text-sm font-bold text-brand-600 dark:text-brand-400 min-w-[48px] text-right">
                    {formatNumber(u.reputation)} rep
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
