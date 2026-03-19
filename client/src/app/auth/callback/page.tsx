'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      router.push('/auth/login?error=oauth_failed');
      return;
    }

    // Fetch user profile with the access token
    api.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => {
        setAuth(res.data, accessToken, refreshToken);
        router.push('/questions');
      })
      .catch(() => {
        router.push('/auth/login?error=oauth_failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
        <p className="text-zinc-500 dark:text-zinc-400">Signing you in…</p>
      </div>
    </div>
  );
}
