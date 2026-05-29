import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// ─── Email Templates ──────────────────────────────────────────────────────────

router.get('/templates', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    const templates = await prisma.emailTemplate.findMany({ where, orderBy: { name: 'asc' } });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/templates', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const data = req.body;
    if (Array.isArray(data.variables)) data.variables = JSON.stringify(data.variables);
    const template = await prisma.emailTemplate.create({ data });
    res.status(201).json(template);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Template name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/templates/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const data = req.body;
    if (Array.isArray(data.variables)) data.variables = JSON.stringify(data.variables);
    const template = await prisma.emailTemplate.update({ where: { id: req.params.id }, data });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/templates/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    await prisma.emailTemplate.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Template deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Communications / Send ────────────────────────────────────────────────────

router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateId, channel, page = 1, limit = 20 } = req.query;
    const where = {};
    if (candidateId) where.candidateId = candidateId;
    if (channel) where.channel = channel;
    const [total, comms] = await Promise.all([
      prisma.communication.count({ where }),
      prisma.communication.findMany({
        where,
        include: {
          candidate: { select: { firstName: true, lastName: true, email: true } },
          template: { select: { name: true, category: true } },
          sentBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ communications: comms, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a communication (single or bulk)
router.post('/send', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateIds, templateId, subject, body, channel = 'EMAIL', metadata } = req.body;

    const ids = Array.isArray(candidateIds) ? candidateIds : [candidateIds];

    // Resolve template if provided
    let resolvedSubject = subject;
    let resolvedBody = body;
    if (templateId && !subject && !body) {
      const tmpl = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
      if (tmpl) { resolvedSubject = tmpl.subject; resolvedBody = tmpl.body; }
    }

    const records = await Promise.all(ids.map(async (candidateId) => {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { email: true, phone: true, firstName: true, lastName: true },
      });

      let emailStatus = 'SENT';
      let failureReason = null;

      if (channel === 'EMAIL' && candidate?.email) {
        const result = await sendEmail({
          to: candidate.email,
          subject: resolvedSubject,
          html: resolvedBody,
        });
        if (!result.success) {
          emailStatus = 'FAILED';
          failureReason = result.error;
        }
      }

      return prisma.communication.create({
        data: {
          candidateId,
          templateId: templateId || null,
          sentById: req.user.id,
          subject: resolvedSubject,
          body: resolvedBody,
          channel,
          recipientEmail: candidate?.email,
          recipientPhone: candidate?.phone,
          metadata: metadata ? JSON.stringify(metadata) : null,
          status: emailStatus,
          failureReason,
        },
      });
    }));

    res.status(201).json({ sent: records.length, records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview template with variable substitution
router.post('/templates/:id/preview', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const { variables = {} } = req.body;
    let subject = template.subject;
    let body = template.body;
    Object.entries(variables).forEach(([k, v]) => {
      subject = subject.replaceAll(`{{${k}}}`, v);
      body = body.replaceAll(`{{${k}}}`, v);
    });
    res.json({ subject, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
