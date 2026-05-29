import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { status, agencyId, mrfId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (agencyId) where.agencyId = agencyId;
    if (mrfId) where.mrfId = mrfId;
    const [total, mails] = await Promise.all([
      prisma.incomingMail.count({ where }),
      prisma.incomingMail.findMany({
        where,
        include: {
          agency: { select: { id: true, name: true, agencyType: true } },
          mrf: { select: { id: true, mrfNumber: true, designation: true } },
          outreach: { select: { id: true, subject: true, sentAt: true } },
        },
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ mails, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { fromEmail, fromName, subject, body, receivedAt, attachments = [], agencyId, mrfId, outreachId } = req.body;

    // Auto-detect agency from sender email if not provided
    let resolvedAgencyId = agencyId || null;
    if (!resolvedAgencyId && fromEmail) {
      const domain = fromEmail.split('@')[1];
      const agency = await prisma.agency.findFirst({
        where: { email: { contains: domain }, deletedAt: null },
      });
      if (agency) resolvedAgencyId = agency.id;
    }

    // If outreachId provided, increment response count
    if (outreachId) {
      await prisma.mrfOutreach.update({
        where: { id: outreachId },
        data: { responseCount: { increment: 1 }, status: 'RESPONDED' },
      });
    }

    const mail = await prisma.incomingMail.create({
      data: {
        fromEmail, fromName, subject, body,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        hasAttachment: attachments.length > 0,
        attachments: JSON.stringify(attachments),
        status: 'UNPROCESSED',
        agencyId: resolvedAgencyId,
        mrfId: mrfId || null,
        outreachId: outreachId || null,
      },
      include: { agency: { select: { id: true, name: true, agencyType: true } } },
    });
    res.status(201).json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const mail = await prisma.incomingMail.findUnique({
      where: { id: req.params.id },
      include: {
        agency: { select: { id: true, name: true, agencyType: true, email: true } },
        mrf: { select: { id: true, mrfNumber: true, designation: true, workerType: true } },
        outreach: { select: { id: true, subject: true, sentAt: true } },
      },
    });
    if (!mail) return res.status(404).json({ error: 'Mail not found' });
    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/process', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateId, notes, status = 'PROCESSED', agencyId, mrfId } = req.body;
    const data = {
      status,
      candidateId: candidateId || null,
      processedById: req.user.id,
      processedAt: new Date(),
      notes,
    };
    if (agencyId) data.agencyId = agencyId;
    if (mrfId) data.mrfId = mrfId;
    const mail = await prisma.incomingMail.update({ where: { id: req.params.id }, data });
    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-parse mail body and create a candidate record
router.post('/:id/create-candidate', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const mail = await prisma.incomingMail.findUnique({
      where: { id: req.params.id },
      include: { mrf: true },
    });
    if (!mail) return res.status(404).json({ error: 'Mail not found' });

    const emailMatch = mail.body?.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    const phoneMatch = mail.body?.match(/(\+91[\s-]?)?[6-9]\d{9}/);
    const nameMatch = mail.fromName || mail.body?.match(/(?:name\s*[:]\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i)?.[1];

    const [firstName, ...restName] = (nameMatch || 'Unknown Applicant').split(' ');
    const lastName = restName.join(' ') || 'Unknown';
    const email = emailMatch?.[0] || mail.fromEmail;
    const phone = phoneMatch?.[0]?.replace(/\D/g, '').slice(-10) || '0000000000';

    const existing = await prisma.candidate.findFirst({
      where: { OR: [{ email }, { phone }], deletedAt: null },
    });
    if (existing) {
      await prisma.incomingMail.update({
        where: { id: mail.id },
        data: { candidateId: existing.id, status: 'LINKED', processedById: req.user.id, processedAt: new Date() },
      });
      return res.status(409).json({ error: 'Candidate already exists', candidate: existing });
    }

    const count = await prisma.candidate.count();
    const candidateId = `C${String(count + 1).padStart(4, '0')}`;

    const candidate = await prisma.candidate.create({
      data: {
        candidateId,
        firstName, lastName, email, phone,
        designation: mail.mrf?.designation || 'Unknown',
        source: 'AGENCY',
        sourceDetail: mail.fromEmail,
        mrfId: mail.mrfId || null,
        addedById: req.user.id,
        status: 'APPLIED',
        skills: '[]',
        education: '[]',
        certifications: '[]',
      },
    });

    await prisma.incomingMail.update({
      where: { id: mail.id },
      data: { candidateId: candidate.id, status: 'LINKED', processedById: req.user.id, processedAt: new Date() },
    });

    res.status(201).json({ candidate, mail: { id: mail.id, status: 'LINKED' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/discard', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const mail = await prisma.incomingMail.update({
      where: { id: req.params.id },
      data: { status: 'DISCARDED', processedById: req.user.id, processedAt: new Date() },
    });
    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
