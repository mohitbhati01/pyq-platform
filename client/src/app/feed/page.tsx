'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Users } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import QuestionCard from '@/components/question/QuestionCard';
import { feedService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function FeedPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'following' | 'trending'>('following');
  const [page, setPage] = useState(1);

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const { data, isLoading } = useQuery({
    queryKey: ['feed', tab, page],
    queryFn: () => tab === 'following' ? feedService.getFeed(page) : feedService.getTrending(page),
    placeholderData: (prev) => prev,
  });

  const questions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Feed</h1>
        </div>

        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          <button onClick={() => { setTab('following'); setPage(1); }} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === 'following' ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100')}>
            <Users className="w-4 h-4" /> Following
          </button>
          <button onClick={() => { setTab('trending'); setPage(1); }} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === 'trending' ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100')}>
            <Flame className="w-4 h-4" /> Trending
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
        ) : questions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-2">
              {tab === 'following' ? 'No questions from people you follow yet.' : 'No trending questions this week.'}
            </p>
            {tab === 'following' && <p className="text-sm text-zinc-400">Try following some top contributors from the <a href="/leaderboard" className="text-brand-600 hover:underline">leaderboard</a>.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q: any) => <QuestionCard key={q.id} question={q} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
            <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
