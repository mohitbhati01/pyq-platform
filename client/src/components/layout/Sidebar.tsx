'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, BookmarkIcon, Trophy, Tag, GraduationCap, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const links = [
  { href: '/questions', icon: Home, label: 'All Questions' },
  { href: '/feed', icon: Flame, label: 'My Feed', auth: true },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const authLinks = [
  { href: '/bookmarks', icon: BookmarkIcon, label: 'Bookmarks' },
];

const topTags = ['jee', 'neet', 'upsc', 'gate', 'calculus', 'organic-chemistry', 'data-structures', 'history'];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-6">
        {/* Navigation */}
        <nav className="space-y-0.5">
          {links.map(({ href, icon: Icon, label, auth }) => {
            if (auth && !isAuthenticated) return null;
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link key={href} href={href} className={cn('sidebar-link', active && 'active')}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          {isAuthenticated && authLinks.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={cn('sidebar-link', pathname === href && 'active')}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Popular Tags */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3 mb-2">
            Popular Tags
          </h3>
          <div className="flex flex-wrap gap-1.5 px-3">
            {topTags.map((tag) => (
              <Link
                key={tag}
                href={`/questions?tags=${tag}`}
                className="badge badge-tag text-xs"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Exams */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" /> Exams
          </h3>
          <div className="space-y-0.5">
            {['JEE', 'NEET', 'UPSC', 'GATE', 'CAT', 'SSC'].map((exam) => (
              <Link
                key={exam}
                href={`/questions?examName=${exam}`}
                className="sidebar-link text-xs"
              >
                {exam}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
