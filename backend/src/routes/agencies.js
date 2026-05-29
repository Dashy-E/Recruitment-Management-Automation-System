import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

function generateAgencyCode(name) {
  const prefix = name.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  return `AGY-${prefix}-${Date.now().toString().slice(-5)}`;
}

// List agencies
router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { search, status, tier, agencyType, page = 1, limit = 20 } = req.query;
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (agencyType) where.agencyType = agencyType;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const [total, agencies] = await Promise.all([
      prisma.agency.count({ where }),
      prisma.agency.findMany({
        where,
        include: { contacts: true, _count: { select: { submissions: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ agencies, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create agency
router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { contacts, ...data } = req.body;
    const agency = await prisma.agency.create({
      data: {
        ...data,
        agencyCode: generateAgencyCode(data.name),
        specializations: JSON.stringify(data.specializations || []),
        contacts: contacts
          ? { create: contacts }
          : undefined,
      },
      include: { contacts: true },
    });
    res.status(201).json(agency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get own agency (for AGENCY_PARTNER role)
router.get('/my', authenticate, authorize('AGENCY_PARTNER', 'ADMIN'), async (req, res) => {
  try {
    const partner = await prisma.agencyPartner.findUnique({
      where: { userId: req.user.id },
      include: {
        agency: {
          include: {
            contacts: true,
            locations: { include: { location: true } },
            submissions: {
              include: { candidate: true, mrf: true },
              orderBy: { submittedAt: 'desc' },
              take: 20,
            },
          },
        },
      },
    });
    if (!partner) return res.status(404).json({ error: 'No agency linked to your account' });
    const submissions = partner.agency.submissions;
    const placed = submissions.filter(s => ['OFFER_ACCEPTED', 'ONBOARDED', 'CONFIRMED'].includes(s.candidate?.status)).length;
    const successRate = submissions.length ? Math.round((placed / submissions.length) * 100) : 0;
    res.json({
      agency: partner.agency,
      performance: { totalSubmissions: submissions.length, placed, successRate },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get agency detail
router.get('/:id', authenticate, authorize(...HR_ROLES, 'AGENCY_PARTNER'), async (req, res) => {
  try {
    const agency = await prisma.agency.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        contacts: true,
        locations: { include: { location: true } },
        submissions: {
          include: { candidate: true, mrf: true },
          orderBy: { submittedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update agency
router.put('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { contacts, ...data } = req.body;
    if (data.specializations) data.specializations = JSON.stringify(data.specializations);
    const agency = await prisma.agency.update({
      where: { id: req.params.id },
      data,
      include: { contacts: true },
    });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft delete agency
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.agency.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Agency deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add contact to agency
router.post('/:id/contacts', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const contact = await prisma.agencyContact.create({
      data: { ...req.body, agencyId: req.params.id },
    });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit candidate via agency
router.post('/:id/submissions', authenticate, authorize(...HR_ROLES, 'AGENCY_PARTNER'), async (req, res) => {
  try {
    const { mrfId, candidateId, fee, notes } = req.body;
    const submission = await prisma.agencySubmission.create({
      data: { agencyId: req.params.id, mrfId, candidateId, fee, notes },
      include: { candidate: true, mrf: true },
    });
    // Update agency stats
    await prisma.agency.update({
      where: { id: req.params.id },
      data: { totalSubmissions: { increment: 1 } },
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get performance stats for an agency
router.get('/:id/performance', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const agency = await prisma.agency.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    const submissions = await prisma.agencySubmission.findMany({
      where: { agencyId: req.params.id },
      include: { candidate: { select: { status: true } } },
    });
    const placed = submissions.filter(s => ['OFFER_ACCEPTED', 'ONBOARDED', 'CONFIRMED'].includes(s.candidate?.status)).length;
    const successRate = submissions.length ? Math.round((placed / submissions.length) * 100) : 0;
    res.json({ totalSubmissions: submissions.length, placed, successRate, agency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
