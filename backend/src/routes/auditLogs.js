import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate, authorize('ADMIN'));

router.get('/', async (req, res) => {
  try {
    const { entity, action, userId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action };
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

router.get('/entities', async (req, res) => {
  try {
    const entities = await prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
    });
    res.json(entities.map(e => e.entity));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch entities' });
  }
});

export default router;
