import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { paginate } from '../utils/helpers.js';
import { sendEmail } from '../utils/mailer.js';

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
          candidate: { select: { firstName: true, lastName: true, email: true, designation: true, status: true } },
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
      include: { candidate: { select: { firstName: true, lastName: true, designation: true, status: true } } },
    });
    res.json(interviews);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch today interviews' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { candidateId, scheduledAt, interviewType, mode, meetingLink, round, duration, notes, panelIds } = req.body;

    // Validation
    if (!candidateId) return res.status(400).json({ message: 'candidateId is required' });
    if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });
    if (!interviewType) return res.status(400).json({ message: 'interviewType is required' });
    if (!mode) return res.status(400).json({ message: 'mode (ONLINE/IN_PERSON/PHONE) is required' });

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) return res.status(400).json({ message: 'Invalid scheduledAt date' });
    if (scheduledDate <= new Date()) return res.status(400).json({ message: 'Interview must be scheduled in the future' });

    if (mode === 'ONLINE' && !meetingLink) return res.status(400).json({ message: 'meetingLink is required for ONLINE interviews' });

    const interview = await prisma.interview.create({
      data: {
        candidateId,
        scheduledAt: scheduledDate,
        interviewType,
        mode,
        meetingLink: meetingLink || null,
        round: parseInt(round) || 1,
        duration: parseInt(duration) || 60,
        notes: notes || null,
        panelIds: JSON.stringify(panelIds || []),
        scheduledById: req.user.id,
      },
      include: {
        candidate: { select: { firstName: true, lastName: true, email: true, designation: true } },
        scheduledBy: { select: { firstName: true, lastName: true } },
      },
    });

    await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'INTERVIEW_SCHEDULED' } });

    // Send automated confirmation email to candidate
    if (interview.candidate.email) {
      const dateStr = scheduledDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const linkLine = meetingLink ? `\nMeeting Link: ${meetingLink}` : '';
      await sendEmail({
        to: interview.candidate.email,
        subject: `Interview Scheduled — Round ${interview.round} (${interviewType})`,
        text: `Dear ${interview.candidate.firstName},\n\nYour interview has been scheduled.\n\nDate: ${dateStr}\nTime: ${timeStr}\nRound: ${interview.round}\nType: ${interviewType}\nMode: ${mode}${linkLine}\nDuration: ${interview.duration} minutes\n\nPlease be available on time.\n\nRegards,\nRecruitment Team`,
      }).catch(err => console.warn('Interview email send failed:', err.message));
    }

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
    // Move candidate to SELECTED — indicates all interview rounds done, ready for next step
    await prisma.candidate.update({
      where: { id: interview.candidateId },
      data: { status: 'SELECTED' },
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
