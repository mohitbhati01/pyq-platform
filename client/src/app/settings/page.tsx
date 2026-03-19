'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { userService, mediaService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'English', 'Computer Science', 'Political Science'];
const SKILLS = ['Problem Solving', 'Critical Thinking', 'Time Management', 'Analytical Skills', 'Memory Techniques'];

export default function SettingsPage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated) { router.push('/auth/login'); return null; }

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      education: user?.education || '',
      avatarUrl: user?.avatarUrl || '',
      subjects: user?.subjects || [],
      skills: user?.skills || [],
    },
  });

  useEffect(() => { if (user) reset({ name: user.name, username: user.username, bio: user.bio || '', education: user.education || '', avatarUrl: user.avatarUrl || '', subjects: user.subjects || [], skills: user.skills || [] }); }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (data) => { updateUser(data); toast.success('Profile updated!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: async ([file]) => {
      try {
        const result: any = await mediaService.upload(file, 'avatar');
        setValue('avatarUrl', result.url);
        toast.success('Avatar uploaded');
      } catch { toast.error('Upload failed'); }
    },
  });

  const subjects = watch('subjects') as string[];
  const skills = watch('skills') as string[];
  const avatarUrl = watch('avatarUrl');

  const toggleItem = (field: 'subjects' | 'skills', item: string) => {
    const current = watch(field) as string[];
    setValue(field, current.includes(item) ? current.filter(x => x !== item) : [...current, item]);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Profile Settings</h1>

        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-5">
          {/* Avatar */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Profile photo</h2>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-xl font-bold">
                  {user?.name?.[0]}
                </div>
              )}
              <div {...getRootProps()} className="btn-secondary cursor-pointer text-sm">
                <input {...getInputProps()} />
                Change photo
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Basic information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Full name</label>
                <input {...register('name')} className="input text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Username</label>
                <input {...register('username')} className="input text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Bio</label>
              <textarea {...register('bio')} rows={3} placeholder="Tell others about yourself…" className="input text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Education</label>
              <input {...register('education')} placeholder="e.g. B.Tech CSE, IIT Delhi" className="input text-sm" />
            </div>
          </div>

          {/* Subjects */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Subjects of interest</h2>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleItem('subjects', s)}
                  className={`badge cursor-pointer transition-colors ${subjects.includes(s) ? 'badge-tag' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleItem('skills', s)}
                  className={`badge cursor-pointer transition-colors ${skills.includes(s) ? 'badge-tag' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex items-center gap-2">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
