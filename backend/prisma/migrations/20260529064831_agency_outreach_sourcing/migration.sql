-- CreateTable
CREATE TABLE "MrfOutreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrfId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MrfOutreach_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MrfOutreach_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MrfOutreach_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrfId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "postUrl" TEXT,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "postedById" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "JobPosting_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobPosting_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agencyType" TEXT NOT NULL DEFAULT 'HIRING',
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "specializations" TEXT NOT NULL DEFAULT '[]',
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rating" REAL,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "successfulHires" INTEGER NOT NULL DEFAULT 0,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);
INSERT INTO "new_Agency" ("address", "agencyCode", "city", "contactPerson", "contractEnd", "contractStart", "country", "createdAt", "deletedAt", "email", "id", "name", "notes", "phone", "rating", "specializations", "state", "status", "successfulHires", "tier", "totalSubmissions", "updatedAt") SELECT "address", "agencyCode", "city", "contactPerson", "contractEnd", "contractStart", "country", "createdAt", "deletedAt", "email", "id", "name", "notes", "phone", "rating", "specializations", "state", "status", "successfulHires", "tier", "totalSubmissions", "updatedAt" FROM "Agency";
DROP TABLE "Agency";
ALTER TABLE "new_Agency" RENAME TO "Agency";
CREATE UNIQUE INDEX "Agency_agencyCode_key" ON "Agency"("agencyCode");
CREATE TABLE "new_Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "designation" TEXT NOT NULL,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "currentSalary" REAL,
    "expectedSalary" REAL,
    "noticePeriod" INTEGER,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT NOT NULL DEFAULT '[]',
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "currentCompany" TEXT,
    "resumePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "source" TEXT,
    "sourceDetail" TEXT,
    "mrfId" TEXT,
    "locationId" TEXT,
    "addedById" TEXT NOT NULL,
    "sourcedAgencyId" TEXT,
    "isExpressTrack" BOOLEAN NOT NULL DEFAULT false,
    "aadhaarNumber" TEXT,
    "panNumber" TEXT,
    "isContractual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Candidate_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Candidate_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Candidate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Candidate_sourcedAgencyId_fkey" FOREIGN KEY ("sourcedAgencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("aadhaarNumber", "addedById", "address", "alternatePhone", "candidateId", "certifications", "city", "country", "createdAt", "currentCompany", "currentSalary", "dateOfBirth", "deletedAt", "designation", "education", "email", "expectedSalary", "experience", "firstName", "gender", "id", "isContractual", "lastName", "locationId", "mrfId", "noticePeriod", "panNumber", "phone", "pincode", "resumePath", "skills", "source", "sourceDetail", "state", "status", "updatedAt") SELECT "aadhaarNumber", "addedById", "address", "alternatePhone", "candidateId", "certifications", "city", "country", "createdAt", "currentCompany", "currentSalary", "dateOfBirth", "deletedAt", "designation", "education", "email", "expectedSalary", "experience", "firstName", "gender", "id", "isContractual", "lastName", "locationId", "mrfId", "noticePeriod", "panNumber", "phone", "pincode", "resumePath", "skills", "source", "sourceDetail", "state", "status", "updatedAt" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
CREATE UNIQUE INDEX "Candidate_candidateId_key" ON "Candidate"("candidateId");
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");
CREATE TABLE "new_IncomingMail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'UNPROCESSED',
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "candidateId" TEXT,
    "agencyId" TEXT,
    "mrfId" TEXT,
    "outreachId" TEXT,
    "processedById" TEXT,
    "processedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "IncomingMail_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IncomingMail_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IncomingMail_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IncomingMail_outreachId_fkey" FOREIGN KEY ("outreachId") REFERENCES "MrfOutreach" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IncomingMail" ("attachments", "body", "candidateId", "fromEmail", "fromName", "hasAttachment", "id", "messageId", "notes", "processedAt", "processedById", "receivedAt", "status", "subject") SELECT "attachments", "body", "candidateId", "fromEmail", "fromName", "hasAttachment", "id", "messageId", "notes", "processedAt", "processedById", "receivedAt", "status", "subject" FROM "IncomingMail";
DROP TABLE "IncomingMail";
ALTER TABLE "new_IncomingMail" RENAME TO "IncomingMail";
CREATE UNIQUE INDEX "IncomingMail_messageId_key" ON "IncomingMail"("messageId");
CREATE TABLE "new_MRF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrfNumber" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "vacancies" INTEGER NOT NULL,
    "experience" TEXT NOT NULL,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "salaryMin" REAL,
    "salaryMax" REAL,
    "location" TEXT,
    "branch" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "reportingManager" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "workerType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "MRF_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MRF_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MRF_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MRF" ("approvedAt", "approvedById", "branch", "closedAt", "country", "createdAt", "createdById", "deletedAt", "departmentId", "description", "designation", "experience", "id", "location", "mrfNumber", "priority", "rejectionReason", "reportingManager", "salaryMax", "salaryMin", "skills", "status", "updatedAt", "vacancies") SELECT "approvedAt", "approvedById", "branch", "closedAt", "country", "createdAt", "createdById", "deletedAt", "departmentId", "description", "designation", "experience", "id", "location", "mrfNumber", "priority", "rejectionReason", "reportingManager", "salaryMax", "salaryMin", "skills", "status", "updatedAt", "vacancies" FROM "MRF";
DROP TABLE "MRF";
ALTER TABLE "new_MRF" RENAME TO "MRF";
CREATE UNIQUE INDEX "MRF_mrfNumber_key" ON "MRF"("mrfNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
