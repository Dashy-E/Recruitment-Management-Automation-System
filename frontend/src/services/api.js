import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// MRF
export const mrfAPI = {
  getAll: (params) => api.get('/mrf', { params }),
  getById: (id) => api.get(`/mrf/${id}`),
  create: (data) => api.post('/mrf', data),
  update: (id, data) => api.put(`/mrf/${id}`, data),
  approve: (id) => api.post(`/mrf/${id}/approve`),
  reject: (id, reason) => api.post(`/mrf/${id}/reject`, { reason }),
  submit: (id) => api.post(`/mrf/${id}/submit`),
  delete: (id) => api.delete(`/mrf/${id}`),
};

// Candidates
export const candidateAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  updateStatus: (id, status) => api.patch(`/candidates/${id}/status`, { status }),
  uploadDocument: (id, data) => api.post(`/candidates/${id}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addComment: (id, comment) => api.post(`/candidates/${id}/comments`, { comment }),
  editComment: (id, commentId, comment) => api.put(`/candidates/${id}/comments/${commentId}`, { comment }),
  delete: (id) => api.delete(`/candidates/${id}`),
};

// Interviews
export const interviewAPI = {
  getAll: (params) => api.get('/interviews', { params }),
  getToday: () => api.get('/interviews/today'),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  complete: (id) => api.post(`/interviews/${id}/complete`),
  cancel: (id, reason) => api.post(`/interviews/${id}/cancel`, { reason }),
  submitFeedback: (id, data) => api.post(`/interviews/${id}/feedback`, data),
};

// Training
export const trainingAPI = {
  getBatches: (params) => api.get('/training/batches', { params }),
  getBatchById: (id) => api.get(`/training/batches/${id}`),
  createBatch: (data) => api.post('/training/batches', data),
  updateBatch: (id, data) => api.put(`/training/batches/${id}`, data),
  enrollCandidates: (batchId, candidateIds) => api.post(`/training/batches/${batchId}/enroll`, { candidateIds }),
  updateEnrollment: (id, data) => api.put(`/training/enrollments/${id}`, data),
  markAttendance: (data) => api.post('/training/attendance', data),
  getAttendance: (batchId, params) => api.get(`/training/attendance/${batchId}`, { params }),
};

// Exams
export const examAPI = {
  getAll: (params) => api.get('/exams', { params }),
  generateLink: (data) => api.post('/exams/generate-link', data),
  updateResult: (id, data) => api.put(`/exams/${id}/result`, data),
  getByToken: (token) => api.get(`/exams/token/${token}`),
};

// Offers
export const offerAPI = {
  getAll: (params) => api.get('/offers', { params }),
  getById: (id) => api.get(`/offers/${id}`),
  create: (data) => api.post('/offers', data),
  update: (id, data) => api.put(`/offers/${id}`, data),
  approve: (id) => api.post(`/offers/${id}/approve`),
  send: (id) => api.post(`/offers/${id}/send`),
  accept: (id) => api.post(`/offers/${id}/accept`),
  reject: (id, reason) => api.post(`/offers/${id}/reject`, { reason }),
  getAppointments: () => api.get('/offers/appointments/all'),
  createAppointment: (data) => api.post('/offers/appointments', data),
};

// Reports
export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  candidates: (params) => api.get('/reports/candidates', { params }),
  interviews: (params) => api.get('/reports/interviews', { params }),
  training: () => api.get('/reports/training'),
  exams: () => api.get('/reports/exams'),
  mrf: () => api.get('/reports/mrf'),
};

// Users
export const userAPI = {
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/by-role/${role}`),
  getInterviewers: () => api.get('/users/interviewers'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

// Departments
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
};

export default api;
