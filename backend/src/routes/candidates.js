import express from 'express';
import multer from 'multer';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCandidateId, createAuditLog, paginate } from '../utils/helpers.js';

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 10485760) } });

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, mrfId, search } = req.query;
    const where = { deletedAt: null };
    if (status) where.status = status;
    if (mrfId) where.mrfId = mrfId;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { candidateId: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          mrf: { select: { mrfNumber: true, designation: true } },
          addedBy: { select: { firstName: true, lastName: true } },
          interviews: { orderBy: { scheduledAt: 'desc' }, take: 1 },
          trainingEnrollment: { include: { batch: true } },
          examAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
          offerLetter: { select: { status: true, ctc: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.candidate.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      include: {
        mrf: true,
        addedBy: { select: { firstName: true, lastName: true } },
        documents: true,
        comments: { include: { commentedBy: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
        interviews: { include: { scheduledBy: { select: { firstName: true, lastName: true } }, feedback: { include: { interviewer: { select: { firstName: true, lastName: true } } } } }, orderBy: { scheduledAt: 'desc' } },
        assessments: true,
        trainingEnrollment: { include: { batch: true } },
        examAttempts: { orderBy: { createdAt: 'desc' } },
        offerLetter: true,
        appointmentLetter: true,
        probation: true,
      },
    });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch candidate' });
  }
});

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const candidateId = await generateCandidateId();
    const data = {
      ...req.body,
      candidateId,
      addedById: req.user.id,
      experience: parseInt(req.body.experience) || 0,
      skills: JSON.stringify(Array.isArray(req.body.skills) ? req.body.skills : (req.body.skills ? req.body.skills.split(',').map(s => s.trim()) : [])),
      education: JSON.stringify([]),
      certifications: JSON.stringify([]),
    };
    if (req.file) data.resumePath = req.file.path;

    const existing = await prisma.candidate.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) return res.status(409).json({ message: 'A candidate with this email or phone already exists', existingId: existing.id });

    const candidate = await prisma.candidate.create({ data });
    await createAuditLog(req.user.id, 'CREATE', 'Candidate', candidate.id, null, candidate);
    res.status(201).json(candidate);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to create candidate' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.skills && Array.isArray(data.skills)) data.skills = JSON.stringify(data.skills);
    if (data.experience) data.experience = parseInt(data.experience);
    const candidate = await prisma.candidate.update({ where: { id: req.params.id }, data });
    res.json(candidate);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update candidate' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const candidate = await prisma.candidate.update({ where: { id: req.params.id }, data: { status } });
    await createAuditLog(req.user.id, 'STATUS_CHANGE', 'Candidate', candidate.id, {}, { status });
    res.json(candidate);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Upload document
router.post('/:id/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const doc = await prisma.candidateDocument.create({
      data: {
        candidateId: req.params.id,
        docType: req.body.docType || 'OTHER',
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// Comments
router.post('/:id/comments', async (req, res) => {
  try {
    const comment = await prisma.candidateComment.create({
      data: { candidateId: req.params.id, comment: req.body.comment, commentedById: req.user.id },
      include: { commentedBy: { select: { firstName: true, lastName: true } } },
    });
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const comment = await prisma.candidateComment.update({
      where: { id: req.params.commentId },
      data: { comment: req.body.comment },
    });
    res.json(comment);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.candidate.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Candidate deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete candidate' });
  }
});

// Bulk CSV import
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Parse a single CSV line handling quoted fields (commas inside quotes, escaped quotes)
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } // escaped quote
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

router.post('/import/csv', csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const text = req.file.buffer.toString('utf-8').replace(/^﻿/, ''); // strip BOM
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ message: 'CSV must have a header row and at least one data row' });

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));

    const required = ['firstname', 'lastname', 'email', 'phone', 'designation'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) return res.status(400).json({ message: `Missing required columns: ${missing.join(', ')}` });

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      let values;
      try { values = parseCSVLine(lines[i]); } catch {
        results.errors.push({ row: i + 1, reason: 'Malformed CSV row' });
        continue;
      }

      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });

      const missingFields = [];
      if (!row.firstname) missingFields.push('firstname');
      if (!row.email) missingFields.push('email');
      if (!row.phone) missingFields.push('phone');
      if (!row.designation) missingFields.push('designation');
      if (missingFields.length) {
        results.errors.push({ row: i + 1, reason: `Missing: ${missingFields.join(', ')}` });
        continue;
      }

      if (!/^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i.test(row.email)) {
        results.errors.push({ row: i + 1, reason: `Invalid email: ${row.email}` });
        continue;
      }

      try {
        const existing = await prisma.candidate.findFirst({
          where: { OR: [{ email: row.email.toLowerCase() }, { phone: row.phone }], deletedAt: null },
        });
        if (existing) { results.skipped++; continue; }

        const candidateId = await generateCandidateId(prisma);
        await prisma.candidate.create({
          data: {
            candidateId,
            firstName: row.firstname,
            lastName: row.lastname || '',
            email: row.email.toLowerCase(),
            phone: row.phone,
            designation: row.designation,
            experience: parseInt(row.experience) || 0,
            currentCompany: row.currentcompany || null,
            city: row.city || null,
            source: (['DIRECT', 'AGENCY', 'REFERRAL', 'PORTAL', 'WALK_IN'].includes((row.source || '').toUpperCase())
              ? row.source.toUpperCase() : 'DIRECT'),
            addedById: req.user.id,
            skills: '[]',
            education: '[]',
            certifications: '[]',
          },
        });
        results.created++;
      } catch (dbErr) {
        results.errors.push({ row: i + 1, reason: 'Database error — possible duplicate key' });
      }
    }

    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to import CSV' });
  }
});

export default router;
