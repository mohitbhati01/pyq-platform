'use client';

import Link from 'next/link';
import { MessageSquare, Eye, ChevronUp, Bookmark, BookmarkCheck, CheckCircle2 } from 'lucide-react';
import { Question } from '@/types';
import { cn, timeAgo, difficultyColor, formatNumber } from '@/lib/utils';
import { Avatar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { questionService } from '@/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface QuestionCardProps {
  question: Question;
  compact?: boolean;
}

export default function QuestionCard({ question, compact = false }: QuestionCardProps) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: () => questionService.toggleBookmark(question.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success(data.bookmarked ? 'Bookmarked' : 'Removed from bookmarks');
    },
    onError: () => toast.error('Failed to update bookmark'),
  });

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please log in to bookmark'); return; }
    bookmarkMutation.mutate();
  };

  const hasAcceptedAnswer = false; // Could be derived from question data

  return (
    <article className={cn('card p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group', compact && 'p-3')}>
      <div className="flex gap-3">
        {/* Stats column */}
        <div className="flex flex-col items-center gap-2 pt-0.5 min-w-[48px] text-center">
          <div className={cn('text-sm font-semibold', question.voteScore > 0 ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-500 dark:text-zinc-400')}>
            <ChevronUp className="w-4 h-4 mx-auto text-zinc-400" />
            {formatNumber(question.voteScore)}
          </div>
          <div className={cn('text-xs', (question._count?.answers || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-400')}>
            <MessageSquare className="w-3.5 h-3.5 mx-auto mb-0.5" />
            {formatNumber(question._count?.answers || 0)}
          </div>
          <div className="text-xs text-zinc-400">
            <Eye className="w-3.5 h-3.5 mx-auto mb-0.5" />
            {formatNumber(question.viewCount)}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/questions/${question.id}`} className="flex-1">
              <h2 className={cn('font-semibold text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2', compact ? 'text-sm' : 'text-base')}>
                {question.title}
              </h2>
            </Link>
            <button
              onClick={handleBookmark}
              disabled={bookmarkMutation.isPending}
              className="shrink-0 p-1 rounded text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              title={question.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              {question.isBookmarked
                ? <BookmarkCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          {/* Tags + meta */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn('badge', difficultyColor(question.difficulty))}>
              {question.difficulty}
            </span>
            <span className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {question.examName} {question.examYear}
            </span>
            {question.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/questions?tags=${tag}`} className="badge badge-tag" onClick={(e) => e.stopPropagation()}>
                {tag}
              </Link>
            ))}
            {question.tags.length > 3 && (
              <span className="text-xs text-zinc-400">+{question.tags.length - 3}</span>
            )}
          </div>

          {/* Author + time */}
          <div className="flex items-center gap-2 mt-3">
            <Avatar user={question.author} size="sm" />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <Link href={`/profile/${question.author.username}`} className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                {question.author.name}
              </Link>
              {' · '}
              {timeAgo(question.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
