import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const VALID_DOC_TYPES = ['ID_PROOF', 'PAN_CARD', 'AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'EDUCATION', 'CERTIFICATE', 'OTHER'];
const DOC_NUMBER_RE = /^[a-zA-Z0-9\-\/\s]{2,50}$/;

// GET /employee-documents — list current user's documents
router.get('/', authenticate, async (req, res) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    console.error('Get employee documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// POST /employee-documents — add a new document entry
router.post('/', authenticate, async (req, res) => {
  const { docType, docNumber, issuingAuthority, issueDate, expiryDate } = req.body;

  if (!docType || !VALID_DOC_TYPES.includes(docType))
    return res.status(400).json({ message: 'Invalid document type' });
  if (!docNumber || !DOC_NUMBER_RE.test(docNumber.trim()))
    return res.status(400).json({ message: 'Document number must be 2–50 alphanumeric characters' });
  if (!issuingAuthority || !issuingAuthority.trim())
    return res.status(400).json({ message: 'Issuing authority is required' });
  if (!issueDate)
    return res.status(400).json({ message: 'Issue date is required' });

  const issueDt = new Date(issueDate);
  if (isNaN(issueDt) || issueDt >= new Date())
    return res.status(400).json({ message: 'Issue date must be in the past' });

  let expiryDt = null;
  if (expiryDate) {
    expiryDt = new Date(expiryDate);
    if (isNaN(expiryDt) || expiryDt <= issueDt)
      return res.status(400).json({ message: 'Expiry date must be after issue date' });
  }

  try {
    const doc = await prisma.employeeDocument.create({
      data: {
        userId: req.user.id,
        docType,
        docNumber: docNumber.trim().toUpperCase(),
        issuingAuthority: issuingAuthority.trim(),
        issueDate: issueDt,
        expiryDate: expiryDt,
      },
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error('Create employee document:', err);
    res.status(500).json({ message: 'Failed to save document' });
  }
});

// DELETE /employee-documents/:id — remove own document
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.userId !== req.user.id) return res.status(403).json({ message: 'Not authorised' });

    await prisma.employeeDocument.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document removed' });
  } catch (err) {
    console.error('Delete employee document:', err);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

export default router;
