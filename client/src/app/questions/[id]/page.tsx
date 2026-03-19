'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Calendar, Edit2, Trash2, Flag, Sparkles, Loader2, Share2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import VoteButtons from '@/components/answer/VoteButtons';
import AnswerCard from '@/components/answer/AnswerCard';
import CommentThread from '@/components/comment/CommentThread';
import RichEditor from '@/components/editor/RichEditor';
import { Avatar } from '@/components/layout/Navbar';
import { questionService, answerService, aiService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { cn, timeAgo, difficultyColor, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [answerBody, setAnswerBody] = useState('');
  const [gettingAISuggestion, setGettingAISuggestion] = useState(false);

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => questionService.getOne(id),
  });

  const { data: answers = [], isLoading: answersLoading } = useQuery({
    queryKey: ['answers', id],
    queryFn: () => answerService.getByQuestion(id),
    enabled: !!id,
  });

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => questionService.vote(id, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question', id] }),
    onError: () => toast.error('Vote failed'),
  });

  const answerMutation = useMutation({
    mutationFn: () => answerService.create(id, { body: answerBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['answers', id] });
      setAnswerBody('');
      toast.success('Answer posted!');
    },
    onError: () => toast.error('Failed to post answer'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => questionService.delete(id),
    onSuccess: () => { toast.success('Question deleted'); router.push('/questions'); },
    onError: () => toast.error('Failed to delete'),
  });

  const handleAISuggest = async () => {
    if (!question) return;
    setGettingAISuggestion(true);
    try {
      const suggestion = await aiService.suggestAnswer(question.title, question.description.replace(/<[^>]+>/g, ''));
      setAnswerBody(suggestion);
      toast.success('AI suggestion ready — review and edit before posting!');
    } catch { toast.error('AI suggestion failed'); }
    finally { setGettingAISuggestion(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) return (
    <AppLayout>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
      </div>
    </AppLayout>
  );

  if (!question) return <AppLayout><div className="card p-12 text-center text-zinc-500">Question not found</div></AppLayout>;

  const isAuthor = user?.id === question.author.id;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Question header */}
        <div className="card p-5">
          <div className="flex gap-4">
            <VoteButtons
              score={question.voteScore}
              userVote={undefined}
              onVote={(v) => voteMutation.mutate(v)}
              disabled={voteMutation.isPending || !isAuthenticated}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-3">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex-1">{question.title}</h1>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={copyLink} className="btn-ghost p-1.5 text-zinc-400" title="Copy link"><Share2 className="w-4 h-4" /></button>
                  {isAuthor && (
                    <>
                      <button onClick={() => router.push(`/questions/${id}/edit`)} className="btn-ghost p-1.5 text-zinc-400" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this question?')) deleteMutation.mutate(); }} className="btn-ghost p-1.5 text-zinc-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={cn('badge', difficultyColor(question.difficulty))}>{question.difficulty}</span>
                <span className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {question.examName} {question.examYear}
                </span>
                <span className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><Eye className="w-3 h-3 inline mr-1" />{formatNumber(question.viewCount)} views</span>
                {question.tags.map((t: string) => (
                  <span key={t} className="badge badge-tag">{t}</span>
                ))}
              </div>

              {/* Description */}
              <div className="prose dark:prose-invert max-w-none prose-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {question.description.replace(/<[^>]+>/g, '')}
                </ReactMarkdown>
              </div>

              {/* Images */}
              {question.images?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {question.images.map((img: any) => (
                    <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                      <img src={img.url} alt="Question image" className="max-h-48 rounded-lg border border-zinc-200 dark:border-zinc-700 object-contain" />
                    </a>
                  ))}
                </div>
              )}

              {/* Author footer */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Avatar user={question.author} size="sm" />
                <div className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{question.author.name}</span>
                  {' · '}{timeAgo(question.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Comments on question */}
          <div className="ml-12">
            <CommentThread targetId={question.id} targetType="question" />
          </div>
        </div>

        {/* Answers */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>
          {answersLoading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer: any) => (
                <div key={answer.id}>
                  <AnswerCard
                    answer={answer}
                    questionAuthorId={question.author.id}
                    questionId={id}
                    questionContext={question.title}
                  />
                  <div className="ml-12 mt-2">
                    <CommentThread targetId={answer.id} targetType="answer" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post answer */}
        {isAuthenticated ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Your Answer</h2>
              <button onClick={handleAISuggest} disabled={gettingAISuggestion} className="btn-secondary text-sm flex items-center gap-1.5">
                {gettingAISuggestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {gettingAISuggestion ? 'Getting suggestion…' : 'Suggest with AI'}
              </button>
            </div>
            <RichEditor value={answerBody} onChange={setAnswerBody} placeholder="Write a detailed, well-structured answer…" minHeight={200} />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (!answerBody || answerBody === '<p></p>') { toast.error('Please write an answer'); return; }
                  answerMutation.mutate();
                }}
                disabled={answerMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {answerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Post Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-3">Log in to post an answer</p>
            <a href="/auth/login" className="btn-primary">Log in</a>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
