import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// List incoming mails
router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const [total, mails] = await Promise.all([
      prisma.incomingMail.count({ where }),
      prisma.incomingMail.findMany({
        where,
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

// Manually ingest a mail (simulates email parsing / webhook)
router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { fromEmail, fromName, subject, body, receivedAt, attachments = [] } = req.body;
    const mail = await prisma.incomingMail.create({
      data: {
        fromEmail, fromName, subject, body,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        hasAttachment: attachments.length > 0,
        attachments: JSON.stringify(attachments),
        status: 'UNPROCESSED',
      },
    });
    res.status(201).json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single mail
router.get('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const mail = await prisma.incomingMail.findUnique({ where: { id: req.params.id } });
    if (!mail) return res.status(404).json({ error: 'Mail not found' });
    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark mail as processed and optionally link to candidate
router.patch('/:id/process', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateId, notes, status = 'PROCESSED' } = req.body;
    const mail = await prisma.incomingMail.update({
      where: { id: req.params.id },
      data: {
        status,
        candidateId: candidateId || null,
        processedById: req.user.id,
        processedAt: new Date(),
        notes,
      },
    });
    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-parse mail and create candidate profile
router.post('/:id/create-candidate', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const mail = await prisma.incomingMail.findUnique({ where: { id: req.params.id } });
    if (!mail) return res.status(404).json({ error: 'Mail not found' });

    // Extract basic candidate info from mail body using regex heuristics
    const emailMatch = mail.body?.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    const phoneMatch = mail.body?.match(/(\+91[\s-]?)?[6-9]\d{9}/);
    const nameMatch = mail.fromName || mail.body?.match(/(?:name\s*[:]\s*)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i)?.[1];

    const [firstName, ...restName] = (nameMatch || 'Unknown Applicant').split(' ');
    const lastName = restName.join(' ') || 'Unknown';
    const email = emailMatch?.[0] || mail.fromEmail;
    const phone = phoneMatch?.[0]?.replace(/\D/g, '').slice(-10) || '0000000000';

    // Check for duplicates
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

    // Generate candidate ID
    const count = await prisma.candidate.count();
    const candidateId = `C${String(count + 1).padStart(4, '0')}`;

    const candidate = await prisma.candidate.create({
      data: {
        candidateId,
        firstName, lastName, email, phone,
        designation: 'Unknown',
        source: 'EMAIL',
        sourceDetail: mail.fromEmail,
        addedById: req.user.id,
        status: 'APPLIED',
      },
    });

    await prisma.incomingMail.update({
      where: { id: mail.id },
      data: { candidateId: candidate.id, status: 'PROCESSED', processedById: req.user.id, processedAt: new Date() },
    });

    res.status(201).json({ candidate, mail: { id: mail.id, status: 'PROCESSED' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as spam / irrelevant
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
