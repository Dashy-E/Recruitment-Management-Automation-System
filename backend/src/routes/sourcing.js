import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

const PLATFORM_LABELS = {
  LINKEDIN: 'LinkedIn',
  NAUKRI: 'Naukri',
  INDEED: 'Indeed',
  INTERNSHALA: 'Internshala',
  MONSTER: 'Monster India',
  SHINE: 'Shine',
  OTHER: 'Other',
};

// Generate a formatted job description for a platform
function formatDescription(mrf, platform) {
  const skills = (() => { try { return JSON.parse(mrf.skills || '[]'); } catch { return []; } })();
  const skillsText = skills.length ? skills.join(' | ') : 'As required';
  const salary = mrf.salaryMin
    ? `₹${(mrf.salaryMin / 100000).toFixed(1)}L – ₹${(mrf.salaryMax / 100000).toFixed(1)}L per annum`
    : 'As per industry standards';

  const base = `${mrf.designation}
${mrf.department?.name || 'Department: TBD'} | ${mrf.location || 'Location: TBD'} | ${mrf.experience || 'Experience: Open'} | ${salary}

About the Role:
${mrf.description || 'We are looking for a talented ' + mrf.designation + ' to join our team.'}

Key Requirements:
- Experience: ${mrf.experience || 'Open'}
- Skills: ${skillsText}
- Vacancies: ${mrf.vacancies}
- Worker Type: ${mrf.workerType || 'PERMANENT'}

To Apply:
Send your CV to our HR team or apply directly through this posting.

${mrf.mrfNumber ? 'Reference: ' + mrf.mrfNumber : ''}`;

  if (platform === 'LINKEDIN') {
    return base + '\n\n#hiring #jobs #' + (mrf.designation?.replace(/\s+/g, '') || 'career');
  }
  return base;
}

// List all job postings
router.get('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { status, platform, mrfId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (mrfId) where.mrfId = mrfId;

    const [total, postings] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        include: {
          mrf: { select: { id: true, mrfNumber: true, designation: true, location: true, workerType: true } },
          postedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { postedAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ postings, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get postings for a specific MRF
router.get('/mrf/:mrfId', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const postings = await prisma.jobPosting.findMany({
      where: { mrfId: req.params.mrfId },
      include: { postedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { postedAt: 'desc' },
    });
    res.json(postings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate description text for a platform (preview before posting)
router.post('/generate-description', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { mrfId, platform = 'OTHER' } = req.body;
    const mrf = await prisma.mRF.findUnique({
      where: { id: mrfId },
      include: { department: true },
    });
    if (!mrf) return res.status(404).json({ error: 'MRF not found' });
    res.json({ description: formatDescription(mrf, platform), platform, platformLabel: PLATFORM_LABELS[platform] || platform });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a job posting
router.post('/', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { mrfId, platform, title, description, postUrl, expiresAt, notes } = req.body;
    if (!mrfId || !platform) return res.status(400).json({ error: 'mrfId and platform are required' });

    const mrf = await prisma.mRF.findUnique({ where: { id: mrfId }, include: { department: true } });
    if (!mrf) return res.status(404).json({ error: 'MRF not found' });

    const posting = await prisma.jobPosting.create({
      data: {
        mrfId,
        platform,
        title: title || mrf.designation,
        description: description || formatDescription(mrf, platform),
        postUrl: postUrl || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
        postedById: req.user.id,
      },
      include: {
        mrf: { select: { mrfNumber: true, designation: true, location: true } },
        postedBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.status(201).json(posting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a posting (URL, status, application count)
router.put('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { postUrl, status, applications, notes, expiresAt } = req.body;
    const data = {};
    if (postUrl !== undefined) data.postUrl = postUrl;
    if (status) data.status = status;
    if (applications !== undefined) data.applications = Number(applications);
    if (notes !== undefined) data.notes = notes;
    if (expiresAt) data.expiresAt = new Date(expiresAt);
    const posting = await prisma.jobPosting.update({ where: { id: req.params.id }, data });
    res.json(posting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a posting
router.delete('/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    await prisma.jobPosting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Posting deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { PLATFORM_LABELS };
export default router;
