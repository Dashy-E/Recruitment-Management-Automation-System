import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(departments);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

router.post('/', async (req, res) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    res.status(201).json(dept);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create department' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    res.json(dept);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update department' });
  }
});

export default router;
