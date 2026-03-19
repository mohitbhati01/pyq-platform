import Link from 'next/link';
import { BookOpen, Users, TrendingUp, Zap, ChevronRight, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-brand-950/30 dark:via-zinc-950 dark:to-purple-950/20" />
        <div className="relative page-container py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Collaborative exam preparation platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white mb-5 leading-tight">
            Learn faster with<br />
            <span className="text-brand-600 dark:text-brand-400">Previous Year Questions</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
            Upload PYQs, collaborate with thousands of students, vote on the best answers,
            and build your reputation across JEE, NEET, UPSC, GATE and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/questions" className="btn-primary text-base px-6 py-2.5 flex items-center gap-2 justify-center">
              Browse Questions <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/register" className="btn-secondary text-base px-6 py-2.5 flex items-center gap-2 justify-center">
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: 'Questions', value: '10,000+' },
              { label: 'Students', value: '50,000+' },
              { label: 'Exams covered', value: '20+' },
              { label: 'Answers posted', value: '80,000+' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-16">
        <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-white mb-10">
          Everything you need to prepare smarter
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, title: 'Structured PYQs', desc: 'Browse questions organized by exam, year, subject, and difficulty. Upload and share paper questions with ease.' },
            { icon: Users, title: 'Community Answers', desc: 'Multiple experts answer each question. Vote on the best solutions and accept the most helpful one.' },
            { icon: TrendingUp, title: 'Reputation System', desc: 'Earn points for upvotes, accepted answers and helpful contributions. Climb the leaderboard.' },
            { icon: Star, title: 'AI Assistance', desc: 'Get AI-powered answer suggestions and automatic tag recommendations to save time.' },
            { icon: Zap, title: 'Real-time Updates', desc: 'Live notifications when someone answers your question, follows you, or mentions you.' },
            { icon: Users, title: 'Social Learning', desc: 'Follow top contributors, build your feed, and see what the best students are working on.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div className="w-9 h-9 bg-brand-50 dark:bg-brand-950/50 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-1.5">{title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 dark:bg-brand-700">
        <div className="page-container py-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to ace your exam?</h2>
          <p className="text-brand-100 mb-6">Join 50,000+ students preparing smarter together.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-50 transition-colors">
            Get started free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="page-container py-6 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} PYQ Platform · Built for students, by students
        </div>
      </footer>
    </div>
  );
}
