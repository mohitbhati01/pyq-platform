'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserMinus, MapPin, GraduationCap, Star } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import QuestionCard from '@/components/question/QuestionCard';
import { Avatar } from '@/components/layout/Navbar';
import { userService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { formatDate, formatNumber, reputationToLevel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'questions' | 'answers'>('questions');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => userService.getProfile(username),
  });

  const { data: questionsData } = useQuery({
    queryKey: ['userQuestions', profile?.id],
    queryFn: () => userService.getUserQuestions(profile!.id),
    enabled: !!profile?.id,
  });

  const followMutation = useMutation({
    mutationFn: () => userService.toggleFollow(profile!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      toast.success(data.following ? 'Following!' : 'Unfollowed');
    },
    onError: () => toast.error('Failed to update follow'),
  });

  if (isLoading) return (
    <AppLayout>
      <div className="space-y-4">
        <div className="skeleton h-40 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    </AppLayout>
  );

  if (!profile) return <AppLayout><div className="card p-12 text-center text-zinc-500">User not found</div></AppLayout>;

  const isOwnProfile = currentUser?.id === profile.id;
  const isFollowing = false; // TODO: derive from profile data

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-5">
        {/* Profile header */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <Avatar user={profile} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{profile.name}</h1>
                  <p className="text-sm text-zinc-500">@{profile.username}</p>
                </div>
                {!isOwnProfile && isAuthenticated && (
                  <button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    className="btn-secondary flex items-center gap-1.5 text-sm shrink-0"
                  >
                    {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                  </button>
                )}
                {isOwnProfile && (
                  <a href="/settings" className="btn-secondary text-sm">Edit profile</a>
                )}
              </div>

              {profile.bio && <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                {profile.education && (
                  <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{profile.education}</span>
                )}
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />{reputationToLevel(profile.reputation)}</span>
                <span>Joined {formatDate(profile.createdAt)}</span>
              </div>

              {/* Subjects */}
              {profile.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.subjects.map((s: string) => (
                    <span key={s} className="badge bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            {[
              { label: 'Reputation', value: formatNumber(profile.reputation) },
              { label: 'Questions', value: formatNumber(profile._count?.questions || 0) },
              { label: 'Answers', value: formatNumber(profile._count?.answers || 0) },
              { label: 'Followers', value: formatNumber(profile._count?.followers || 0) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-lg font-bold text-zinc-900 dark:text-white">{value}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {profile.badges?.length > 0 && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((ub: any) => (
                <div key={ub.badge.id} className="badge bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs" title={ub.badge.description}>
                  🏅 {ub.badge.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">Recent Questions</h2>
          {questionsData?.data?.length === 0 ? (
            <div className="card p-8 text-center text-zinc-500">No questions posted yet</div>
          ) : (
            <div className="space-y-3">
              {(questionsData?.data || []).map((q: any) => <QuestionCard key={q.id} question={q} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
