'use client';

import { useQuery } from '@tanstack/react-query';
import { BookmarkIcon } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import QuestionCard from '@/components/question/QuestionCard';
import { userService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => userService.getBookmarks(),
  });

  const questions = data?.data || [];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 dark:bg-brand-950/50 rounded-xl flex items-center justify-center">
            <BookmarkIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Bookmarks</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{data?.total || 0} saved questions</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
        ) : questions.length === 0 ? (
          <div className="card p-12 text-center">
            <BookmarkIcon className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-500 dark:text-zinc-400">No bookmarks yet</p>
            <p className="text-sm text-zinc-400 mt-1">Bookmark questions to save them for later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q: any) => <QuestionCard key={q.id} question={{ ...q, isBookmarked: true }} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
