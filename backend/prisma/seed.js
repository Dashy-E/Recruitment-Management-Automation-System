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
    { email: 'agency@recruitment.com', firstName: 'Ravi', lastName: 'Mehta', role: 'AGENCY_PARTNER', departmentId: departments['Human Resources'].id },
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

  // ─── Locations ──────────────────────────────────────────────────────────────
  console.log('\n  Seeding locations...');
  const locationData = [
    { city: 'Mumbai', state: 'Maharashtra', region: 'West', zone: 'Zone-W1', pincode: '400001' },
    { city: 'Pune', state: 'Maharashtra', region: 'West', zone: 'Zone-W1', pincode: '411001' },
    { city: 'Bangalore', state: 'Karnataka', region: 'South', zone: 'Zone-S1', pincode: '560001' },
    { city: 'Hyderabad', state: 'Telangana', region: 'South', zone: 'Zone-S2', pincode: '500001' },
    { city: 'Chennai', state: 'Tamil Nadu', region: 'South', zone: 'Zone-S3', pincode: '600001' },
    { city: 'Delhi', state: 'Delhi', region: 'North', zone: 'Zone-N1', pincode: '110001' },
    { city: 'Noida', state: 'Uttar Pradesh', region: 'North', zone: 'Zone-N2', pincode: '201301' },
    { city: 'Gurgaon', state: 'Haryana', region: 'North', zone: 'Zone-N2', pincode: '122001' },
    { city: 'Kolkata', state: 'West Bengal', region: 'East', zone: 'Zone-E1', pincode: '700001' },
    { city: 'Ahmedabad', state: 'Gujarat', region: 'West', zone: 'Zone-W2', pincode: '380001' },
  ];

  const locations = {};
  for (const l of locationData) {
    const loc = await prisma.location.upsert({
      where: { city_state_country: { city: l.city, state: l.state, country: 'India' } },
      update: {},
      create: { ...l, country: 'India' },
    });
    locations[l.city] = loc;
  }
  console.log(`  Locations: ${locationData.length} cities`);

  // ─── Agencies ────────────────────────────────────────────────────────────────
  console.log('  Seeding agencies...');
  const agencyUser = await prisma.user.findUnique({ where: { email: 'agency@recruitment.com' } });

  const agenciesData = [
    {
      agencyCode: 'AGY-TLN-00001',
      name: 'TalentLink Staffing',
      contactPerson: 'Ravi Mehta',
      email: 'ravi@talentlink.in',
      phone: '9900112233',
      city: 'Mumbai', state: 'Maharashtra', country: 'India',
      specializations: JSON.stringify(['IT', 'Software', 'Fintech']),
      tier: 'PREMIUM',
      rating: 4.5,
      totalSubmissions: 45,
      successfulHires: 18,
    },
    {
      agencyCode: 'AGY-PRO-00002',
      name: 'ProHire Solutions',
      contactPerson: 'Anita Sharma',
      email: 'anita@prohire.in',
      phone: '9900223344',
      city: 'Bangalore', state: 'Karnataka', country: 'India',
      specializations: JSON.stringify(['Sales', 'Marketing', 'BFSI']),
      tier: 'STANDARD',
      rating: 3.8,
      totalSubmissions: 28,
      successfulHires: 9,
    },
    {
      agencyCode: 'AGY-ELT-00003',
      name: 'EliteStaff India',
      contactPerson: 'Suresh Nair',
      email: 'suresh@elitestaff.in',
      phone: '9900334455',
      city: 'Delhi', state: 'Delhi', country: 'India',
      specializations: JSON.stringify(['Operations', 'Logistics', 'Manufacturing']),
      tier: 'STANDARD',
      rating: 4.1,
      totalSubmissions: 34,
      successfulHires: 14,
    },
    {
      agencyCode: 'AGY-FRC-00004',
      name: 'FirstChoice Recruitment',
      contactPerson: 'Meera Iyer',
      email: 'meera@firstchoice.co.in',
      phone: '9900445566',
      city: 'Hyderabad', state: 'Telangana', country: 'India',
      specializations: JSON.stringify(['IT', 'Healthcare', 'Pharma']),
      tier: 'BASIC',
      rating: 3.5,
      totalSubmissions: 15,
      successfulHires: 4,
    },
  ];

  const agencies = {};
  for (const a of agenciesData) {
    const agency = await prisma.agency.upsert({
      where: { agencyCode: a.agencyCode },
      update: {},
      create: a,
    });
    agencies[a.name] = agency;
  }
  console.log(`  Agencies: ${agenciesData.length}`);

  // Add contacts for first agency
  await prisma.agencyContact.upsert({
    where: { id: 'seed-contact-1' },
    update: {},
    create: {
      id: 'seed-contact-1',
      agencyId: agencies['TalentLink Staffing'].id,
      name: 'Ravi Mehta',
      designation: 'CEO',
      email: 'ravi@talentlink.in',
      phone: '9900112233',
      isPrimary: true,
    },
  });

  // Link agency partner user to agency
  const existingPartner = await prisma.agencyPartner.findUnique({ where: { userId: agencyUser.id } });
  if (!existingPartner) {
    await prisma.agencyPartner.create({
      data: { userId: agencyUser.id, agencyId: agencies['TalentLink Staffing'].id },
    });
  }

  // Assign agencies to locations
  const agencyLocationPairs = [
    { agencyName: 'TalentLink Staffing', city: 'Mumbai', isPrimary: true },
    { agencyName: 'TalentLink Staffing', city: 'Pune', isPrimary: false },
    { agencyName: 'ProHire Solutions', city: 'Bangalore', isPrimary: true },
    { agencyName: 'ProHire Solutions', city: 'Chennai', isPrimary: false },
    { agencyName: 'EliteStaff India', city: 'Delhi', isPrimary: true },
    { agencyName: 'EliteStaff India', city: 'Noida', isPrimary: false },
    { agencyName: 'FirstChoice Recruitment', city: 'Hyderabad', isPrimary: true },
  ];

  for (const pair of agencyLocationPairs) {
    if (agencies[pair.agencyName] && locations[pair.city]) {
      await prisma.agencyLocation.upsert({
        where: { agencyId_locationId: { agencyId: agencies[pair.agencyName].id, locationId: locations[pair.city].id } },
        update: {},
        create: { agencyId: agencies[pair.agencyName].id, locationId: locations[pair.city].id, isPrimary: pair.isPrimary },
      });
    }
  }

  // ─── Email Templates ─────────────────────────────────────────────────────────
  console.log('  Seeding email templates...');
  const templates = [
    {
      name: 'Interview Invitation',
      subject: 'Interview Invitation – {{designation}} at {{company}}',
      body: `Dear {{candidateName}},\n\nWe are pleased to invite you for an interview for the position of {{designation}}.\n\nDate: {{interviewDate}}\nTime: {{interviewTime}}\nMode: {{mode}}\nLocation/Link: {{location}}\n\nKindly confirm your availability by replying to this email.\n\nBest regards,\n{{recruiterName}}\nHR Team`,
      category: 'INTERVIEW',
      variables: JSON.stringify(['candidateName', 'designation', 'company', 'interviewDate', 'interviewTime', 'mode', 'location', 'recruiterName']),
    },
    {
      name: 'Offer Letter Communication',
      subject: 'Offer of Employment – {{designation}}',
      body: `Dear {{candidateName}},\n\nWe are delighted to extend an offer of employment for the role of {{designation}} at {{company}}.\n\nYour CTC will be ₹{{ctc}} per annum.\nExpected Joining Date: {{joiningDate}}\n\nPlease find the detailed offer letter attached. Kindly sign and return it by {{expiryDate}}.\n\nWarm regards,\n{{recruiterName}}\nHR Department`,
      category: 'OFFER',
      variables: JSON.stringify(['candidateName', 'designation', 'company', 'ctc', 'joiningDate', 'expiryDate', 'recruiterName']),
    },
    {
      name: 'Training Schedule Notification',
      subject: 'Training Schedule – {{batchName}}',
      body: `Dear {{candidateName}},\n\nYou have been enrolled in the training batch: {{batchName}}.\n\nTraining Dates: {{startDate}} to {{endDate}}\nLocation: {{location}}\nTrainer: {{trainerName}}\n\nPlease ensure timely attendance. Contact us for any queries.\n\nRegards,\n{{trainerName}}\nTraining Department`,
      category: 'TRAINING',
      variables: JSON.stringify(['candidateName', 'batchName', 'startDate', 'endDate', 'location', 'trainerName']),
    },
    {
      name: 'Exam Link',
      subject: 'Online Examination Link – {{examName}}',
      body: `Dear {{candidateName}},\n\nYour examination link for {{examName}} is ready.\n\nExam Link: {{examLink}}\nLink valid until: {{expiryDate}}\nPassing Score: {{passingScore}}%\n\nPlease complete the exam before the expiry date. This link can only be used once.\n\nBest of luck!\n{{recruiterName}}\nHR Team`,
      category: 'EXAM',
      variables: JSON.stringify(['candidateName', 'examName', 'examLink', 'expiryDate', 'passingScore', 'recruiterName']),
    },
    {
      name: 'Candidate Rejection',
      subject: 'Application Status – {{designation}}',
      body: `Dear {{candidateName}},\n\nThank you for your interest in the {{designation}} role at {{company}}.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate the time you invested in our recruitment process and encourage you to apply for future openings.\n\nBest wishes,\n{{recruiterName}}\nHR Team`,
      category: 'REJECTION',
      variables: JSON.stringify(['candidateName', 'designation', 'company', 'recruiterName']),
    },
    {
      name: 'Agency Submission Acknowledgement',
      subject: 'Candidate Submission Received – {{candidateName}}',
      body: `Dear {{agencyContact}},\n\nThank you for submitting the profile of {{candidateName}} for the position of {{designation}} ({{mrfNumber}}).\n\nWe will review the profile and update you within 3-5 business days.\n\nRegards,\n{{recruiterName}}\nRecruitment Team`,
      category: 'AGENCY',
      variables: JSON.stringify(['agencyContact', 'candidateName', 'designation', 'mrfNumber', 'recruiterName']),
    },
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }
  console.log(`  Email templates: ${templates.length}`);

  // ─── Job Descriptions ────────────────────────────────────────────────────────
  console.log('  Seeding job descriptions...');
  await prisma.jobDescription.upsert({
    where: { mrfId: mrf1.id },
    update: {},
    create: {
      mrfId: mrf1.id,
      title: 'Senior Software Engineer',
      description: 'We are seeking an experienced full-stack developer to join our technology team. The role involves designing, developing, and maintaining scalable web applications. You will work closely with product managers, designers, and other engineers to deliver high-quality software solutions.',
      requirements: 'Proficiency in React and Node.js. Strong understanding of relational databases, particularly PostgreSQL. Experience with TypeScript. Knowledge of RESTful API design. Familiarity with cloud platforms (AWS/Azure). Good communication and team collaboration skills.',
      skills: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST API', 'AWS']),
      experience: '3-5 years',
    },
  });

  await prisma.jobDescription.upsert({
    where: { mrfId: mrf2.id },
    update: {},
    create: {
      mrfId: mrf2.id,
      title: 'Sales Executive',
      description: 'We are looking for dynamic and motivated Sales Executives to drive revenue growth. The role involves identifying prospects, pitching products, and building lasting client relationships. You will be responsible for achieving monthly sales targets.',
      requirements: 'Excellent communication and presentation skills. Experience in B2B sales. Proficiency with CRM tools. Ability to generate and qualify leads. Self-motivated with a results-oriented mindset. Prior experience in FMCG or services sector preferred.',
      skills: JSON.stringify(['Communication', 'B2B Sales', 'CRM', 'Lead Generation', 'Negotiation']),
      experience: '1-3 years',
    },
  });

  // ─── Pipeline Stages ─────────────────────────────────────────────────────────
  console.log('  Seeding pipeline stages...');
  const defaultStages = [
    { name: 'Applied', order: 1, color: '#6366f1', isDefault: true },
    { name: 'Screening', order: 2, color: '#f59e0b', isDefault: true },
    { name: 'Interview', order: 3, color: '#3b82f6', isDefault: true },
    { name: 'Offer', order: 4, color: '#10b981', isDefault: true },
    { name: 'Hired', order: 5, color: '#22c55e', isDefault: true },
    { name: 'Rejected', order: 6, color: '#ef4444', isDefault: true },
  ];

  for (const mrfId of [mrf1.id, mrf2.id]) {
    for (const s of defaultStages) {
      await prisma.pipelineStage.upsert({
        where: { mrfId_order: { mrfId, order: s.order } },
        update: {},
        create: { ...s, mrfId },
      });
    }
  }
  console.log('  Pipeline stages: 6 stages × 2 MRFs');

  // ─── Incoming Mails (sample) ──────────────────────────────────────────────────
  console.log('  Seeding incoming mails...');
  const sampleMails = [
    {
      fromEmail: 'karan.singh@gmail.com',
      fromName: 'Karan Singh',
      subject: 'Application for Software Engineer Position',
      body: 'Dear HR Team,\n\nI am writing to express my interest in the Software Engineer role. I have 4 years of experience in React and Node.js.\n\nName: Karan Singh\nPhone: 9812345670\nEmail: karan.singh@gmail.com\n\nPlease find my resume attached.\n\nRegards,\nKaran Singh',
      hasAttachment: true,
      attachments: JSON.stringify([{ name: 'Karan_Singh_Resume.pdf', size: 245000 }]),
    },
    {
      fromEmail: 'divya.menon@yahoo.com',
      fromName: 'Divya Menon',
      subject: 'Sales Executive Application',
      body: 'Hi,\n\nI saw your opening for Sales Executive on LinkedIn. I have 2 years of B2B sales experience.\n\nName: Divya Menon\nPhone: 9823456780\n\nLooking forward to hearing from you.\n\nThanks,\nDivya',
      hasAttachment: false,
      attachments: JSON.stringify([]),
    },
  ];

  for (const m of sampleMails) {
    const existing = await prisma.incomingMail.findFirst({ where: { fromEmail: m.fromEmail } });
    if (!existing) {
      await prisma.incomingMail.create({ data: m });
    }
  }
  console.log(`  Incoming mails: ${sampleMails.length}`);

  console.log('\nSeed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin:          admin@recruitment.com / Admin@123');
  console.log('  HR:             hr@recruitment.com / Admin@123');
  console.log('  Recruiter:      recruiter@recruitment.com / Admin@123');
  console.log('  Interviewer:    interviewer@recruitment.com / Admin@123');
  console.log('  Training:       training@recruitment.com / Admin@123');
  console.log('  Manager:        manager@recruitment.com / Admin@123');
  console.log('  Country Mgr:    country@recruitment.com / Admin@123');
  console.log('  MD:             md@recruitment.com / Admin@123');
  console.log('  Employee:       employee@recruitment.com / Admin@123');
  console.log('  Agency Partner: agency@recruitment.com / Admin@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
