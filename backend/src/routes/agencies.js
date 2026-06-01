import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { randomBytes } from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(query) {
  const pageNum = Math.max(1, parseInt(query.page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { pageNum, limitNum };
}

// 6 hex chars (16.7M possibilities) — no timestamp correlation
function generateAgencyCode(name) {
  const prefix = name.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `AGY-${prefix}-${suffix}`;
}

async function findActiveAgency(id) {
  return prisma.agency.findFirst({ where: { id, deletedAt: null } });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// List agencies
router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { search, status, tier } = req.query;
    const { pageNum, limitNum } = parsePagination(req.query);

    const where = { deletedAt: null };
    if (status) where.status = status;
    if (tier) where.tier = tier;
    if (search) {
      // SQLite's LIKE (used by Prisma contains) is case-insensitive for ASCII;
      // mode:'insensitive' is PostgreSQL-only and intentionally omitted.
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
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({ agencies, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error('List agencies:', err);
    res.status(500).json({ message: 'Failed to fetch agencies' });
  }
});

// Create agency
router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { contacts, name, contactPerson, email, phone, specializations, ...rest } = req.body;

    if (!name?.trim() || !contactPerson?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: 'name, contactPerson, email, and phone are required' });
    }

    const agency = await prisma.agency.create({
      data: {
        name, contactPerson, email, phone,
        ...rest,
        agencyCode: generateAgencyCode(name),
        specializations: JSON.stringify(Array.isArray(specializations) ? specializations : []),
        contacts: contacts?.length ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
    res.status(201).json(agency);
  } catch (err) {
    console.error('Create agency:', err);
    res.status(500).json({ message: 'Failed to create agency' });
  }
});

// NOTE: GET /my (agency partner self-service) was removed.
// The AGENCY_PARTNER role and portal were retired in Session 6.
// The AgencyPartner model was never added to the schema, so this route
// caused a Prisma runtime crash on every request. Route removed to prevent crash.

// Get agency detail
router.get('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
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
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
  } catch (err) {
    console.error('Get agency:', err);
    res.status(500).json({ message: 'Failed to fetch agency' });
  }
});

// Update agency
// contacts are managed by POST /:id/contacts — excluded from this update
router.put('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const agency = await findActiveAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    // Strip relation/computed fields a client may echo back
    const { contacts, id, createdAt, updatedAt, deletedAt, locations, submissions, _count, ...data } = req.body;
    if (data.specializations !== undefined) {
      data.specializations = JSON.stringify(Array.isArray(data.specializations) ? data.specializations : []);
    }

    const updated = await prisma.agency.update({
      where: { id: req.params.id },
      data,
      include: { contacts: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('Update agency:', err);
    res.status(500).json({ message: 'Failed to update agency' });
  }
});

// Soft delete agency
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const agency = await findActiveAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    await prisma.agency.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Agency deleted' });
  } catch (err) {
    console.error('Delete agency:', err);
    res.status(500).json({ message: 'Failed to delete agency' });
  }
});

// Add contact to agency
router.post('/:id/contacts', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const agency = await findActiveAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    if (!req.body.name?.trim()) {
      return res.status(400).json({ message: 'Contact name is required' });
    }

    const contact = await prisma.agencyContact.create({
      data: { ...req.body, agencyId: req.params.id },
    });
    res.status(201).json(contact);
  } catch (err) {
    console.error('Add contact:', err);
    res.status(500).json({ message: 'Failed to add contact' });
  }
});

// Submit candidate via agency
router.post('/:id/submissions', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const agency = await findActiveAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    const { mrfId, candidateId, fee, notes } = req.body;
    if (!mrfId || !candidateId) {
      return res.status(400).json({ message: 'mrfId and candidateId are required' });
    }

    const duplicate = await prisma.agencySubmission.findFirst({
      where: { agencyId: req.params.id, mrfId, candidateId },
    });
    if (duplicate) {
      return res.status(409).json({ message: 'This candidate has already been submitted for this MRF by this agency' });
    }

    const submission = await prisma.agencySubmission.create({
      data: { agencyId: req.params.id, mrfId, candidateId, fee, notes },
      include: { candidate: true, mrf: true },
    });
    await prisma.agency.update({
      where: { id: req.params.id },
      data: { totalSubmissions: { increment: 1 } },
    });
    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit candidate:', err);
    res.status(500).json({ message: 'Failed to submit candidate' });
  }
});

// Agency performance stats
router.get('/:id/performance', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const agency = await findActiveAgency(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    const submissions = await prisma.agencySubmission.findMany({
      where: { agencyId: req.params.id },
      include: { candidate: { select: { status: true } } },
    });

    const statuses = submissions.map(s => s.candidate?.status);
    const count = (vals) => statuses.filter(s => vals.includes(s)).length;

    const interviewed = count(['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED']);
    const offered     = count(['OFFER_SENT', 'OFFER_ACCEPTED']);
    const joined      = count(['ONBOARDED', 'CONFIRMED']);
    const rejected    = count(['REJECTED', 'OFFER_REJECTED']);
    const placed      = count(['OFFER_ACCEPTED', 'ONBOARDED', 'CONFIRMED']);
    const successRate = submissions.length ? Math.round((placed / submissions.length) * 100) : 0;

    res.json({
      agency,
      totalSubmissions: submissions.length,
      interviewed,
      offered,
      joined,
      rejected,
      placed,
      successRate,
    });
  } catch (err) {
    console.error('Performance stats:', err);
    res.status(500).json({ message: 'Failed to fetch performance stats' });
  }
});

export default router;
