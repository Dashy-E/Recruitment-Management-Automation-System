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
  getSuggestedAgencies: (id) => api.get(`/mrf/${id}/suggested-agencies`),
  getOutreach: (id) => api.get(`/mrf/${id}/outreach`),
  sendOutreach: (id, data) => api.post(`/mrf/${id}/outreach`, data),
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
  importCSV: (formData) => api.post('/candidates/import/csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
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
  getMine: () => api.get('/offers/mine'),
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

// Agencies
export const agencyAPI = {
  getAll: (params) => api.get('/agencies', { params }),
  getMy: () => api.get('/agencies/my'),
  getById: (id) => api.get(`/agencies/${id}`),
  create: (data) => api.post('/agencies', data),
  update: (id, data) => api.put(`/agencies/${id}`, data),
  delete: (id) => api.delete(`/agencies/${id}`),
  addContact: (id, data) => api.post(`/agencies/${id}/contacts`, data),
  submitCandidate: (id, data) => api.post(`/agencies/${id}/submissions`, data),
  getPerformance: (id) => api.get(`/agencies/${id}/performance`),
};

// Communications
export const communicationAPI = {
  getAll: (params) => api.get('/communications', { params }),
  send: (data) => api.post('/communications/send', data),
  getTemplates: (params) => api.get('/communications/templates', { params }),
  createTemplate: (data) => api.post('/communications/templates', data),
  updateTemplate: (id, data) => api.put(`/communications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/communications/templates/${id}`),
  previewTemplate: (id, variables) => api.post(`/communications/templates/${id}/preview`, { variables }),
};

// Geography
export const geographyAPI = {
  getLocations: (params) => api.get('/geography/locations', { params }),
  createLocation: (data) => api.post('/geography/locations', data),
  getIntelligence: () => api.get('/geography/intelligence'),
  getAgenciesByLocation: (id) => api.get(`/geography/locations/${id}/agencies`),
  assignAgencyToLocation: (id, data) => api.post(`/geography/locations/${id}/agencies`, data),
  getStates: () => api.get('/geography/states'),
};

// AI Screening
export const aiScreeningAPI = {
  getAllJDs: () => api.get('/ai-screening/jd'),
  getJD: (id) => api.get(`/ai-screening/jd/${id}`),
  createJD: (data) => api.post('/ai-screening/jd', data),
  getResults: (params) => api.get('/ai-screening/results', { params }),
  screenCandidate: (data) => api.post('/ai-screening/screen', data),
  screenBatch: (data) => api.post('/ai-screening/screen/batch', data),
};

// Pipeline
export const pipelineAPI = {
  getByMrf: (mrfId) => api.get(`/pipeline/mrf/${mrfId}`),
  initStages: (mrfId) => api.post(`/pipeline/mrf/${mrfId}/init`),
  createStage: (mrfId, data) => api.post(`/pipeline/mrf/${mrfId}/stages`, data),
  moveCandidate: (data) => api.post('/pipeline/move', data),
  removeEntry: (candidateId, stageId) => api.delete(`/pipeline/entry/${candidateId}/${stageId}`),
};

// Casual Workers
export const casualWorkerAPI = {
  getAll: (params) => api.get('/casual-workers', { params }),
  getById: (id) => api.get(`/casual-workers/${id}`),
  create: (data) => api.post('/casual-workers', data),
  update: (id, data) => api.put(`/casual-workers/${id}`, data),
  verify: (id, data) => api.patch(`/casual-workers/${id}/verify`, data),
};

// Incoming Mail
export const incomingMailAPI = {
  getAll: (params) => api.get('/incoming-mail', { params }),
  getById: (id) => api.get(`/incoming-mail/${id}`),
  ingest: (data) => api.post('/incoming-mail', data),
  process: (id, data) => api.patch(`/incoming-mail/${id}/process`, data),
  createCandidate: (id) => api.post(`/incoming-mail/${id}/create-candidate`),
  discard: (id) => api.patch(`/incoming-mail/${id}/discard`),
};

// Probation
export const probationAPI = {
  getAll: (params) => api.get('/probation', { params }),
  getById: (id) => api.get(`/probation/${id}`),
  create: (data) => api.post('/probation', data),
  update: (id, data) => api.put(`/probation/${id}`, data),
  approve: (id) => api.post(`/probation/${id}/approve`),
  extend: (id, data) => api.post(`/probation/${id}/extend`, data),
  fail: (id, data) => api.post(`/probation/${id}/fail`, data),
};

// Audit Logs
export const auditLogAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getEntities: () => api.get('/audit-logs/entities'),
};

// Sourcing (Job Postings + Platform Tracking)
export const sourcingAPI = {
  getAll: (params) => api.get('/sourcing', { params }),
  getByMrf: (mrfId) => api.get(`/sourcing/mrf/${mrfId}`),
  generateDescription: (mrfId, platform) => api.post('/sourcing/generate-description', { mrfId, platform }),
  create: (data) => api.post('/sourcing', data),
  update: (id, data) => api.put(`/sourcing/${id}`, data),
  delete: (id) => api.delete(`/sourcing/${id}`),
};

export default api;
