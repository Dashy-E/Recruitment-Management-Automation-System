import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(n);
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

router.put('/mark-all-read', async (req, res) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark all read' });
  }
});

export default router;
