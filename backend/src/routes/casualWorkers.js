import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateCandidateId } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// List casual workers
router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { status, workerType, department, page = 1, limit = 20 } = req.query;
    const where = { deletedAt: null };
    if (status) where.casualWorker = { status };
    if (workerType) where.isContractual = workerType === 'CONTRACTUAL';

    const [total, candidates] = await Promise.all([
      prisma.candidate.count({ where: { ...where, isContractual: true } }),
      prisma.candidate.findMany({
        where: { ...where, isContractual: true },
        include: { casualWorker: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ workers: candidates, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fast-track onboard a casual/contractual worker
router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, designation,
      aadhaarNumber, panNumber, address, city, state, country,
      workerType = 'CASUAL', contractStart, contractEnd,
      dailyRate, monthlyRate, bankAccount, ifscCode,
      department, reportingTo, siteLocation,
    } = req.body;

    // Duplicate check
    const existing = await prisma.candidate.findFirst({
      where: { OR: [{ email }, { phone }], deletedAt: null },
    });
    if (existing) {
      return res.status(409).json({ error: 'Worker already exists with this email or phone', existingId: existing.id });
    }

    const candidateId = await generateCandidateId();

    const candidate = await prisma.candidate.create({
      data: {
        candidateId,
        firstName, lastName, email, phone, designation,
        aadhaarNumber, panNumber, address, city,
        state: state || null,
        country: country || 'India',
        isContractual: true,
        source: 'DIRECT',
        status: 'ONBOARDED',
        experience: 0,
        addedById: req.user.id,
        casualWorker: {
          create: {
            workerType,
            contractStart: new Date(contractStart),
            contractEnd: contractEnd ? new Date(contractEnd) : null,
            dailyRate: dailyRate ? parseFloat(dailyRate) : null,
            monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
            aadhaarVerified: !!aadhaarNumber,
            panVerified: !!panNumber,
            bankAccount, ifscCode, department, reportingTo, siteLocation,
            addedById: req.user.id,
          },
        },
      },
      include: { casualWorker: true },
    });

    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single casual worker detail
router.get('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: { id: req.params.id, isContractual: true, deletedAt: null },
      include: { casualWorker: true, documents: true, communications: { orderBy: { sentAt: 'desc' }, take: 10 } },
    });
    if (!candidate) return res.status(404).json({ error: 'Worker not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update casual worker details
router.put('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { workerType, contractStart, contractEnd, dailyRate, monthlyRate,
      bankAccount, ifscCode, department, reportingTo, siteLocation,
      aadhaarVerified, panVerified, status, ...candidateData } = req.body;

    const [candidate] = await Promise.all([
      prisma.candidate.update({
        where: { id: req.params.id },
        data: candidateData,
      }),
      prisma.casualWorker.update({
        where: { candidateId: req.params.id },
        data: {
          workerType, bankAccount, ifscCode, department, reportingTo, siteLocation, status,
          contractStart: contractStart ? new Date(contractStart) : undefined,
          contractEnd: contractEnd ? new Date(contractEnd) : undefined,
          dailyRate: dailyRate != null ? parseFloat(dailyRate) : undefined,
          monthlyRate: monthlyRate != null ? parseFloat(monthlyRate) : undefined,
          aadhaarVerified: aadhaarVerified != null ? aadhaarVerified : undefined,
          panVerified: panVerified != null ? panVerified : undefined,
        },
      }),
    ]);

    const updated = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      include: { casualWorker: true },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Aadhaar / PAN (simple flag update — real verification via external API in production)
router.patch('/:id/verify', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { aadhaarVerified, panVerified } = req.body;
    const worker = await prisma.casualWorker.update({
      where: { candidateId: req.params.id },
      data: {
        aadhaarVerified: aadhaarVerified != null ? aadhaarVerified : undefined,
        panVerified: panVerified != null ? panVerified : undefined,
      },
    });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
