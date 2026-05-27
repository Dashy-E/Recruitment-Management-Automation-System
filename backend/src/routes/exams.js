import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status, candidateId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;

    const attempts = await prisma.examAttempt.findMany({
      where,
      include: { candidate: { select: { firstName: true, lastName: true, email: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(attempts);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

router.post('/generate-link', async (req, res) => {
  try {
    const { candidateId, examName, passingScore, maxScore, expiryHours = 72 } = req.body;

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const trainingEnrollment = await prisma.trainingEnrollment.findUnique({ where: { candidateId } });
    if (!trainingEnrollment || trainingEnrollment.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Training must be completed before generating exam link' });
    }

    const prevAttempts = await prisma.examAttempt.count({ where: { candidateId } });
    if (prevAttempts >= 2) {
      return res.status(400).json({ message: 'Maximum exam attempts (2) reached' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const attempt = await prisma.examAttempt.create({
      data: {
        candidateId,
        examName,
        passingScore: parseFloat(passingScore),
        maxScore: parseFloat(maxScore),
        attemptNumber: prevAttempts + 1,
        status: 'LINK_SENT',
        linkExpiresAt: expiresAt,
        sentAt: new Date(),
        generatedById: req.user.id,
      },
    });

    await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'EXAM_PENDING' } });

    const examLink = `${process.env.FRONTEND_URL}/exam/${attempt.linkToken}`;
    await prisma.examAttempt.update({ where: { id: attempt.id }, data: { examLink } });

    res.status(201).json({ ...attempt, examLink });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to generate exam link' });
  }
});

router.put('/:id/result', async (req, res) => {
  try {
    const { score, result, remarks } = req.body;
    const attempt = await prisma.examAttempt.update({
      where: { id: req.params.id },
      data: {
        score: parseFloat(score),
        result,
        status: result === 'PASS' ? 'PASSED' : 'FAILED',
        completedAt: new Date(),
        remarks,
      },
    });

    const statusUpdate = result === 'PASS' ? 'EXAM_COMPLETED' : 'REJECTED';
    await prisma.candidate.update({ where: { id: attempt.candidateId }, data: { status: statusUpdate } });

    res.json(attempt);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update result' });
  }
});

router.get('/token/:token', async (req, res) => {
  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { linkToken: req.params.token },
      include: { candidate: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!attempt) return res.status(404).json({ message: 'Exam link not found' });
    if (attempt.linkExpiresAt && new Date() > attempt.linkExpiresAt) {
      return res.status(410).json({ message: 'Exam link has expired' });
    }
    res.json(attempt);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch exam' });
  }
});

export default router;
