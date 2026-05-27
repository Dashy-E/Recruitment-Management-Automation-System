-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "AgencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyContact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgencySubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "mrfId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "fee" REAL,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgencySubmission_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgencySubmission_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgencySubmission_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgencyPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgencyPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgencyPartner_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "region" TEXT,
    "zone" TEXT,
    "pincode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgencyLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AgencyLocation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgencyLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "platform" TEXT,
    "url" TEXT,
    "postedAt" DATETIME,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" TEXT,
    CONSTRAINT "CandidateSource_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrfId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "experience" TEXT,
    "processedAt" DATETIME,
    "vectorData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobDescription_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "jdId" TEXT NOT NULL,
    "matchScore" REAL NOT NULL,
    "skillsMatched" TEXT NOT NULL DEFAULT '[]',
    "skillsMissing" TEXT NOT NULL DEFAULT '[]',
    "experienceGap" INTEGER,
    "recommendation" TEXT,
    "summary" TEXT,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelVersion" TEXT,
    CONSTRAINT "AIScreeningResult_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AIScreeningResult_jdId_fkey" FOREIGN KEY ("jdId") REFERENCES "JobDescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT,
    "templateId" TEXT,
    "sentById" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureReason" TEXT,
    "metadata" TEXT,
    CONSTRAINT "Communication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Communication_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Communication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mrfId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PipelineStage_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "enteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "PipelineEntry_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PipelineEntry_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncomingMail" (
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
    "processedById" TEXT,
    "processedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "IncomingMail_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CasualWorker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "workerType" TEXT NOT NULL DEFAULT 'CASUAL',
    "contractStart" DATETIME NOT NULL,
    "contractEnd" DATETIME,
    "dailyRate" REAL,
    "monthlyRate" REAL,
    "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
    "panVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankAccount" TEXT,
    "ifscCode" TEXT,
    "department" TEXT,
    "reportingTo" TEXT,
    "siteLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "addedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CasualWorker_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CasualWorker_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "aadhaarNumber" TEXT,
    "panNumber" TEXT,
    "isContractual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Candidate_mrfId_fkey" FOREIGN KEY ("mrfId") REFERENCES "MRF" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Candidate_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Candidate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Candidate" ("addedById", "address", "alternatePhone", "candidateId", "certifications", "city", "country", "createdAt", "currentCompany", "currentSalary", "dateOfBirth", "deletedAt", "designation", "education", "email", "expectedSalary", "experience", "firstName", "gender", "id", "lastName", "mrfId", "noticePeriod", "phone", "resumePath", "skills", "source", "status", "updatedAt") SELECT "addedById", "address", "alternatePhone", "candidateId", "certifications", "city", "country", "createdAt", "currentCompany", "currentSalary", "dateOfBirth", "deletedAt", "designation", "education", "email", "expectedSalary", "experience", "firstName", "gender", "id", "lastName", "mrfId", "noticePeriod", "phone", "resumePath", "skills", "source", "status", "updatedAt" FROM "Candidate";
DROP TABLE "Candidate";
ALTER TABLE "new_Candidate" RENAME TO "Candidate";
CREATE UNIQUE INDEX "Candidate_candidateId_key" ON "Candidate"("candidateId");
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Agency_agencyCode_key" ON "Agency"("agencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPartner_userId_key" ON "AgencyPartner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_city_state_country_key" ON "Location"("city", "state", "country");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyLocation_agencyId_locationId_key" ON "AgencyLocation"("agencyId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_mrfId_key" ON "JobDescription"("mrfId");

-- CreateIndex
CREATE UNIQUE INDEX "AIScreeningResult_candidateId_key" ON "AIScreeningResult"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_mrfId_order_key" ON "PipelineStage"("mrfId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "IncomingMail_messageId_key" ON "IncomingMail"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "CasualWorker_candidateId_key" ON "CasualWorker"("candidateId");
