'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface VoteButtonsProps {
  score: number;
  userVote?: 'UP' | 'DOWN' | null;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  vertical?: boolean;
}

export default function VoteButtons({ score, userVote, onVote, disabled, vertical = true }: VoteButtonsProps) {
  const { isAuthenticated } = useAuthStore();

  const handleVote = (value: 1 | -1) => {
    if (!isAuthenticated) { toast.error('Please log in to vote'); return; }
    onVote(value);
  };

  return (
    <div className={cn('flex items-center gap-1', vertical ? 'flex-col' : 'flex-row')}>
      <button
        onClick={() => handleVote(1)}
        disabled={disabled}
        className={cn(
          'vote-btn w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
          userVote === 'UP'
            ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400'
            : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Upvote"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <span className={cn(
        'text-sm font-bold min-w-[24px] text-center',
        score > 0 ? 'text-brand-600 dark:text-brand-400'
          : score < 0 ? 'text-red-500 dark:text-red-400'
          : 'text-zinc-500 dark:text-zinc-400'
      )}>
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={disabled}
        className={cn(
          'vote-btn w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
          userVote === 'DOWN'
            ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-500 dark:text-red-400'
            : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title="Downvote"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}
