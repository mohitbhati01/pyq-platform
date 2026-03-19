'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, X, Upload, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import RichEditor from '@/components/editor/RichEditor';
import { questionService, aiService, mediaService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(300),
  examName: z.string().min(1, 'Exam name is required'),
  examYear: z.coerce.number().min(1990).max(new Date().getFullYear()),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
});

type FormData = z.infer<typeof schema>;

export default function NewQuestionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [suggestingTags, setSuggestingTags] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: 'MEDIUM', examYear: new Date().getFullYear() },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => questionService.create(data),
    onSuccess: (data) => {
      toast.success('Question posted!');
      router.push(`/questions/${data.id}`);
    },
    onError: () => toast.error('Failed to post question'),
  });

  const onSubmit = (data: FormData) => {
    if (!description || description === '<p></p>') { toast.error('Please add a description'); return; }
    createMutation.mutate({ ...data, description, tags, imageUrls });
  };

  const addTag = (t: string) => {
    const clean = t.toLowerCase().trim().replace(/\s+/g, '-');
    if (clean && !tags.includes(clean) && tags.length < 5) setTags([...tags, clean]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const suggestTags = async () => {
    const title = watch('title');
    if (!title || title.length < 10) { toast.error('Enter a longer title first'); return; }
    setSuggestingTags(true);
    try {
      const suggested: string[] = await aiService.suggestTags(title, description);
      suggested.forEach((t) => { if (!tags.includes(t) && tags.length < 5) setTags((prev) => [...new Set([...prev, t])]); });
      toast.success('Tags suggested by AI!');
    } catch { toast.error('Could not suggest tags'); }
    finally { setSuggestingTags(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 5,
    onDrop: async (files) => {
      setUploadingImage(true);
      try {
        const uploads = await Promise.all(files.map((f) => mediaService.upload(f)));
        setImageUrls((prev) => [...prev, ...uploads.map((u: any) => u.url)]);
        toast.success(`${files.length} image(s) uploaded`);
      } catch { toast.error('Image upload failed'); }
      finally { setUploadingImage(false); }
    },
  });

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Ask a Question</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Share a previous year question and let the community solve it together.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Question title</h2>
            <input
              {...register('title')}
              placeholder="e.g. Find the integral of sin²(x)cos²(x) [JEE Advanced 2022]"
              className="input"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Description</h2>
            <p className="text-xs text-zinc-400">Include the full question, context, and any relevant constraints.</p>
            <RichEditor value={description} onChange={setDescription} placeholder="Write the full question here…" minHeight={180} />
          </div>

          {/* Images */}
          <div className="card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Attach images (optional)</h2>
            <div
              {...getRootProps()}
              className={cn('border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors', isDragActive ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600')}
            >
              <input {...getInputProps()} />
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500 mb-1" />
              ) : (
                <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
              )}
              <p className="text-sm text-zinc-500">{isDragActive ? 'Drop here' : 'Drag & drop PYQ images, or click to browse'}</p>
              <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700" />
                    <button type="button" onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tags (up to 5)</h2>
              <button type="button" onClick={suggestTags} disabled={suggestingTags} className="btn-ghost text-xs flex items-center gap-1 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-3.5 h-3.5" />
                {suggestingTags ? 'Suggesting…' : 'Suggest with AI'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="badge badge-tag flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput.trim() && addTag(tagInput)}
              placeholder="Type a tag and press Enter or comma"
              className="input text-sm"
              disabled={tags.length >= 5}
            />
          </div>

          {/* Exam meta */}
          <div className="card p-4 grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Exam *</label>
              <input {...register('examName')} placeholder="JEE Advanced" className="input text-sm" />
              {errors.examName && <p className="text-xs text-red-500 mt-0.5">{errors.examName.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Year *</label>
              <input {...register('examYear')} type="number" className="input text-sm" />
              {errors.examYear && <p className="text-xs text-red-500 mt-0.5">{errors.examYear.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 block">Difficulty</label>
              <select {...register('difficulty')} className="input text-sm">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createMutation.isPending ? 'Posting…' : 'Post Question'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
