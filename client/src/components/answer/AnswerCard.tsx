'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Answer } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import VoteButtons from './VoteButtons';
import { Avatar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/auth.store';
import { answerService, aiService } from '@/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import RichEditor from '@/components/editor/RichEditor';

interface AnswerCardProps {
  answer: Answer;
  questionAuthorId: string;
  questionId: string;
  questionContext?: string;
}

export default function AnswerCard({ answer, questionAuthorId, questionId, questionContext }: AnswerCardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [improving, setImproving] = useState(false);

  const isAuthor = user?.id === answer.author.id;
  const isQuestionOwner = user?.id === questionAuthorId;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['answers', questionId] });
  };

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => answerService.vote(answer.id, value),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to vote'),
  });

  const acceptMutation = useMutation({
    mutationFn: () => answerService.accept(answer.id),
    onSuccess: () => { invalidate(); toast.success('Answer accepted!'); },
    onError: () => toast.error('Failed to accept answer'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => answerService.delete(answer.id),
    onSuccess: () => { invalidate(); toast.success('Answer deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const editMutation = useMutation({
    mutationFn: () => answerService.update(answer.id, { body: editBody }),
    onSuccess: () => { invalidate(); setEditing(false); toast.success('Answer updated'); },
    onError: () => toast.error('Failed to update'),
  });

  const handleImproveWithAI = async () => {
    if (!questionContext) return;
    setImproving(true);
    try {
      const improved = await aiService.improveAnswer(editBody, questionContext);
      setEditBody(improved);
      toast.success('AI improved your answer!');
    } catch {
      toast.error('AI improvement failed');
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className={cn('card p-5 transition-colors', answer.isAccepted && 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10')}>
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <VoteButtons
            score={answer.voteScore}
            userVote={answer.userVote}
            onVote={(v) => voteMutation.mutate(v)}
            disabled={voteMutation.isPending || !isAuthenticated}
          />
          {/* Accept button */}
          {isQuestionOwner && !answer.isAccepted && (
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="mt-2 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-emerald-400 hover:text-emerald-500 transition-all"
              title="Accept this answer"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {answer.isAccepted && (
            <div className="mt-2 p-1.5 text-emerald-600 dark:text-emerald-400" title="Accepted answer">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <RichEditor value={editBody} onChange={setEditBody} placeholder="Edit your answer…" />
              <div className="flex items-center gap-2">
                <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="btn-primary text-sm">
                  {editMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={handleImproveWithAI} disabled={improving} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {improving ? 'Improving…' : 'Improve with AI'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer.body.replace(/<[^>]+>/g, '')}</ReactMarkdown>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Avatar user={answer.author} size="sm" />
              <div className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{answer.author.name}</span>
                <span className="text-zinc-400"> · {answer.author.reputation} rep · {timeAgo(answer.createdAt)}</span>
              </div>
            </div>

            {isAuthor && !editing && (
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(true)} className="btn-ghost p-1.5 text-zinc-400 hover:text-zinc-600" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this answer?')) deleteMutation.mutate(); }}
                  disabled={deleteMutation.isPending}
                  className="btn-ghost p-1.5 text-zinc-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
