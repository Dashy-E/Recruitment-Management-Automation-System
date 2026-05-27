import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Departments
  const deptData = [
    { name: 'Human Resources', description: 'HR and Recruitment team' },
    { name: 'Information Technology', description: 'IT and Software Development' },
    { name: 'Sales & Marketing', description: 'Sales and Marketing team' },
    { name: 'Finance & Accounts', description: 'Finance, Accounts and Audit' },
    { name: 'Operations', description: 'Operations and Supply Chain' },
    { name: 'Customer Service', description: 'Customer Support and Success' },
    { name: 'Training & Development', description: 'Training and L&D team' },
  ];

  const departments = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d });
    departments[d.name] = dept;
    console.log(`  Department: ${d.name}`);
  }

  // Users (password: Admin@123)
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const users = [
    { email: 'admin@recruitment.com', firstName: 'System', lastName: 'Admin', role: 'ADMIN', departmentId: departments['Human Resources'].id },
    { email: 'hr@recruitment.com', firstName: 'Sarah', lastName: 'Johnson', role: 'HR', departmentId: departments['Human Resources'].id },
    { email: 'recruiter@recruitment.com', firstName: 'Mike', lastName: 'Davis', role: 'RECRUITER', departmentId: departments['Human Resources'].id },
    { email: 'interviewer@recruitment.com', firstName: 'Emily', lastName: 'Chen', role: 'INTERVIEWER', departmentId: departments['Information Technology'].id },
    { email: 'training@recruitment.com', firstName: 'James', lastName: 'Wilson', role: 'TRAINING', departmentId: departments['Training & Development'].id },
    { email: 'manager@recruitment.com', firstName: 'Robert', lastName: 'Brown', role: 'BRANCH_MANAGER', departmentId: departments['Operations'].id },
    { email: 'country@recruitment.com', firstName: 'Linda', lastName: 'Martinez', role: 'COUNTRY_MANAGER', departmentId: departments['Operations'].id },
    { email: 'md@recruitment.com', firstName: 'David', lastName: 'Thompson', role: 'MD', departmentId: departments['Operations'].id },
    { email: 'employee@recruitment.com', firstName: 'Alex', lastName: 'Kumar', role: 'EMPLOYEE', departmentId: departments['Information Technology'].id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hashedPassword },
    });
    console.log(`  User: ${u.email} (${u.role})`);
  }

  // Sample MRFs
  const hr = await prisma.user.findUnique({ where: { email: 'recruiter@recruitment.com' } });
  const itDept = departments['Information Technology'];

  const mrf1 = await prisma.mRF.upsert({
    where: { mrfNumber: 'MRF-0001' },
    update: {},
    create: {
      mrfNumber: 'MRF-0001',
      departmentId: itDept.id,
      designation: 'Senior Software Engineer',
      vacancies: 3,
      experience: '3-5 years',
      skills: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'TypeScript']),
      salaryMin: 800000,
      salaryMax: 1500000,
      location: 'Bangalore',
      country: 'India',
      reportingManager: 'Tech Lead',
      status: 'APPROVED',
      priority: 'HIGH',
      description: 'Looking for experienced full-stack developers',
      createdById: hr.id,
    },
  });

  const salesDept = departments['Sales & Marketing'];
  const mrf2 = await prisma.mRF.upsert({
    where: { mrfNumber: 'MRF-0002' },
    update: {},
    create: {
      mrfNumber: 'MRF-0002',
      departmentId: salesDept.id,
      designation: 'Sales Executive',
      vacancies: 5,
      experience: '1-3 years',
      skills: JSON.stringify(['Communication', 'CRM', 'B2B Sales', 'Lead Generation']),
      salaryMin: 300000,
      salaryMax: 600000,
      location: 'Mumbai',
      country: 'India',
      status: 'APPROVED',
      priority: 'NORMAL',
      createdById: hr.id,
    },
  });

  // Sample Candidates
  const candidatesData = [
    { candidateId: 'C0001', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@email.com', phone: '9876543210', designation: 'Software Engineer', experience: 36, skills: JSON.stringify(['React', 'Node.js', 'Python']), status: 'SHORTLISTED', mrfId: mrf1.id, source: 'LinkedIn' },
    { candidateId: 'C0002', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@email.com', phone: '9876543211', designation: 'Full Stack Developer', experience: 48, skills: JSON.stringify(['Angular', 'Java', 'MySQL']), status: 'INTERVIEW_SCHEDULED', mrfId: mrf1.id, source: 'Naukri' },
    { candidateId: 'C0003', firstName: 'Amit', lastName: 'Verma', email: 'amit.verma@email.com', phone: '9876543212', designation: 'Sales Executive', experience: 24, skills: JSON.stringify(['B2B Sales', 'CRM', 'Communication']), status: 'SELECTED', mrfId: mrf2.id, source: 'Referral' },
    { candidateId: 'C0004', firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.gupta@email.com', phone: '9876543213', designation: 'Sales Executive', experience: 12, skills: JSON.stringify(['Lead Generation', 'CRM']), status: 'TRAINING_IN_PROGRESS', mrfId: mrf2.id, source: 'LinkedIn' },
    { candidateId: 'C0005', firstName: 'Vijay', lastName: 'Kumar', email: 'vijay.kumar@email.com', phone: '9876543214', designation: 'Software Engineer', experience: 60, skills: JSON.stringify(['React', 'TypeScript', 'AWS']), status: 'EXAM_PENDING', mrfId: mrf1.id, source: 'Naukri' },
  ];

  for (const c of candidatesData) {
    await prisma.candidate.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, addedById: hr.id },
    });
    console.log(`  Candidate: ${c.firstName} ${c.lastName}`);
  }

  // Training batch
  const trainingUser = await prisma.user.findUnique({ where: { email: 'training@recruitment.com' } });
  const batch = await prisma.trainingBatch.upsert({
    where: { batchCode: 'BATCH-2024-001' },
    update: {},
    create: {
      batchName: 'Sales Induction Batch 1',
      batchCode: 'BATCH-2024-001',
      designation: 'Sales Executive',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-30'),
      maxCapacity: 20,
      trainer: 'John Smith',
      location: 'Mumbai Training Center',
      status: 'ONGOING',
      managedById: trainingUser.id,
    },
  });

  // Enroll C0004 in training
  const sneha = await prisma.candidate.findUnique({ where: { email: 'sneha.gupta@email.com' } });
  await prisma.trainingEnrollment.upsert({
    where: { candidateId: sneha.id },
    update: {},
    create: { candidateId: sneha.id, batchId: batch.id, status: 'ENROLLED' },
  });

  console.log('\nSeed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@recruitment.com / Admin@123');
  console.log('  HR:         hr@recruitment.com / Admin@123');
  console.log('  Recruiter:  recruiter@recruitment.com / Admin@123');
  console.log('  Interviewer: interviewer@recruitment.com / Admin@123');
  console.log('  Training:   training@recruitment.com / Admin@123');
  console.log('  Manager:    manager@recruitment.com / Admin@123');
  console.log('  MD:         md@recruitment.com / Admin@123');
  console.log('  Employee:   employee@recruitment.com / Admin@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
