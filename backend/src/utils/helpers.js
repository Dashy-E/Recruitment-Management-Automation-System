import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateMRFNumber = async () => {
  const count = await prisma.mRF.count();
  return `MRF-${String(count + 1).padStart(4, '0')}`;
};

export const generateCandidateId = async () => {
  const count = await prisma.candidate.count();
  return `C${String(count + 1).padStart(4, '0')}`;
};

export const generateOfferNumber = async () => {
  const count = await prisma.offerLetter.count();
  return `OFR-${String(count + 1).padStart(4, '0')}`;
};

export const generateAppointmentNumber = async () => {
  const count = await prisma.appointmentLetter.count();
  return `APT-${String(count + 1).padStart(4, '0')}`;
};

export const generateBatchCode = async () => {
  const count = await prisma.trainingBatch.count();
  const year = new Date().getFullYear();
  return `BATCH-${year}-${String(count + 1).padStart(3, '0')}`;
};

export const createAuditLog = async (userId, action, entity, entityId, oldValue, newValue) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, oldValue: JSON.stringify(oldValue), newValue: JSON.stringify(newValue) },
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

export const createNotification = async (userId, title, message, type = 'INFO', link = null) => {
  try {
    await prisma.notification.create({ data: { userId, title, message, type, link } });
  } catch (e) {
    console.error('Notification error:', e);
  }
};

export const paginate = (page = 1, limit = 10) => ({
  skip: (parseInt(page) - 1) * parseInt(limit),
  take: parseInt(limit),
});
