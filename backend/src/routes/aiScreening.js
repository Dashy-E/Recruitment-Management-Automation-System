import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const HR_ROLES = ['ADMIN', 'HR', 'RECRUITER'];

// ─── Job Descriptions ─────────────────────────────────────────────────────────

router.get('/jd', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const jds = await prisma.jobDescription.findMany({
      include: { mrf: { select: { mrfNumber: true, designation: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jd', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { mrfId, title, description, requirements, skills, experience } = req.body;
    const jd = await prisma.jobDescription.upsert({
      where: { mrfId },
      create: {
        mrfId, title, description, requirements,
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        experience,
      },
      update: {
        title, description, requirements,
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        experience, processedAt: null, vectorData: null,
      },
      include: { mrf: { select: { mrfNumber: true, designation: true } } },
    });
    res.status(201).json(jd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/jd/:id', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const jd = await prisma.jobDescription.findUnique({
      where: { id: req.params.id },
      include: {
        mrf: { select: { mrfNumber: true, designation: true, status: true } },
        screeningResults: {
          include: {
            candidate: { select: { firstName: true, lastName: true, email: true, status: true } },
          },
          orderBy: { matchScore: 'desc' },
        },
      },
    });
    if (!jd) return res.status(404).json({ error: 'JD not found' });
    res.json(jd);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Screening Results ─────────────────────────────────────────────────────

router.get('/results', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { jdId, minScore, page = 1, limit = 20 } = req.query;
    const where = {};
    if (jdId) where.jdId = jdId;
    if (minScore) where.matchScore = { gte: parseFloat(minScore) };
    const [total, results] = await Promise.all([
      prisma.aIScreeningResult.count({ where }),
      prisma.aIScreeningResult.findMany({
        where,
        include: {
          candidate: { select: { firstName: true, lastName: true, email: true, status: true, skills: true } },
          jobDescription: { select: { title: true, mrf: { select: { mrfNumber: true } } } },
        },
        orderBy: { matchScore: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
    ]);
    res.json({ results, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screen a candidate against a JD (built-in TF-IDF style scorer in Node)
router.post('/screen', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { candidateId, jdId } = req.body;

    const [candidate, jd] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: candidateId } }),
      prisma.jobDescription.findUnique({ where: { id: jdId } }),
    ]);

    if (!candidate || !jd) return res.status(404).json({ error: 'Candidate or JD not found' });

    const candidateSkills = JSON.parse(candidate.skills || '[]').map(s => s.toLowerCase());
    const jdSkills = JSON.parse(jd.skills || '[]').map(s => s.toLowerCase());

    const matched = jdSkills.filter(s => candidateSkills.includes(s));
    const missing = jdSkills.filter(s => !candidateSkills.includes(s));
    const skillScore = jdSkills.length ? (matched.length / jdSkills.length) * 100 : 50;

    // Parse experience from JD (e.g. "2-5 years" → min 2)
    const expMatch = (jd.experience || '').match(/(\d+)/);
    const requiredExp = expMatch ? parseInt(expMatch[1]) : 0;
    const expGap = Math.max(0, requiredExp - candidate.experience);
    const expScore = expGap === 0 ? 100 : Math.max(0, 100 - expGap * 15);

    // Text similarity: count shared keywords between JD description and candidate profile
    const candidateText = [candidate.designation, candidate.currentCompany, ...candidateSkills].join(' ').toLowerCase();
    const jdWords = (jd.description + ' ' + jd.requirements).toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const uniqueJdWords = [...new Set(jdWords)];
    const keywordHits = uniqueJdWords.filter(w => candidateText.includes(w)).length;
    const textScore = uniqueJdWords.length ? Math.min(100, (keywordHits / uniqueJdWords.length) * 200) : 50;

    const matchScore = Math.round(skillScore * 0.5 + expScore * 0.3 + textScore * 0.2);

    let recommendation;
    if (matchScore >= 75) recommendation = 'STRONGLY_RECOMMENDED';
    else if (matchScore >= 55) recommendation = 'RECOMMENDED';
    else if (matchScore >= 35) recommendation = 'CONSIDER';
    else recommendation = 'NOT_RECOMMENDED';

    const summary = `Match score ${matchScore}%. Skills matched: ${matched.join(', ') || 'none'}. Missing: ${missing.join(', ') || 'none'}. Experience gap: ${expGap} year(s).`;

    const result = await prisma.aIScreeningResult.upsert({
      where: { candidateId },
      create: {
        candidateId, jdId, matchScore,
        skillsMatched: JSON.stringify(matched),
        skillsMissing: JSON.stringify(missing),
        experienceGap: expGap,
        recommendation, summary,
        modelVersion: 'built-in-v1',
      },
      update: {
        jdId, matchScore,
        skillsMatched: JSON.stringify(matched),
        skillsMissing: JSON.stringify(missing),
        experienceGap: expGap,
        recommendation, summary,
        processedAt: new Date(),
        modelVersion: 'built-in-v1',
      },
      include: {
        candidate: { select: { firstName: true, lastName: true } },
        jobDescription: { select: { title: true } },
      },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch screen all candidates for a JD
router.post('/screen/batch', authenticate, authorize(...HR_ROLES), async (req, res) => {
  try {
    const { jdId, mrfId } = req.body;
    const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });
    if (!jd) return res.status(404).json({ error: 'JD not found' });

    const candidates = await prisma.candidate.findMany({
      where: { mrfId: mrfId || jd.mrfId, deletedAt: null },
    });

    const jdSkills = JSON.parse(jd.skills || '[]').map(s => s.toLowerCase());
    const expMatch = (jd.experience || '').match(/(\d+)/);
    const requiredExp = expMatch ? parseInt(expMatch[1]) : 0;
    const jdWords = (jd.description + ' ' + jd.requirements).toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const uniqueJdWords = [...new Set(jdWords)];

    const results = await Promise.all(candidates.map(async (candidate) => {
      const candidateSkills = JSON.parse(candidate.skills || '[]').map(s => s.toLowerCase());
      const matched = jdSkills.filter(s => candidateSkills.includes(s));
      const missing = jdSkills.filter(s => !candidateSkills.includes(s));
      const skillScore = jdSkills.length ? (matched.length / jdSkills.length) * 100 : 50;
      const expGap = Math.max(0, requiredExp - candidate.experience);
      const expScore = expGap === 0 ? 100 : Math.max(0, 100 - expGap * 15);
      const candidateText = [candidate.designation, ...candidateSkills].join(' ').toLowerCase();
      const keywordHits = uniqueJdWords.filter(w => candidateText.includes(w)).length;
      const textScore = uniqueJdWords.length ? Math.min(100, (keywordHits / uniqueJdWords.length) * 200) : 50;
      const matchScore = Math.round(skillScore * 0.5 + expScore * 0.3 + textScore * 0.2);
      let recommendation;
      if (matchScore >= 75) recommendation = 'STRONGLY_RECOMMENDED';
      else if (matchScore >= 55) recommendation = 'RECOMMENDED';
      else if (matchScore >= 35) recommendation = 'CONSIDER';
      else recommendation = 'NOT_RECOMMENDED';
      const summary = `Score ${matchScore}%. Skills: ${matched.join(', ') || 'none'}. Missing: ${missing.join(', ') || 'none'}.`;

      return prisma.aIScreeningResult.upsert({
        where: { candidateId: candidate.id },
        create: { candidateId: candidate.id, jdId, matchScore, skillsMatched: JSON.stringify(matched), skillsMissing: JSON.stringify(missing), experienceGap: expGap, recommendation, summary, modelVersion: 'built-in-v1' },
        update: { jdId, matchScore, skillsMatched: JSON.stringify(matched), skillsMissing: JSON.stringify(missing), experienceGap: expGap, recommendation, summary, processedAt: new Date(), modelVersion: 'built-in-v1' },
      });
    }));

    res.json({ screened: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
