import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const where = { deletedAt: null };
    if (role) where.role = role;
    if (search) where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, firstName: true, lastName: true, role: true, departmentId: true, isActive: true, lastLogin: true, createdAt: true, department: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/by-role/:role', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: req.params.role, isActive: true, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/interviewers', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['INTERVIEWER', 'RECRUITER', 'HR', 'ADMIN'] }, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch interviewers' });
  }
});

router.post('/', authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, departmentId } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, firstName, lastName, role, departmentId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create user' });
  }
});

router.put('/:id', authorize('ADMIN', 'HR'), async (req, res) => {
  try {
    const { email, firstName, lastName, role, departmentId, password } = req.body;
    const data = {};
    if (email) data.email = email.toLowerCase();
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (role) data.role = role;
    if (departmentId !== undefined) data.departmentId = departmentId || null;
    if (password) data.password = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    res.json(user);
  } catch (e) {
    console.error('Update user error:', e);
    res.status(500).json({ message: e.message || 'Failed to update user' });
  }
});

router.patch('/:id/toggle-status', authorize('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Failed to toggle user status' });
  }
});

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), isActive: false } });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
