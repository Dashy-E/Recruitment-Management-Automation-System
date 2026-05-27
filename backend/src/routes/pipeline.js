import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// Get pipeline (stages + candidate entries) for an MRF
router.get('/mrf/:mrfId', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({
      where: { mrfId: req.params.mrfId },
      include: {
        entries: {
          include: {
            candidate: {
              select: {
                id: true, candidateId: true, firstName: true, lastName: true,
                email: true, phone: true, status: true, experience: true,
                designation: true, aiScreeningResult: { select: { matchScore: true, recommendation: true } },
              },
            },
          },
          orderBy: { enteredAt: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create default pipeline stages for an MRF
router.post('/mrf/:mrfId/init', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const defaults = [
      { name: 'Applied', order: 1, color: '#6366f1', isDefault: true },
      { name: 'Screening', order: 2, color: '#f59e0b', isDefault: true },
      { name: 'Interview', order: 3, color: '#3b82f6', isDefault: true },
      { name: 'Offer', order: 4, color: '#10b981', isDefault: true },
      { name: 'Hired', order: 5, color: '#22c55e', isDefault: true },
      { name: 'Rejected', order: 6, color: '#ef4444', isDefault: true },
    ];

    const stages = await Promise.all(defaults.map(d =>
      prisma.pipelineStage.upsert({
        where: { mrfId_order: { mrfId: req.params.mrfId, order: d.order } },
        create: { ...d, mrfId: req.params.mrfId },
        update: {},
      })
    ));
    res.status(201).json(stages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create custom stage
router.post('/mrf/:mrfId/stages', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { name, order, color } = req.body;
    const stage = await prisma.pipelineStage.create({
      data: { mrfId: req.params.mrfId, name, order, color },
    });
    res.status(201).json(stage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move candidate to a stage
router.post('/move', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateId, stageId, notes } = req.body;

    // Remove from any other stage in this pipeline
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const otherStages = await prisma.pipelineStage.findMany({
      where: { mrfId: stage.mrfId, id: { not: stageId } },
      select: { id: true },
    });
    const otherIds = otherStages.map(s => s.id);

    if (otherIds.length) {
      await prisma.pipelineEntry.deleteMany({
        where: { candidateId, stageId: { in: otherIds } },
      });
    }

    const entry = await prisma.pipelineEntry.upsert({
      where: { candidateId_stageId: { candidateId, stageId } },
      create: { candidateId, stageId, notes },
      update: { notes, enteredAt: new Date() },
      include: { candidate: { select: { firstName: true, lastName: true } }, stage: true },
    });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove candidate from pipeline
router.delete('/entry/:candidateId/:stageId', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    await prisma.pipelineEntry.deleteMany({
      where: { candidateId: req.params.candidateId, stageId: req.params.stageId },
    });
    res.json({ message: 'Entry removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
