import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateBatchCode, paginate } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Batches
router.get('/batches', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const batches = await prisma.trainingBatch.findMany({
      where,
      include: {
        managedBy: { select: { firstName: true, lastName: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(batches);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch batches' });
  }
});

router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: req.params.id },
      include: {
        enrollments: {
          include: { candidate: { select: { firstName: true, lastName: true, email: true, designation: true, status: true } } },
        },
        attendance: { orderBy: { date: 'desc' } },
        managedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch batch' });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const batchCode = await generateBatchCode();
    const batch = await prisma.trainingBatch.create({
      data: { ...req.body, batchCode, managedById: req.user.id },
    });
    res.status(201).json(batch);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create batch' });
  }
});

router.put('/batches/:id', async (req, res) => {
  try {
    const batch = await prisma.trainingBatch.update({ where: { id: req.params.id }, data: req.body });
    res.json(batch);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update batch' });
  }
});

// Enroll candidates into a batch
router.post('/batches/:id/enroll', async (req, res) => {
  try {
    const { candidateIds } = req.body;
    const results = [];
    for (const candidateId of candidateIds) {
      const existing = await prisma.trainingEnrollment.findUnique({ where: { candidateId } });
      if (!existing) {
        const enrollment = await prisma.trainingEnrollment.create({
          data: { candidateId, batchId: req.params.id },
        });
        await prisma.candidate.update({ where: { id: candidateId }, data: { status: 'TRAINING_IN_PROGRESS' } });
        results.push(enrollment);
      }
    }
    res.status(201).json(results);
  } catch (e) {
    res.status(500).json({ message: 'Failed to enroll candidates' });
  }
});

// Update enrollment status
router.put('/enrollments/:id', async (req, res) => {
  try {
    const enrollment = await prisma.trainingEnrollment.update({
      where: { id: req.params.id },
      data: { ...req.body, completionDate: req.body.status === 'COMPLETED' ? new Date() : undefined },
    });
    if (req.body.status === 'COMPLETED') {
      await prisma.candidate.update({ where: { id: enrollment.candidateId }, data: { status: 'EXAM_PENDING' } });
    }
    res.json(enrollment);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update enrollment' });
  }
});

// Attendance
router.post('/attendance', async (req, res) => {
  try {
    const { batchId, date, records } = req.body;
    const results = [];
    for (const { candidateId, present, remarks } of records) {
      const att = await prisma.trainingAttendance.upsert({
        where: { batchId_candidateId_date: { batchId, candidateId, date: new Date(date) } },
        update: { present, remarks, markedBy: req.user.id },
        create: { batchId, candidateId, date: new Date(date), present, remarks, markedBy: req.user.id },
      });
      results.push(att);
    }
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

router.get('/attendance/:batchId', async (req, res) => {
  try {
    const { date } = req.query;
    const where = { batchId: req.params.batchId };
    if (date) where.date = { gte: new Date(date), lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) };
    const attendance = await prisma.trainingAttendance.findMany({ where, orderBy: { date: 'desc' } });
    res.json(attendance);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

export default router;
