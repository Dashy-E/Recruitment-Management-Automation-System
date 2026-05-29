import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateMRFNumber, createAuditLog, createNotification, paginate } from '../utils/helpers.js';
import { sendEmail } from '../utils/mailer.js';

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

// Suggest agencies for an MRF based on geographic proximity
router.get('/:id/suggested-agencies', async (req, res) => {
  try {
    const mrf = await prisma.mRF.findUnique({ where: { id: req.params.id } });
    if (!mrf) return res.status(404).json({ message: 'MRF not found' });

    const locationStr = [mrf.location, mrf.branch].filter(Boolean).join(' ').toLowerCase();

    const agencies = await prisma.agency.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        locations: { include: { location: true } },
      },
    });

    // Score by geographic match: 2 = city match, 1 = state match, 0 = no match
    const scored = agencies.map(a => {
      let score = 0;
      for (const al of a.locations) {
        const city = al.location.city.toLowerCase();
        const state = al.location.state.toLowerCase();
        if (locationStr && locationStr.includes(city)) { score = 2; break; }
        if (locationStr && locationStr.includes(state)) score = Math.max(score, 1);
      }
      return { ...a, locationScore: score };
    });

    const tierOrder = { PREMIUM: 3, PREFERRED: 2, STANDARD: 1 };
    scored.sort((a, b) => {
      if (b.locationScore !== a.locationScore) return b.locationScore - a.locationScore;
      if ((tierOrder[b.tier] || 0) !== (tierOrder[a.tier] || 0)) return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
      const aRate = a.totalSubmissions ? a.successfulHires / a.totalSubmissions : 0;
      const bRate = b.totalSubmissions ? b.successfulHires / b.totalSubmissions : 0;
      return bRate - aRate;
    });

    res.json({ agencies: scored, mrf: { id: mrf.id, designation: mrf.designation, location: mrf.location } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch suggested agencies' });
  }
});

// Get outreach history for an MRF
router.get('/:id/outreach', async (req, res) => {
  try {
    const outreach = await prisma.mrfOutreach.findMany({
      where: { mrfId: req.params.id },
      include: {
        agency: { select: { id: true, name: true, agencyType: true, email: true } },
        sentBy: { select: { firstName: true, lastName: true } },
        replies: { select: { id: true, fromEmail: true, subject: true, receivedAt: true, status: true } },
      },
      orderBy: { sentAt: 'desc' },
    });
    res.json(outreach);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch outreach' });
  }
});

// Send agency outreach emails for an MRF
router.post('/:id/outreach', async (req, res) => {
  try {
    const { agencyIds, subject, body } = req.body;
    if (!agencyIds?.length) return res.status(400).json({ message: 'Select at least one agency' });

    const mrf = await prisma.mRF.findUnique({ where: { id: req.params.id }, include: { department: true } });
    if (!mrf) return res.status(404).json({ message: 'MRF not found' });

    const agencies = await prisma.agency.findMany({
      where: { id: { in: agencyIds }, deletedAt: null },
      include: { contacts: { where: { isPrimary: true }, take: 1 } },
    });

    const results = [];
    for (const agency of agencies) {
      const recipientEmail = agency.contacts[0]?.email || agency.email;
      const filledBody = body
        .replace(/{{agencyName}}/g, agency.name)
        .replace(/{{designation}}/g, mrf.designation)
        .replace(/{{vacancies}}/g, mrf.vacancies)
        .replace(/{{location}}/g, mrf.location || 'TBD')
        .replace(/{{mrfNumber}}/g, mrf.mrfNumber)
        .replace(/{{experience}}/g, mrf.experience || 'As required');

      const emailResult = await sendEmail({ to: recipientEmail, subject, html: filledBody.replace(/\n/g, '<br>'), text: filledBody });

      const outreach = await prisma.mrfOutreach.create({
        data: { mrfId: mrf.id, agencyId: agency.id, sentById: req.user.id, subject, body: filledBody, status: 'SENT' },
      });
      results.push({ agency: agency.name, email: recipientEmail, outreachId: outreach.id, emailResult });
    }

    res.json({ sent: results.length, results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to send outreach' });
  }
});

export default router;
