import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

// ─── useAuth ─────────────────────────────────────────
export function useAuth() {
  const { user, isAuthenticated, accessToken, logout } = useAuthStore();
  const router = useRouter();

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, router]);

  return { user, isAuthenticated, accessToken, logout, requireAuth };
}

// ─── useDebounce ─────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── useWebSocket ─────────────────────────────────────────
export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    socketRef.current = io(`${WS_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current.on('notification', () => {
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  const resetUnread = () => setUnreadCount(0);

  return { socket: socketRef.current, unreadCount, resetUnread };
}

// ─── useIntersectionObserver ─────────────────────────────────────────
export function useIntersectionObserver(callback: () => void, options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) callback();
    }, { threshold: 0.1, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [callback]);

  return ref;
}

// ─── useLocalStorage ─────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setStoredValue = (val: T | ((v: T) => T)) => {
    const valueToStore = val instanceof Function ? val(value) : val;
    setValue(valueToStore);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(valueToStore));
    }
  };

  return [value, setStoredValue] as const;
}
