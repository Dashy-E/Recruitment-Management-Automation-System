import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalCandidates,
      activeMRFs,
      scheduledInterviews,
      trainingInProgress,
      examPending,
      offersSent,
      candidatesByStatus,
      mrfsByDept,
      recentCandidates,
      monthlyHiring,
    ] = await Promise.all([
      prisma.candidate.count({ where: { deletedAt: null } }),
      prisma.mRF.count({ where: { status: 'APPROVED', deletedAt: null } }),
      prisma.interview.count({ where: { status: 'SCHEDULED' } }),
      prisma.trainingEnrollment.count({ where: { status: 'ENROLLED' } }),
      prisma.candidate.count({ where: { status: 'EXAM_PENDING' } }),
      prisma.offerLetter.count({ where: { status: 'SENT' } }),
      prisma.candidate.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { status: true } }),
      prisma.mRF.groupBy({ by: ['departmentId'], where: { deletedAt: null }, _count: { departmentId: true } }),
      prisma.candidate.findMany({
        where: { deletedAt: null },
        include: { addedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Monthly hiring for last 6 months
      prisma.$queryRaw`SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count FROM "Candidate" WHERE deletedAt IS NULL AND createdAt >= date('now', '-6 months') GROUP BY month ORDER BY month ASC`,
    ]);

    res.json({
      stats: { totalCandidates, activeMRFs, scheduledInterviews, trainingInProgress, examPending, offersSent },
      candidatesByStatus: candidatesByStatus.map(g => ({ status: g.status, count: g._count.status })),
      mrfsByDept,
      recentCandidates,
      monthlyHiring,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

router.get('/candidates', async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (from || to) where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        mrf: { select: { mrfNumber: true, designation: true } },
        interviews: { select: { scheduledAt: true, status: true } },
        offerLetter: { select: { ctc: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(candidates);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch candidate report' });
  }
});

router.get('/interviews', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to) where.scheduledAt.lte = new Date(to);

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true, designation: true } },
        feedback: { include: { interviewer: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    res.json(interviews);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch interview report' });
  }
});

router.get('/training', async (req, res) => {
  try {
    const batches = await prisma.trainingBatch.findMany({
      include: {
        enrollments: {
          include: { candidate: { select: { firstName: true, lastName: true, designation: true } } },
        },
        _count: { select: { enrollments: true, attendance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(batches);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch training report' });
  }
});

router.get('/exams', async (req, res) => {
  try {
    const exams = await prisma.examAttempt.findMany({
      include: { candidate: { select: { firstName: true, lastName: true, email: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(exams);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch exam report' });
  }
});

router.get('/mrf', async (req, res) => {
  try {
    const mrfs = await prisma.mRF.findMany({
      where: { deletedAt: null },
      include: {
        department: true,
        _count: { select: { candidates: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(mrfs);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch MRF report' });
  }
});

export default router;
