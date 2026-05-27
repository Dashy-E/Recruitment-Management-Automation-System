import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// List all locations
router.get('/locations', authenticate, async (req, res) => {
  try {
    const { state, country = 'India', search } = req.query;
    const where = { isActive: true };
    if (state) where.state = state;
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { city: { contains: search } },
        { state: { contains: search } },
        { pincode: { contains: search } },
      ];
    }
    const locations = await prisma.location.findMany({
      where,
      orderBy: [{ state: 'asc' }, { city: 'asc' }],
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create location
router.post('/locations', authenticate, async (req, res) => {
  try {
    const location = await prisma.location.create({ data: req.body });
    res.status(201).json(location);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Location already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Get location intelligence: candidate count + agency coverage per location
router.get('/intelligence', authenticate, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        candidates: { select: { id: true, status: true } },
        agencies: {
          include: { agency: { select: { id: true, name: true, status: true } } },
        },
      },
    });

    const data = locations.map((loc) => ({
      id: loc.id,
      city: loc.city,
      state: loc.state,
      region: loc.region,
      zone: loc.zone,
      candidateCount: loc.candidates.length,
      activeCount: loc.candidates.filter(c => !['REJECTED', 'CONFIRMED'].includes(c.status)).length,
      agencyCount: loc.agencies.length,
      activeAgencies: loc.agencies.filter(a => a.agency.status === 'ACTIVE').map(a => a.agency),
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get agencies by location
router.get('/locations/:id/agencies', authenticate, async (req, res) => {
  try {
    const agencyLocations = await prisma.agencyLocation.findMany({
      where: { locationId: req.params.id },
      include: {
        agency: {
          include: { contacts: true },
          where: { deletedAt: null },
        },
      },
    });
    res.json(agencyLocations.map(al => ({ ...al.agency, isPrimary: al.isPrimary })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign agency to location
router.post('/locations/:id/agencies', authenticate, async (req, res) => {
  try {
    const { agencyId, isPrimary = false } = req.body;
    const entry = await prisma.agencyLocation.upsert({
      where: { agencyId_locationId: { agencyId, locationId: req.params.id } },
      create: { agencyId, locationId: req.params.id, isPrimary },
      update: { isPrimary },
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Distinct states list (for filter dropdowns)
router.get('/states', authenticate, async (req, res) => {
  try {
    const states = await prisma.location.groupBy({
      by: ['state', 'country'],
      where: { isActive: true },
      orderBy: { state: 'asc' },
    });
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
