'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import QuestionCard from '@/components/question/QuestionCard';
import { questionService } from '@/services';
import { useDebounce } from '@/hooks';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => questionService.getAll({ search: q, limit: 20 }),
    enabled: q.length > 1,
  });

  const questions = data?.data || [];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-zinc-400" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
          {data && <span className="text-sm text-zinc-400">({data.total} found)</span>}
        </div>

        {!q && (
          <div className="card p-12 text-center text-zinc-500">
            Enter a search term in the navigation bar above
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
          </div>
        )}

        {q && !isLoading && questions.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No results found for "{q}"</p>
            <p className="text-sm text-zinc-400 mt-1">Try different keywords or browse by exam</p>
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((q: any) => <QuestionCard key={q.id} question={q} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
