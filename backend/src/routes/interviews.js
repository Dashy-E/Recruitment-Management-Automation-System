import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { paginate } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, candidateId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;

    const [data, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          candidate: { select: { firstName: true, lastName: true, email: true, designation: true } },
          scheduledBy: { select: { firstName: true, lastName: true } },
          feedback: { include: { interviewer: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { scheduledAt: 'asc' },
        ...paginate(page, limit),
      }),
      prisma.interview.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const interviews = await prisma.interview.findMany({
      where: { scheduledAt: { gte: today, lt: tomorrow }, status: 'SCHEDULED' },
      include: { candidate: { select: { firstName: true, lastName: true, designation: true } } },
    });
    res.json(interviews);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch today interviews' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = {
      ...req.body,
      scheduledById: req.user.id,
      panelIds: JSON.stringify(req.body.panelIds || []),
    };
    const interview = await prisma.interview.create({
      data,
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });

    await prisma.candidate.update({ where: { id: req.body.candidateId }, data: { status: 'INTERVIEW_SCHEDULED' } });

    res.status(201).json(interview);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to schedule interview' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.panelIds && Array.isArray(data.panelIds)) data.panelIds = JSON.stringify(data.panelIds);
    const interview = await prisma.interview.update({ where: { id: req.params.id }, data });
    res.json(interview);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update interview' });
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const interview = await prisma.interview.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    res.json(interview);
  } catch (e) {
    res.status(500).json({ message: 'Failed to complete interview' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const interview = await prisma.interview.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelReason: req.body.reason },
    });
    res.json(interview);
  } catch (e) {
    res.status(500).json({ message: 'Failed to cancel interview' });
  }
});

router.post('/:id/feedback', async (req, res) => {
  try {
    const { technicalScore, communicationScore, problemSolvingScore, cultureFitScore, recommendation, strengths, weaknesses, comments } = req.body;
    const overall = [technicalScore, communicationScore, problemSolvingScore, cultureFitScore].filter(Boolean);
    const overallScore = overall.length ? overall.reduce((a, b) => a + b, 0) / overall.length : null;

    const feedback = await prisma.interviewFeedback.create({
      data: {
        interviewId: req.params.id,
        interviewerId: req.user.id,
        technicalScore: parseInt(technicalScore) || null,
        communicationScore: parseInt(communicationScore) || null,
        problemSolvingScore: parseInt(problemSolvingScore) || null,
        cultureFitScore: parseInt(cultureFitScore) || null,
        overallScore,
        recommendation,
        strengths,
        weaknesses,
        comments,
      },
    });
    res.status(201).json(feedback);
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

export default router;
