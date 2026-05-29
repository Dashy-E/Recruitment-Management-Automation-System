import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateOfferNumber, generateAppointmentNumber } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const offers = await prisma.offerLetter.findMany({
      where,
      include: { candidate: { select: { firstName: true, lastName: true, email: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(offers);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

router.get('/mine', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: { email: req.user.email, deletedAt: null },
    });
    if (!candidate) return res.json(null);
    const offer = await prisma.offerLetter.findUnique({
      where: { candidateId: candidate.id },
      include: { candidate: true },
    });
    res.json(offer || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch offer' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const offer = await prisma.offerLetter.findUnique({
      where: { id: req.params.id },
      include: { candidate: true },
    });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch offer' });
  }
});

router.post('/', async (req, res) => {
  try {
    const existing = await prisma.offerLetter.findUnique({ where: { candidateId: req.body.candidateId } });
    if (existing) return res.status(409).json({ message: 'Offer letter already exists for this candidate' });

    const offerNumber = await generateOfferNumber();
    const { allowances, deductions, ...rest } = req.body;
    const offer = await prisma.offerLetter.create({
      data: {
        ...rest,
        offerNumber,
        allowances: JSON.stringify(allowances || []),
        deductions: JSON.stringify(deductions || []),
        basicSalary: parseFloat(rest.basicSalary),
        hra: parseFloat(rest.hra) || 0,
        grossSalary: parseFloat(rest.grossSalary),
        netSalary: parseFloat(rest.netSalary),
        ctc: parseFloat(rest.ctc),
        expiryDate: new Date(rest.expiryDate),
      },
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    res.status(201).json(offer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create offer letter' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.allowances && Array.isArray(data.allowances)) data.allowances = JSON.stringify(data.allowances);
    if (data.deductions && Array.isArray(data.deductions)) data.deductions = JSON.stringify(data.deductions);
    const offer = await prisma.offerLetter.update({ where: { id: req.params.id }, data });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update offer' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedById: req.user.id, approvedAt: new Date() },
    });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to approve offer' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'SENT', sentAt: new Date() },
    });
    await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_SENT' } });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to send offer' });
  }
});

router.post('/:id/accept', async (req, res) => {
  try {
    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_ACCEPTED' } });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to accept offer' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const offer = await prisma.offerLetter.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', respondedAt: new Date(), rejectionReason: req.body.reason },
    });
    await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_REJECTED' } });
    res.json(offer);
  } catch (e) {
    res.status(500).json({ message: 'Failed to reject offer' });
  }
});

// Appointment Letters
router.get('/appointments/all', async (req, res) => {
  try {
    const letters = await prisma.appointmentLetter.findMany({
      include: { candidate: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { generatedAt: 'desc' },
    });
    res.json(letters);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch appointment letters' });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const existing = await prisma.appointmentLetter.findUnique({ where: { candidateId: req.body.candidateId } });
    if (existing) return res.status(409).json({ message: 'Appointment letter already exists' });

    const appointmentNumber = await generateAppointmentNumber();
    const letter = await prisma.appointmentLetter.create({
      data: { ...req.body, appointmentNumber, joiningDate: new Date(req.body.joiningDate) },
      include: { candidate: { select: { firstName: true, lastName: true } } },
    });
    await prisma.candidate.update({ where: { id: req.body.candidateId }, data: { status: 'ONBOARDED' } });
    res.status(201).json(letter);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create appointment letter' });
  }
});

export default router;
