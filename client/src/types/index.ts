export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  skills: string[];
  subjects: string[];
  education?: string;
  reputation: number;
  isAdmin: boolean;
  isBanned?: boolean;
  createdAt: string;
  _count?: { followers: number; following: number; questions: number; answers: number };
  badges?: UserBadge[];
}

export interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  examName: string;
  examYear: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  viewCount: number;
  voteScore: number;
  isDeleted: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  images?: QuestionImage[];
  _count?: { answers: number; comments: number };
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  isAccepted: boolean;
  voteScore: number;
  isDeleted: boolean;
  userVote?: 'UP' | 'DOWN' | null;
  editHistory: Array<{ body: string; editedAt: string }>;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'reputation'>;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  body: string;
  likeCount: number;
  isDeleted: boolean;
  createdAt: string;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  replies?: Comment[];
  parentId?: string;
}

export interface Notification {
  id: string;
  type: string;
  resourceId: string;
  resourceType: string;
  isRead: boolean;
  createdAt: string;
  actor: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface UserBadge {
  badge: Badge;
  awardedAt: string;
}

export interface QuestionImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
