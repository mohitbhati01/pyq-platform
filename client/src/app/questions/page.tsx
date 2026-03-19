import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Plus, Loader2, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import QuestionCard from '@/components/question/QuestionCard';
import { questionService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Most Voted', value: 'votes' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Most Answered', value: 'answered' },
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [sort, setSort] = useState('newest');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [examName, setExamName] = useState(searchParams.get('examName') || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  // M-7 fix: Keep raw search state and debounce before sending to API
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 400);
  const tags = searchParams.get('tags') || '';

  const params = {
    sort,
    difficulty: difficulty || undefined,
    examName: examName || undefined,
    tags: tags || undefined,
    // M-7 fix: Only the debounced value goes to the API — not every keystroke
    search: debouncedSearch || undefined,
    page,
    limit: 15,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['questions', params],
    queryFn: () => questionService.getAll(params),
    placeholderData: (prev) => prev,
  });

  const { data: examsData } = useQuery({
    queryKey: ['exams'],
    queryFn: questionService.getExams,
    staleTime: Infinity,
  });

  const questions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Questions</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{data?.total?.toLocaleString() || 0} questions found</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={cn('btn-secondary flex items-center gap-1.5', showFilters && 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800')}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            {isAuthenticated && (
              <Link href="/questions/new" className="btn-primary flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Ask
              </Link>
            )}
          </div>
        </div>

        {/* M-7 fix: Search bar with debounce — API only called after 400ms of no typing */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
            className="input pl-9 w-full"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setPage(1); }}
              className={cn('px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', sort === opt.value ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400' : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100')}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 block">Difficulty</label>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setDifficulty('')} className={cn('badge cursor-pointer', !difficulty ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200')}>All</button>
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setDifficulty(difficulty === d ? '' : d)} className={cn('badge cursor-pointer', difficulty === d ? (d === 'EASY' ? 'badge-easy' : d === 'MEDIUM' ? 'badge-medium' : 'badge-hard') : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200')}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 block">Exam</label>
              {/* H-5 fix: Reset page when exam filter changes */}
              <select value={examName} onChange={(e) => { setExamName(e.target.value); setPage(1); }} className="input text-sm">
                <option value="">All exams</option>
                {examsData?.map((e: any) => (
                  <option key={e.examName} value={e.examName}>{e.examName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setDifficulty(''); setExamName(''); setPage(1); }} className="btn-ghost text-sm text-zinc-500">
                Reset filters
              </button>
            </div>
          </div>
        )}

        {/* Question list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="card p-4">
                <div className="flex gap-3">
                  <div className="space-y-2"><div className="skeleton w-10 h-5" /><div className="skeleton w-10 h-4" /></div>
                  <div className="flex-1 space-y-2"><div className="skeleton h-5 w-3/4" /><div className="skeleton h-4 w-1/2" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">No questions found. Try adjusting your filters.</p>
            {isAuthenticated && (
              <Link href="/questions/new" className="btn-primary mt-4 inline-flex">Ask the first question</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 relative">
            {isFetching && !isLoading && (
              <div className="absolute top-2 right-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              </div>
            )}
            {questions.map((q: any) => <QuestionCard key={q.id} question={q} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
            <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
