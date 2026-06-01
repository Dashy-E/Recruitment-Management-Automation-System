import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_MGMT = ['ADMIN', 'HR', 'RECRUITER', 'BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD'];

// List all chemistry tests (optionally filtered by candidateId)
router.get('/', authenticate, authorize(...HR_MGMT), async (req, res) => {
  try {
    const { candidateId, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status;

    const [tests, total] = await Promise.all([
      prisma.chemistryTest.findMany({
        where,
        include: {
          candidate: { select: { id: true, candidateId: true, firstName: true, lastName: true, designation: true } },
          assignedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.chemistryTest.count({ where }),
    ]);

    res.json({ tests, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch chemistry tests' });
  }
});

// Get single chemistry test
router.get('/:id', authenticate, authorize(...HR_MGMT), async (req, res) => {
  try {
    const test = await prisma.chemistryTest.findUnique({
      where: { id: req.params.id },
      include: {
        candidate: { select: { id: true, candidateId: true, firstName: true, lastName: true, designation: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!test) return res.status(404).json({ message: 'Chemistry test not found' });
    res.json(test);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch chemistry test' });
  }
});

// Create chemistry test assignment
router.post('/', authenticate, authorize('ADMIN', 'HR', 'BRANCH_MANAGER', 'RECRUITER'), async (req, res) => {
  try {
    const { candidateId, testDate, examLink, maxScore, passingScore, remarks, notes } = req.body;
    if (!candidateId) return res.status(400).json({ message: 'candidateId is required' });

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const test = await prisma.chemistryTest.create({
      data: {
        candidateId,
        status: testDate ? 'SCHEDULED' : 'PENDING',
        testDate: testDate ? new Date(testDate) : null,
        examLink: examLink || null,
        maxScore: maxScore ? parseFloat(maxScore) : null,
        passingScore: passingScore ? parseFloat(passingScore) : null,
        remarks,
        notes,
        assignedById: req.user.id,
      },
      include: {
        candidate: { select: { id: true, candidateId: true, firstName: true, lastName: true, designation: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.status(201).json(test);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create chemistry test' });
  }
});

// Update chemistry test — also handles score recording (auto-computes PASSED/FAILED)
router.put('/:id', authenticate, authorize(...HR_MGMT), async (req, res) => {
  try {
    const { status, testDate, examLink, score, maxScore, passingScore, remarks, notes } = req.body;

    const existing = await prisma.chemistryTest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Chemistry test not found' });

    const data = { remarks, notes };
    if (status) data.status = status;
    if (testDate) data.testDate = new Date(testDate);
    if (examLink !== undefined) data.examLink = examLink || null;
    if (maxScore !== undefined) data.maxScore = parseFloat(maxScore);
    if (passingScore !== undefined) data.passingScore = parseFloat(passingScore);

    // If a score is being recorded, auto-compute pass/fail
    if (score !== undefined && score !== null && score !== '') {
      const parsedScore = parseFloat(score);
      const threshold = passingScore !== undefined ? parseFloat(passingScore) : existing.passingScore;
      data.score = parsedScore;
      if (threshold != null) {
        data.status = parsedScore >= threshold ? 'PASSED' : 'FAILED';
      } else {
        data.status = 'COMPLETED';
      }
    }

    const test = await prisma.chemistryTest.update({
      where: { id: req.params.id },
      data,
      include: {
        candidate: { select: { id: true, candidateId: true, firstName: true, lastName: true } },
        assignedBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(test);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update chemistry test' });
  }
});

// Delete chemistry test
router.delete('/:id', authenticate, authorize('ADMIN', 'HR', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    await prisma.chemistryTest.delete({ where: { id: req.params.id } });
    res.json({ message: 'Chemistry test deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete chemistry test' });
  }
});

export default router;
