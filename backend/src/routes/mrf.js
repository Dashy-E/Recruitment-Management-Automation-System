import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateMRFNumber, createAuditLog, createNotification, paginate } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, department, search } = req.query;
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (department) where.departmentId = department;
    if (search) where.OR = [{ designation: { contains: search } }, { mrfNumber: { contains: search } }];

    const [data, total] = await Promise.all([
      prisma.mRF.findMany({
        where,
        include: { department: true, createdBy: { select: { firstName: true, lastName: true, email: true } }, approvedBy: { select: { firstName: true, lastName: true } }, _count: { select: { candidates: true } } },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.mRF.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch MRFs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mrf = await prisma.mRF.findUnique({
      where: { id: req.params.id },
      include: { department: true, createdBy: { select: { firstName: true, lastName: true, email: true } }, approvedBy: { select: { firstName: true, lastName: true } }, candidates: { select: { id: true, firstName: true, lastName: true, status: true, designation: true } } },
    });
    if (!mrf) return res.status(404).json({ message: 'MRF not found' });
    res.json(mrf);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch MRF' });
  }
});

router.post('/', async (req, res) => {
  try {
    const mrfNumber = await generateMRFNumber();
    const mrf = await prisma.mRF.create({
      data: { ...req.body, mrfNumber, createdById: req.user.id, skills: JSON.stringify(req.body.skills || []) },
      include: { department: true },
    });
    await createAuditLog(req.user.id, 'CREATE', 'MRF', mrf.id, null, mrf);
    res.status(201).json(mrf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create MRF' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.mRF.findUnique({ where: { id: req.params.id } });
    const data = { ...req.body };
    if (data.skills && Array.isArray(data.skills)) data.skills = JSON.stringify(data.skills);
    const mrf = await prisma.mRF.update({ where: { id: req.params.id }, data, include: { department: true } });
    await createAuditLog(req.user.id, 'UPDATE', 'MRF', mrf.id, existing, mrf);
    res.json(mrf);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update MRF' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const mrf = await prisma.mRF.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedById: req.user.id, approvedAt: new Date() },
    });
    await createAuditLog(req.user.id, 'APPROVE', 'MRF', mrf.id, null, { status: 'APPROVED' });
    res.json(mrf);
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve MRF' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const mrf = await prisma.mRF.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    res.json(mrf);
  } catch (e) {
    res.status(500).json({ message: 'Failed to reject MRF' });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const mrf = await prisma.mRF.update({ where: { id: req.params.id }, data: { status: 'PENDING' } });
    res.json(mrf);
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit MRF' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.mRF.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'MRF deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete MRF' });
  }
});

export default router;
