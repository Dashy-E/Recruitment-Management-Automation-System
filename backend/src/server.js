import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import mrfRoutes from './routes/mrf.js';
import candidateRoutes from './routes/candidates.js';
import interviewRoutes from './routes/interviews.js';
import trainingRoutes from './routes/training.js';
import examRoutes from './routes/exams.js';
import offerRoutes from './routes/offers.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import departmentRoutes from './routes/departments.js';
import agencyRoutes from './routes/agencies.js';
import communicationRoutes from './routes/communications.js';
import geographyRoutes from './routes/geography.js';
import aiScreeningRoutes from './routes/aiScreening.js';
import pipelineRoutes from './routes/pipeline.js';
import casualWorkerRoutes from './routes/casualWorkers.js';
import incomingMailRoutes from './routes/incomingMail.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mrf', mrfRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/ai-screening', aiScreeningRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/casual-workers', casualWorkerRoutes);
app.use('/api/incoming-mail', incomingMailRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
