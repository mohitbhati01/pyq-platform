'use client';

import { useState } from 'react';
import { MessageSquare, Heart, Reply, Trash2 } from 'lucide-react';
import { Comment } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/layout/Navbar';
import { commentService } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

interface CommentThreadProps {
  targetId: string;
  targetType: 'question' | 'answer';
}

export default function CommentThread({ targetId, targetType }: CommentThreadProps) {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', targetId, targetType],
    queryFn: () => commentService.getByTarget(targetId, targetType),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['comments', targetId, targetType] });

  const addMutation = useMutation({
    mutationFn: (data: { body: string; parentId?: string }) =>
      commentService.create({ ...data, targetId, targetType }),
    onSuccess: () => { invalidate(); setNewComment(''); setReplyText(''); setReplyingTo(null); },
    onError: () => toast.error('Failed to post comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: commentService.delete,
    onSuccess: () => { invalidate(); toast.success('Comment deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  const CommentItem = ({ comment, indent = false }: { comment: Comment; indent?: boolean }) => (
    <div className={cn('group', indent && 'ml-8 mt-2')}>
      <div className="flex gap-2.5 py-2">
        <Avatar user={comment.author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-white">{comment.author.name}</span>
            {' '}{comment.body}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
            {comment.likeCount > 0 && (
              <span className="text-xs text-zinc-400 flex items-center gap-0.5">
                <Heart className="w-3 h-3" /> {comment.likeCount}
              </span>
            )}
            {isAuthenticated && (
              <button
                onClick={() => { setReplyingTo(comment.id); setReplyText(''); }}
                className="text-xs text-zinc-400 hover:text-brand-500 transition-colors flex items-center gap-0.5"
              >
                <Reply className="w-3 h-3" /> Reply
              </button>
            )}
            {user?.id === comment.author.id && (
              <button
                onClick={() => { if (confirm('Delete comment?')) deleteMutation.mutate(comment.id); }}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
                    e.preventDefault();
                    addMutation.mutate({ body: replyText.trim(), parentId: comment.id });
                  }
                  if (e.key === 'Escape') setReplyingTo(null);
                }}
                placeholder={`Reply to ${comment.author.name}…`}
                className="input text-sm flex-1"
              />
              <button onClick={() => setReplyingTo(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} indent />
      ))}
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-1.5 mb-3 text-sm text-zinc-500 dark:text-zinc-400">
        <MessageSquare className="w-4 h-4" />
        <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-8 w-3/4" />)}</div>
      ) : (
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
          {displayedComments.map((c) => <CommentItem key={c.id} comment={c} />)}
        </div>
      )}

      {comments.length > 3 && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2">
          Show {comments.length - 3} more comment{comments.length - 3 !== 1 ? 's' : ''}
        </button>
      )}

      {isAuthenticated && (
        <div className="flex gap-2 mt-3">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                e.preventDefault();
                addMutation.mutate({ body: newComment.trim() });
              }
            }}
            placeholder="Add a comment… (Enter to post)"
            className="input text-sm flex-1"
          />
          <button
            onClick={() => newComment.trim() && addMutation.mutate({ body: newComment.trim() })}
            disabled={!newComment.trim() || addMutation.isPending}
            className="btn-secondary text-sm"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
