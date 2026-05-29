import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

const MANAGEMENT_ROLES = ['ADMIN', 'BRANCH_MANAGER', 'COUNTRY_MANAGER', 'MD', 'HR'];

// List all probation records
router.get('/', authorize(...MANAGEMENT_ROLES), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.candidate = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { candidateId: { contains: search } },
        ],
      };
    }
    const [records, total] = await Promise.all([
      prisma.probation.findMany({
        where,
        include: {
          candidate: {
            select: { id: true, candidateId: true, firstName: true, lastName: true, email: true, designation: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.probation.count({ where }),
    ]);
    res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch probation records' });
  }
});

// Get single probation record
router.get('/:id', authorize(...MANAGEMENT_ROLES), async (req, res) => {
  try {
    const record = await prisma.probation.findUnique({
      where: { id: req.params.id },
      include: { candidate: true },
    });
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch probation record' });
  }
});

// Create probation record
router.post('/', authorize('ADMIN', 'HR', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { candidateId, startDate, endDate, reviewDate, remarks } = req.body;
    const existing = await prisma.probation.findUnique({ where: { candidateId } });
    if (existing) return res.status(409).json({ message: 'Probation record already exists for this candidate' });
    const record = await prisma.probation.create({
      data: { candidateId, startDate: new Date(startDate), endDate: new Date(endDate), reviewDate: reviewDate ? new Date(reviewDate) : null, remarks },
      include: { candidate: { select: { firstName: true, lastName: true, candidateId: true } } },
    });
    res.status(201).json(record);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create probation record' });
  }
});

// Update probation record
router.put('/:id', authorize(...MANAGEMENT_ROLES), async (req, res) => {
  try {
    const { startDate, endDate, extendedEndDate, reviewDate, status, remarks, extensionReason } = req.body;
    const data = { status, remarks, extensionReason };
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);
    if (extendedEndDate) data.extendedEndDate = new Date(extendedEndDate);
    if (reviewDate) data.reviewDate = new Date(reviewDate);
    const record = await prisma.probation.update({
      where: { id: req.params.id },
      data,
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    res.json(record);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update probation record' });
  }
});

// Approve probation (multi-level: BRANCH_MANAGER → COUNTRY_MANAGER → MD)
router.post('/:id/approve', async (req, res) => {
  try {
    const { role } = req.user;
    const record = await prisma.probation.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ message: 'Not found' });

    const data = {};
    const approval = `APPROVED by ${req.user.firstName} ${req.user.lastName}`;

    if (role === 'BRANCH_MANAGER' || role === 'ADMIN') data.branchManagerApproval = approval;
    else if (role === 'COUNTRY_MANAGER') data.countryManagerApproval = approval;
    else if (role === 'MD') {
      data.mdApproval = approval;
      // All three levels done — pass probation
      if (record.branchManagerApproval && record.countryManagerApproval) {
        data.status = 'PASSED';
        await prisma.candidate.update({ where: { id: record.candidateId }, data: { status: 'CONFIRMED' } });
      }
    } else {
      return res.status(403).json({ message: 'Not authorised to approve probation' });
    }

    const updated = await prisma.probation.update({
      where: { id: req.params.id },
      data,
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve probation' });
  }
});

// Extend probation
router.post('/:id/extend', authorize('ADMIN', 'BRANCH_MANAGER', 'HR'), async (req, res) => {
  try {
    const { extendedEndDate, extensionReason } = req.body;
    if (!extendedEndDate) return res.status(400).json({ message: 'extendedEndDate is required' });
    const record = await prisma.probation.update({
      where: { id: req.params.id },
      data: { extendedEndDate: new Date(extendedEndDate), extensionReason, status: 'EXTENDED' },
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    res.json(record);
  } catch (e) {
    res.status(500).json({ message: 'Failed to extend probation' });
  }
});

// Fail probation
router.post('/:id/fail', authorize('ADMIN', 'BRANCH_MANAGER', 'MD'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const record = await prisma.probation.update({
      where: { id: req.params.id },
      data: { status: 'FAILED', remarks },
    });
    await prisma.candidate.update({ where: { id: record.candidateId }, data: { status: 'REJECTED' } });
    res.json(record);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update probation status' });
  }
});

export default router;
