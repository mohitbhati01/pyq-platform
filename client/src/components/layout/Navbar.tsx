'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Search, Bell, Sun, Moon, Menu, X, BookOpen, TrendingUp,
  User, LogOut, Settings, Shield, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useWebSocket, useDebounce } from '@/hooks';
import { cn, getInitials } from '@/lib/utils';
import { notificationService } from '@/services';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { unreadCount, resetUnread } = useWebSocket();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearch.trim().length > 1) {
      router.push(`/search?q=${encodeURIComponent(debouncedSearch.trim())}`);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await import('@/services').then(s => s.authService.logout(refreshToken));
    } catch {}
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const navLinks = [
    { href: '/questions', label: 'Questions' },
    { href: '/feed', label: 'Feed', auth: true },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="page-container">
        <div className="flex items-center gap-4 h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block text-zinc-900 dark:text-white">PYQ<span className="text-brand-600">Platform</span></span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-lg relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search questions, exams, topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 pr-4 h-9 text-sm"
            />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.auth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname?.startsWith(link.href)
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  href="/notifications"
                  onClick={resetUnread}
                  className="btn-ghost p-2 relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Post question CTA */}
                <Link href="/questions/new" className="btn-primary hidden sm:flex items-center gap-1.5">
                  <span>Ask Question</span>
                </Link>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Avatar user={user!} size="sm" />
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950/50 py-1 z-50">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user!.name}</p>
                        <p className="text-xs text-zinc-500">@{user!.username} · {user!.reputation} rep</p>
                      </div>
                      <Link href={`/profile/${user!.username}`} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4 text-zinc-400" /> Profile
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Settings className="w-4 h-4 text-zinc-400" /> Settings
                      </Link>
                      {user!.isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-brand-600" onClick={() => setUserMenuOpen(false)}>
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-red-500">
                          <LogOut className="w-4 h-4" /> Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">Log in</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Sign up</Link>
              </div>
            )}

            {/* Mobile menu */}
            <button className="lg:hidden btn-ghost p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search + nav */}
        {mobileOpen && (
          <div className="lg:hidden pb-3 pt-1 space-y-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                if (link.auth && !isAuthenticated) return null;
                return (
                  <Link key={link.href} href={link.href} className="sidebar-link" onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated && (
                <Link href="/questions/new" className="btn-primary text-center mt-1" onClick={() => setMobileOpen(false)}>
                  Ask Question
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Inline Avatar component
export function Avatar({ user, size = 'md' }: { user: { name: string; avatarUrl?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name} className={cn(sizes[size], 'rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700')} />
  ) : (
    <div className={cn(sizes[size], 'rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-semibold flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-700')}>
      {getInitials(user.name)}
    </div>
  );
}
