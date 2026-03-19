import api from './api';

// ─── Auth ───────────────────────────────────────────
export const authService = {
  register: (data: { username: string; name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
};

// ─── Users ───────────────────────────────────────────
export const userService = {
  getProfile: (username: string) => api.get(`/users/${username}`).then((r) => r.data),
  updateProfile: (data: any) => api.put('/users/me', data).then((r) => r.data),
  toggleFollow: (userId: string) => api.post(`/users/${userId}/follow`).then((r) => r.data),
  getFollowers: (userId: string, page = 1) => api.get(`/users/${userId}/followers?page=${page}`).then((r) => r.data),
  getFollowing: (userId: string, page = 1) => api.get(`/users/${userId}/following?page=${page}`).then((r) => r.data),
  getLeaderboard: (limit = 20) => api.get(`/users/leaderboard?limit=${limit}`).then((r) => r.data),
  getUserQuestions: (userId: string, page = 1) => api.get(`/users/${userId}/questions?page=${page}`).then((r) => r.data),
  getBookmarks: (page = 1) => api.get(`/users/me/bookmarks?page=${page}`).then((r) => r.data),
};

// ─── Questions ───────────────────────────────────────
export const questionService = {
  getAll: (params?: Record<string, any>) =>
    api.get('/questions', { params }).then((r) => r.data),
  getOne: (id: string) => api.get(`/questions/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/questions', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/questions/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/questions/${id}`).then((r) => r.data),
  toggleBookmark: (id: string) => api.post(`/questions/${id}/bookmark`).then((r) => r.data),
  vote: (id: string, value: 1 | -1) => api.post(`/questions/${id}/vote`, { value }).then((r) => r.data),
  getExams: () => api.get('/questions/exams').then((r) => r.data),
  getPopularTags: (limit = 20) => api.get(`/questions/tags/popular?limit=${limit}`).then((r) => r.data),
};

// ─── Answers ───────────────────────────────────────────
export const answerService = {
  getByQuestion: (questionId: string) =>
    api.get(`/questions/${questionId}/answers`).then((r) => r.data),
  create: (questionId: string, data: { body: string }) =>
    api.post(`/questions/${questionId}/answers`, data).then((r) => r.data),
  update: (id: string, data: { body: string }) =>
    api.put(`/answers/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/answers/${id}`).then((r) => r.data),
  accept: (id: string) => api.post(`/answers/${id}/accept`).then((r) => r.data),
  vote: (id: string, value: 1 | -1) =>
    api.post(`/answers/${id}/vote`, { value }).then((r) => r.data),
};

// ─── Comments ───────────────────────────────────────────
export const commentService = {
  getByTarget: (targetId: string, targetType: 'question' | 'answer') =>
    api.get(`/comments?targetId=${targetId}&targetType=${targetType}`).then((r) => r.data),
  create: (data: { body: string; targetId: string; targetType: string; parentId?: string }) =>
    api.post('/comments', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/comments/${id}`).then((r) => r.data),
  like: (id: string) => api.post(`/comments/${id}/like`).then((r) => r.data),
};

// ─── Feed ───────────────────────────────────────────
export const feedService = {
  getFeed: (page = 1) => api.get(`/feed?page=${page}`).then((r) => r.data),
  getTrending: (page = 1) => api.get(`/feed/trending?page=${page}`).then((r) => r.data),
};

// ─── Notifications ───────────────────────────────────────────
export const notificationService = {
  getAll: (page = 1) => api.get(`/notifications?page=${page}`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
  markOneRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
};

// ─── Media ───────────────────────────────────────────
export const mediaService = {
  upload: (file: File, type: 'image' | 'avatar' = 'image') => {
    const form = new FormData();
    form.append('file', file);
    return api.post(type === 'avatar' ? '/media/upload/avatar' : '/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

// ─── AI ───────────────────────────────────────────
export const aiService = {
  suggestTags: (title: string, description: string) =>
    api.post('/ai/suggest-tags', { title, description }).then((r) => r.data),
  suggestAnswer: (title: string, description: string) =>
    api.post('/ai/suggest-answer', { title, description }).then((r) => r.data),
  improveAnswer: (answerBody: string, context: string) =>
    api.post('/ai/improve-answer', { answerBody, context }).then((r) => r.data),
};

// ─── Admin ───────────────────────────────────────────
export const adminService = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getReports: (status?: string, page = 1) =>
    api.get('/admin/reports', { params: { status, page } }).then((r) => r.data),
  resolveReport: (id: string, status: string, adminNote?: string) =>
    api.patch(`/admin/reports/${id}`, { status, adminNote }).then((r) => r.data),
  banUser: (id: string) => api.post(`/admin/users/${id}/ban`).then((r) => r.data),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`).then((r) => r.data),
  getAllUsers: (page = 1, search?: string) =>
    api.get('/admin/users', { params: { page, search } }).then((r) => r.data),
  fileReport: (data: { targetId: string; targetType: string; reason: string }) =>
    api.post('/reports', data).then((r) => r.data),
};
