# RecruitPro ERP — Complete Test Plan

**Project:** RecruitPro ERP  
**Date:** 2026-06-01  
**Scope:** All 9 portals, all 18 modules, end-to-end recruitment lifecycle  
**Environment:** localhost — Frontend: http://localhost:5173 | Backend: http://localhost:5000

---

## Test Accounts

| Role | Email | Password | Portal |
|---|---|---|---|
| Admin | admin@recruitment.com | Admin@123 | /admin |
| MD | md@recruitment.com | Admin@123 | /management |
| HR / Recruiter | recruiter@recruitment.com | Admin@123 | /recruiter |
| Training | training@recruitment.com | Admin@123 | /training |
| Employee | employee@recruitment.com | Admin@123 | /employee |

---

## How to Read This Document

Each test case has:
- **ID** — unique reference (e.g., `AUTH-01`)
- **Precondition** — what must be true before running the test
- **Steps** — numbered, exact UI actions
- **Expected Result** — what the UI/DB should show
- **Pass / Fail** — fill in during testing

---

## Section 1 — Authentication (AUTH)

### AUTH-01: Valid Login
**Precondition:** App is running on port 5173.  
**Steps:**
1. Open http://localhost:5173
2. Enter email: `recruiter@recruitment.com`, password: `Admin@123`
3. Click **Sign In**

**Expected:** Redirected to `/recruiter/dashboard`. User name shows in sidebar. No error toast.

---

### AUTH-02: Wrong Password
**Steps:**
1. Enter email: `recruiter@recruitment.com`, password: `wrongpass`
2. Click **Sign In**

**Expected:** Error toast "Invalid credentials" or similar. User stays on login page.

---

### AUTH-03: Empty Fields
**Steps:**
1. Leave email and password blank
2. Click **Sign In**

**Expected:** Validation error or no submission. Not redirected.

---

### AUTH-04: Role-Based Redirect
**Steps:**
1. Login as MD (`md@recruitment.com`)
2. Observe redirect URL

**Expected:** Redirected to `/management/dashboard`, not `/recruiter`.

---

### AUTH-05: Session Persistence
**Steps:**
1. Login as recruiter
2. Refresh the browser (F5)

**Expected:** Still logged in. Dashboard loads. No redirect to login.

---

### AUTH-06: Logout
**Steps:**
1. Login as any user
2. Click the logout button in sidebar

**Expected:** Redirected to login page. Token cleared from localStorage (check DevTools → Application → localStorage).

---

### AUTH-07: Unauthorized Route Access
**Steps:**
1. Login as recruiter
2. Manually navigate to http://localhost:5173/admin/users

**Expected:** Redirected away or shows "Not authorized" / 403. Recruiter cannot access admin pages.

---

## Section 2 — MRF (Manpower Requisition Form) (MRF)

### MRF-01: Create MRF — All Fields Valid
**Precondition:** Logged in as recruiter. At least one department exists.  
**Steps:**
1. Go to **Recruiter → MRF**
2. Click **New MRF**
3. Fill: Department (select any), Designation: `Software Engineer`, Vacancies: `2`, Experience: `3`, Salary Min: `30000`, Salary Max: `60000`, Reporting Manager: `John Smith`, Description: `Looking for skilled engineers`
4. Add a skill: `Python` → click Add
5. Click **Submit MRF**

**Expected:** MRF created. Appears in MRF list with status `DRAFT`. Auto-generated MRF number (e.g., `MRF-2026-001`).

---

### MRF-02: Validation — Empty Required Fields
**Steps:**
1. Open New MRF form
2. Click Submit without filling anything

**Expected:** Red border on Department, Designation, Vacancies fields. Error messages below each empty required field. Form does not submit.

---

### MRF-03: Validation — Designation Too Short
**Steps:**
1. Fill Designation: `A` (1 character)
2. Tab out / blur the field

**Expected:** Error: "Designation must be at least 2 characters."

---

### MRF-04: Validation — Vacancies Out of Range
**Steps:**
1. Fill Vacancies: `0` (zero)
2. Tab out

**Expected:** Error: "Vacancies must be between 1 and 999."

**Steps (second check):**
1. Fill Vacancies: `1000`

**Expected:** Error: "Vacancies must be between 1 and 999."

---

### MRF-05: Validation — Salary Min > Max
**Steps:**
1. Fill Salary Min: `80000`, Salary Max: `40000`
2. Tab out of Max field

**Expected:** Error indicating Max must be greater than Min.

---

### MRF-06: Validation — Invalid Skill Characters
**Steps:**
1. In Skills field, type `Python!!!###` and click Add

**Expected:** Error or skill rejected — only alphanumeric + spaces + hyphens allowed.

---

### MRF-07: Submit MRF for Approval (Recruiter)
**Precondition:** MRF exists in DRAFT status.  
**Steps:**
1. Open the MRF detail
2. Click **Submit for Approval**

**Expected:** MRF status changes to `PENDING`. Visible in Management → Approvals.

---

### MRF-08: MD Approves MRF
**Precondition:** MRF in PENDING status.  
**Steps:**
1. Login as MD (`md@recruitment.com`)
2. Go to **Management → Approvals**
3. Find the pending MRF
4. Click **Approve**

**Expected:** MRF status changes to `APPROVED`. Recruiter can now add candidates against this MRF.

---

### MRF-09: Non-MD Cannot Approve MRF
**Precondition:** MRF in PENDING status.  
**Steps:**
1. Login as recruiter
2. Navigate to Management → Approvals (or attempt via API: POST /api/mrf/:id/approve)

**Expected:** UI hides the Approve button for non-MD roles. API returns 403 Forbidden.

---

### MRF-10: MD Rejects MRF
**Precondition:** MRF in PENDING status.  
**Steps:**
1. Login as MD
2. Management → Approvals → find MRF → click **Reject**
3. Enter rejection reason: `Headcount freeze in Q3`

**Expected:** MRF status changes to `REJECTED`. Rejection reason saved and visible in MRF detail.

---

## Section 3 — Candidate Management (CAND)

### CAND-01: Add New Candidate — All Fields Valid
**Precondition:** Logged in as recruiter.  
**Steps:**
1. Go to **Recruiter → Candidates → Add Candidate**
2. Fill all required fields: First Name, Last Name, Email, Phone, Designation, Department, Source
3. Fill optional fields: Experience, Skills, Location
4. Click **Save**

**Expected:** Candidate appears in list with status `APPLIED`. No duplicate created.

---

### CAND-02: Validation — Duplicate Email
**Steps:**
1. Add a candidate with email `test@example.com`
2. Try to add another candidate with the same email

**Expected:** Error "Email already exists" or similar. Second candidate NOT created.

---

### CAND-03: Validation — Invalid Email Format
**Steps:**
1. In email field, enter `notanemail`
2. Tab out

**Expected:** Red border + error "Invalid email format."

---

### CAND-04: Validation — Phone Number
**Steps:**
1. Enter phone: `abc123` (non-numeric)
2. Tab out

**Expected:** Validation error on phone field.

---

### CAND-05: Search Candidates
**Steps:**
1. Go to Candidate List
2. Type `Priya` in the search box

**Expected:** List filters to show candidates whose name matches "Priya". Non-matching candidates hidden.

---

### CAND-06: Filter by Status
**Steps:**
1. Use the status filter dropdown → select `SHORTLISTED`

**Expected:** Only candidates with status SHORTLISTED shown.

---

### CAND-07: Update Candidate Status Manually
**Steps:**
1. Open any candidate's detail page
2. Change status dropdown to `SHORTLISTED`
3. Click **Update Status**

**Expected:** Candidate status updates. Status badge on the card changes. Journey bar advances.

---

### CAND-08: Candidate Journey Bar
**Precondition:** Candidate exists with a known status (e.g., INTERVIEW_SCHEDULED).  
**Steps:**
1. Open that candidate's detail page
2. Observe the journey bar at the top

**Expected:** Steps up to and including "Interview" are highlighted. Future steps (Training, Exam, Offer, Onboarded) are gray.

---

### CAND-09: AI Screening
**Steps:**
1. Go to **Recruiter → AI Screening**
2. Select an MRF with skills defined
3. Run screening

**Expected:** Candidates ranked by match score (0–100). Top matches listed first. TF-IDF keyword scoring visible.

---

## Section 4 — Interview Management (INT)

### INT-01: Schedule Interview
**Precondition:** At least one SHORTLISTED candidate exists.  
**Steps:**
1. Go to **Recruiter → Interviews**
2. Click **Schedule Interview**
3. Select candidate: any SHORTLISTED candidate
4. Set date/time: tomorrow at 10:00 AM
5. Interview Type: `TECHNICAL`, Mode: `ONLINE`, Meeting Link: `https://meet.google.com/abc-def-ghi`
6. Round: 1, Duration: 60 minutes
7. Click **Schedule**

**Expected:** Interview created. Candidate status changes to `INTERVIEW_SCHEDULED`. Interview card appears in the list. Confirmation email logged (check backend console).

---

### INT-02: Validation — Past Date
**Steps:**
1. Schedule Interview form → set date to yesterday

**Expected:** Error "Interview must be scheduled in the future." Form does not submit.

---

### INT-03: Validation — ONLINE Mode Without Link
**Steps:**
1. Select Mode: `ONLINE`
2. Leave Meeting Link blank
3. Submit

**Expected:** Error "Meeting link is required for online interviews."

---

### INT-04: Validation — PHONE Mode Link Field Disabled
**Steps:**
1. Select Mode: `PHONE`

**Expected:** Meeting Link field is grayed out / disabled automatically.

---

### INT-05: Complete Interview
**Precondition:** Interview exists with status SCHEDULED.  
**Steps:**
1. Go to Interviews list
2. Find the interview card
3. Click **Complete**

**Expected:** Interview status → `COMPLETED`. Candidate status → `SELECTED`. Card shows updated status.

---

### INT-06: Cancel Interview
**Steps:**
1. Find a SCHEDULED interview
2. Click **Cancel**
3. Enter reason: `Candidate unavailable`

**Expected:** Interview status → `CANCELLED`. Candidate status remains INTERVIEW_SCHEDULED (not changed by cancel).

---

### INT-07: Submit Interview Feedback
**Precondition:** Interview exists (any status).  
**Steps:**
1. Open an interview card
2. Click **Add Feedback**
3. Fill scores: Technical 8, Communication 7, Problem Solving 7, Culture Fit 9
4. Recommendation: `HIRE`
5. Click Submit

**Expected:** Feedback saved. Overall score auto-calculated (average = 7.75). Feedback visible on interview card.

---

### INT-08: Multiple Rounds
**Steps:**
1. Schedule Round 1 interview for a candidate
2. Complete it → candidate becomes SELECTED
3. Schedule Round 2 interview for the same candidate
4. Set Round: 2

**Expected:** Both interviews visible in list. Candidate shows Round 2 interview card separately.

---

## Section 5 — Training Management (TRAIN)

### TRAIN-01: Create Training Batch
**Precondition:** Logged in as training user.  
**Steps:**
1. Go to **Training → Batches**
2. Click **New Batch**
3. Fill: Batch Name: `Batch-June-2026`, Designation: `Software Engineer`, Start Date: tomorrow, End Date: +30 days, Capacity: 10
4. Click **Create**

**Expected:** Batch appears in list. Status: ACTIVE.

---

### TRAIN-02: Validation — Batch End Before Start
**Steps:**
1. New Batch form → Start Date: June 10, End Date: June 5

**Expected:** Validation error "End date must be after start date."

---

### TRAIN-03: Enroll Candidates in Batch
**Precondition:** Batch exists. At least one candidate with status SELECTED exists.  
**Steps:**
1. Click on the batch to open detail
2. Click **Enroll Candidates**
3. Check one or more candidates from the list
4. Click **Enroll**

**Expected:** Selected candidates added to batch. Candidate status → `TRAINING_IN_PROGRESS`.

---

### TRAIN-04: Mark Attendance
**Steps:**
1. Go to **Training → Attendance**
2. Select a batch with enrolled candidates
3. Mark some candidates Present, some Absent
4. Save

**Expected:** Attendance recorded. No status change on candidate (attendance is separate from progression).

---

### TRAIN-05: Mark Training Complete
**Precondition:** Candidate enrolled in a batch.  
**Steps:**
1. In batch detail, find an enrolled candidate
2. Click **Mark Complete**

**Expected:** Candidate status → `EXAM_PENDING`. Toast: "Marked complete — candidate moved to Exam Pending."

---

## Section 6 — Exam Management (EXAM)

### EXAM-01: Generate Exam Link — Single Candidate
**Precondition:** At least one candidate with status EXAM_PENDING.  
**Steps:**
1. Go to **Recruiter → Exams**
2. Click **Generate Exam Links**
3. Check one candidate
4. Click **Generate**

**Expected:** Exam link generated for that candidate. Link visible with Copy button. Candidate status → `EXAM_PENDING` (no change until they complete).

---

### EXAM-02: Generate Exam Links — Multiple Candidates
**Steps:**
1. Generate Exam Links form
2. Check 3 candidates
3. Click **Generate**

**Expected:** Links generated for all 3 candidates. Results panel shows each candidate's link separately. Any failures show the error reason.

---

### EXAM-03: Select All Toggle
**Steps:**
1. Open Generate Exam Links
2. Click **Select All**

**Expected:** All EXAM_PENDING candidates selected. Click again → all deselected.

---

### EXAM-04: Record Exam Result
**Precondition:** Exam link has been generated for a candidate.  
**Steps:**
1. In Exam Management, find the candidate's exam
2. Click **Record Result**
3. Enter Score: 75, Max Score: 100
4. Click Submit

**Expected:** Result saved. Candidate status → `EXAM_COMPLETED`.

---

### EXAM-05: Validation — Score Exceeds Max
**Steps:**
1. Record Result form → Score: 110, Max Score: 100

**Expected:** Validation error "Score cannot exceed max score."

---

### EXAM-06: Validation — Negative Score
**Steps:**
1. Score: `-5`

**Expected:** Validation error "Score must be 0 or greater."

---

## Section 7 — Offer Management (OFFER)

### OFFER-01: Create Offer Letter
**Precondition:** At least one candidate with status EXAM_COMPLETED (and no existing offer).  
**Steps:**
1. Go to **Recruiter → Offers**
2. Click **Create Offer**
3. Select candidate from dropdown
4. Fill: Designation: `Software Engineer`, Department: `Engineering`, Basic Salary: `55000`
5. Fill optional: joining date, allowances, probation period
6. Click **Create Offer**

**Expected:** Offer letter created. Candidate status → `OFFER_SENT`. Offer appears in list.

---

### OFFER-02: Validation — No Candidate Selected
**Steps:**
1. Create Offer form → leave candidate blank → Submit

**Expected:** Error "Select a candidate." Form does not submit.

---

### OFFER-03: Validation — Invalid Salary (Zero)
**Steps:**
1. Basic Salary: `0`
2. Submit

**Expected:** Error "Enter a valid basic salary."

---

### OFFER-04: Validation — Salary Empty
**Steps:**
1. Basic Salary: (blank)
2. Submit

**Expected:** Error "Enter a valid basic salary." (guards against NaN → Prisma crash)

---

### OFFER-05: Cannot Create Duplicate Offer
**Precondition:** Candidate already has an offer letter.  
**Steps:**
1. Try to create another offer for the same candidate

**Expected:** Candidate does not appear in the dropdown (already excluded). If somehow submitted via API, returns 409 "Offer already exists."

---

### OFFER-06: Candidate Accepts Offer
**Precondition:** Offer exists in OFFER_SENT state. Logged in as employee.  
**Steps:**
1. Login as employee
2. Go to **Employee → Offers**
3. Click **Accept**

**Expected:** Offer status → `ACCEPTED`. Candidate status → `OFFER_ACCEPTED`.

---

### OFFER-07: Candidate Rejects Offer
**Steps:**
1. Employee → Offers → Click **Reject**

**Expected:** Offer status → `REJECTED`. Candidate status → `OFFER_REJECTED`.

---

## Section 8 — Probation Management (PROB)

### PROB-01: Branch Manager Probation Approval
**Precondition:** Employee is in ONBOARDED or probation-eligible status.  
**Steps:**
1. Login as Branch Manager
2. Go to Management → Probation
3. Find employee → click **Approve (BM)**

**Expected:** BM approval field saved. Status shows BM approved, awaiting CM.

---

### PROB-02: Country Manager Approval
**Steps:**
1. Login as Country Manager
2. Management → Probation → find employee → **Approve (CM)**

**Expected:** CM approval saved. Awaiting MD.

---

### PROB-03: MD Final Approval
**Steps:**
1. Login as MD
2. Management → Probation → find employee → **Approve (MD)**

**Expected:** Probation status → `PASSED`. All three levels marked approved.

---

### PROB-04: Probation Cannot Skip Levels
**Steps:**
1. Login as MD
2. Attempt to approve probation for an employee where BM has NOT approved

**Expected:** Error or button disabled — MD cannot approve before BM and CM have approved.

---

## Section 9 — Agency Management (AGENCY)

### AGENCY-01: Add Agency
**Precondition:** Logged in as recruiter.  
**Steps:**
1. Go to **Recruiter → Agencies**
2. Click **Add Agency**
3. Fill: Name: `TalentBridge Solutions`, Type: `STAFFING`, Contact: `Ravi Kumar`, Email: `ravi@talentbridge.com`, Phone: `9876543210`
4. Save

**Expected:** Agency appears in list. Detail page accessible.

---

### AGENCY-02: Validation — Duplicate Agency Name
**Steps:**
1. Add agency with name `TalentBridge Solutions` again

**Expected:** Error "Agency with this name already exists."

---

### AGENCY-03: View Agency Detail
**Steps:**
1. Click on an agency from the list

**Expected:** Agency detail page opens. Shows contact info, type, status, and sourcing history.

---

## Section 10 — User Management (USER)

### USER-01: Create New User (Admin Only)
**Precondition:** Logged in as admin.  
**Steps:**
1. Go to **Admin → Users**
2. Click **Add User**
3. Fill: First Name: `Test`, Last Name: `User`, Email: `testuser@recruitment.com`, Role: `RECRUITER`, Password: `Test@1234`
4. Save

**Expected:** User created. Appears in user list. Can login with those credentials.

---

### USER-02: Deactivate User
**Steps:**
1. Admin → Users → find a user → toggle **Active** to OFF

**Expected:** User marked inactive. That user can no longer login (gets "Account inactive" or similar error).

---

### USER-03: Non-Admin Cannot Access Users Page
**Steps:**
1. Login as recruiter
2. Navigate to `/admin/users`

**Expected:** Redirected or shown "Unauthorized." Recruiter cannot see or manage users.

---

### USER-04: Change User Role
**Steps:**
1. Admin → Users → find user → edit role to `TRAINING`
2. Save

**Expected:** User role updated. Next login reflects new role-based UI.

---

## Section 11 — Department Management (DEPT)

### DEPT-01: Add Department
**Precondition:** Logged in as admin.  
**Steps:**
1. Go to **Admin → Departments**
2. Click **Add Department**
3. Name: `Quality Assurance`, Category: `Technical`
4. Save

**Expected:** Department appears in list. Available in MRF form Department dropdown.

---

### DEPT-02: Duplicate Department Name
**Steps:**
1. Add department `Quality Assurance` again

**Expected:** Error "Department already exists."

---

## Section 12 — Sourcing & Job Postings (SRC)

### SRC-01: Create Job Posting
**Precondition:** Approved MRF exists.  
**Steps:**
1. Go to **Recruiter → Sourcing**
2. Click **Create Posting**
3. Select MRF, platform: `LinkedIn`, deadline: +14 days
4. Save

**Expected:** Job posting created. Linked to MRF. Appears in sourcing list.

---

### SRC-02: View Sourcing Summary
**Steps:**
1. Recruiter → Sourcing → view dashboard

**Expected:** Counts of postings by platform visible. MRF source breakdown shown.

---

## Section 13 — Casual Workers (CAS)

### CAS-01: Add Casual Worker
**Steps:**
1. Go to **Recruiter → Casual Workers**
2. Click **Add Worker**
3. Fill: Name, Department, Daily Rate, Start Date, End Date
4. Save

**Expected:** Worker appears in casual workers list.

---

### CAS-02: Validation — Daily Rate Negative
**Steps:**
1. Daily Rate: `-500`

**Expected:** Validation error.

---

## Section 14 — Employee Portal (EMP)

### EMP-01: Employee Sees Own Journey
**Precondition:** Employee user account email matches a candidate email in the system.  
**Steps:**
1. Login as `employee@recruitment.com`
2. Go to **Employee → Dashboard**

**Expected:** Journey bar shows current recruitment stage. Steps up to current status highlighted.

---

### EMP-02: Employee Sees Own Offer
**Precondition:** Offer exists for this employee's candidate record.  
**Steps:**
1. Employee → Offers

**Expected:** Offer letter details visible: salary, designation, joining date, status.

---

### EMP-03: Employee Cannot Access Recruiter Pages
**Steps:**
1. Login as employee
2. Navigate to `/recruiter/candidates`

**Expected:** Redirected or 403. Employee has no access to recruiter module.

---

### EMP-04: Employee Documents
**Steps:**
1. Employee → Documents

**Expected:** Any documents linked to this employee are visible. No file upload option (policy: no uploads).

---

## Section 15 — Notifications (NOTIF)

### NOTIF-01: Notification Appears on Interview Scheduled
**Precondition:** Schedule a new interview.  
**Steps:**
1. Schedule an interview for a candidate
2. Check the notification bell icon

**Expected:** New notification visible: "Interview scheduled for [Candidate Name]."

---

### NOTIF-02: Mark Notification Read
**Steps:**
1. Click the notification
2. It should be dismissed or marked read

**Expected:** Notification count decreases. Read notifications distinguished from unread.

---

## Section 16 — Reports (RPT)

### RPT-01: Recruiter Reports — Candidate Summary
**Steps:**
1. Go to **Recruiter → Reports**
2. Apply date range filter: last 30 days
3. View

**Expected:** Counts of candidates by status shown. Numbers match what's visible in Candidate List.

---

### RPT-02: Management Reports
**Steps:**
1. Login as MD → Management → Reports
2. View pipeline summary

**Expected:** MRF counts, candidate counts by stage, hire rate shown.

---

### RPT-03: Training Reports
**Steps:**
1. Login as training → Training → Reports

**Expected:** Batch attendance rates, pass/fail counts, exam completion visible.

---

## Section 17 — Audit Logs (AUDIT)

### AUDIT-01: Admin Views Audit Logs
**Steps:**
1. Login as admin → Admin → Audit Logs
2. View recent entries

**Expected:** Actions logged with: user, action, timestamp, entity type. At minimum, logins should appear.

---

### AUDIT-02: Non-Admin Cannot See Audit Logs
**Steps:**
1. Login as recruiter → navigate to `/admin/audit-logs`

**Expected:** Access denied.

---

## Section 18 — Full End-to-End Lifecycle Test (E2E)

This test walks one candidate through the complete recruitment pipeline.

### E2E-01: Full Recruitment Lifecycle
**Total time estimate:** 30–45 minutes  
**Run once to validate the complete flow.**

| Step | Action | Portal | Expected Status |
|---|---|---|---|
| 1 | Login as admin → create department "Engineering" | Admin | — |
| 2 | Login as recruiter → create MRF for "Junior Developer", 1 vacancy | Recruiter | DRAFT |
| 3 | Submit MRF for approval | Recruiter | PENDING |
| 4 | Login as MD → approve MRF | Management | APPROVED |
| 5 | Login as recruiter → add candidate "Amit Sharma", email: `amit@test.com` | Recruiter | APPLIED |
| 6 | Shortlist candidate (change status to SHORTLISTED) | Recruiter | SHORTLISTED |
| 7 | Schedule interview for Amit — tomorrow, ONLINE, Technical | Recruiter | INTERVIEW_SCHEDULED |
| 8 | Mark interview Complete | Recruiter | SELECTED |
| 9 | Login as training → create batch "Dev Batch June" | Training | — |
| 10 | Enroll Amit in the batch | Training | TRAINING_IN_PROGRESS |
| 11 | Mark Amit's training complete | Training | EXAM_PENDING |
| 12 | Login as recruiter → generate exam link for Amit | Recruiter | EXAM_PENDING |
| 13 | Record exam result: 80/100 | Recruiter | EXAM_COMPLETED |
| 14 | Create offer letter for Amit: 50000 basic, Software Engineer | Recruiter | OFFER_SENT |
| 15 | Login as employee (if email matches) OR change Amit's status manually → OFFER_ACCEPTED | Employee/Recruiter | OFFER_ACCEPTED |
| 16 | Update status to ONBOARDED | Recruiter | ONBOARDED |
| 17 | Check Employee Dashboard journey bar | Employee | All steps highlighted |

**Pass Criteria:** All 17 steps complete without errors. Status at each stage matches the Expected column. Journey bar at step 17 shows all steps done.

---

## Section 19 — Security & Access Control Tests (SEC)

### SEC-01: JWT Required for API Calls
**Steps:**
1. Open browser DevTools → Network tab
2. Make any API call without a token (clear localStorage first)

**Expected:** API returns 401 Unauthorized.

---

### SEC-02: Cannot Access Other User's Data
**Steps:**
1. Login as recruiter A
2. Try to view data that belongs to an account recruiter A did not create (e.g., a candidate from a different branch)

**Expected:** Data either not visible or read-only with no edit access.

---

### SEC-03: No File Upload Available Anywhere
**Steps:**
1. Visit every page in the app
2. Look for any file input, drag-and-drop, or upload button

**Expected:** NO file upload inputs anywhere in the application. All data entered via structured forms only.

---

### SEC-04: XSS Input Attempt
**Steps:**
1. In any text field (e.g., Candidate First Name), enter: `<script>alert('xss')</script>`
2. Save and view the record

**Expected:** Text displayed as-is (escaped), not executed as JavaScript. No alert box appears.

---

### SEC-05: SQL Injection Attempt via Search
**Steps:**
1. In candidate search box, type: `'; DROP TABLE candidates; --`

**Expected:** No database error. No data deleted. Query returns 0 results or handles gracefully. (Prisma ORM parameterizes queries by default.)

---

## Section 20 — Edge Cases & Boundary Tests (EDGE)

### EDGE-01: Empty Candidate List Pagination
**Steps:**
1. Filter candidates by a status that has no candidates (e.g., FINAL_APPROVED if none exist)

**Expected:** "No candidates found" message. No crash. No blank white screen.

---

### EDGE-02: Very Long Text Fields
**Steps:**
1. In MRF description, paste 4999 characters (just under 5000 limit)
2. Save

**Expected:** Saved successfully. Counter shows `4999/5000`.

**Steps (second):**
1. Paste 5001 characters
2. Try to save

**Expected:** Validation error "Description cannot exceed 5000 characters."

---

### EDGE-03: Decimal Salary Values
**Steps:**
1. Offer form → Basic Salary: `45000.50`
2. Submit

**Expected:** Saved as `45000.50`. No parsing error.

---

### EDGE-04: Concurrent Status Changes
**Steps:**
1. Open candidate detail in two browser tabs
2. Change status to SHORTLISTED in Tab 1 → save
3. Change status to REJECTED in Tab 2 → save

**Expected:** Last write wins. No server error. Final status is whatever was saved last.

---

### EDGE-05: Interview Link Format Validation
**Steps:**
1. Schedule Interview, Mode: ONLINE
2. Meeting Link: `not a url` (no https://)

**Expected:** Validation error "Please enter a valid URL starting with https://".

---

## Test Execution Checklist

Use this to track progress during a full test run.

### Authentication
- [ ] AUTH-01 Valid login
- [ ] AUTH-02 Wrong password
- [ ] AUTH-03 Empty fields
- [ ] AUTH-04 Role-based redirect
- [ ] AUTH-05 Session persistence
- [ ] AUTH-06 Logout
- [ ] AUTH-07 Unauthorized route

### MRF
- [ ] MRF-01 Create valid MRF
- [ ] MRF-02 Empty field validation
- [ ] MRF-03 Designation too short
- [ ] MRF-04 Vacancies out of range
- [ ] MRF-05 Salary min > max
- [ ] MRF-06 Invalid skill characters
- [ ] MRF-07 Submit for approval
- [ ] MRF-08 MD approves
- [ ] MRF-09 Non-MD cannot approve
- [ ] MRF-10 MD rejects

### Candidates
- [ ] CAND-01 Add candidate
- [ ] CAND-02 Duplicate email
- [ ] CAND-03 Invalid email
- [ ] CAND-04 Phone validation
- [ ] CAND-05 Search
- [ ] CAND-06 Filter by status
- [ ] CAND-07 Update status
- [ ] CAND-08 Journey bar
- [ ] CAND-09 AI screening

### Interviews
- [ ] INT-01 Schedule interview
- [ ] INT-02 Past date
- [ ] INT-03 Online without link
- [ ] INT-04 Phone mode disables link
- [ ] INT-05 Complete interview
- [ ] INT-06 Cancel interview
- [ ] INT-07 Submit feedback
- [ ] INT-08 Multiple rounds

### Training
- [ ] TRAIN-01 Create batch
- [ ] TRAIN-02 End before start
- [ ] TRAIN-03 Enroll candidates
- [ ] TRAIN-04 Mark attendance
- [ ] TRAIN-05 Mark training complete

### Exams
- [ ] EXAM-01 Generate single link
- [ ] EXAM-02 Generate multiple links
- [ ] EXAM-03 Select all toggle
- [ ] EXAM-04 Record result
- [ ] EXAM-05 Score exceeds max
- [ ] EXAM-06 Negative score

### Offers
- [ ] OFFER-01 Create offer
- [ ] OFFER-02 No candidate selected
- [ ] OFFER-03 Zero salary
- [ ] OFFER-04 Empty salary
- [ ] OFFER-05 Duplicate offer
- [ ] OFFER-06 Candidate accepts
- [ ] OFFER-07 Candidate rejects

### Probation
- [ ] PROB-01 BM approval
- [ ] PROB-02 CM approval
- [ ] PROB-03 MD final approval
- [ ] PROB-04 Cannot skip levels

### Users & Departments
- [ ] USER-01 Create user
- [ ] USER-02 Deactivate user
- [ ] USER-03 Non-admin blocked
- [ ] USER-04 Change role
- [ ] DEPT-01 Add department
- [ ] DEPT-02 Duplicate department

### End-to-End
- [ ] E2E-01 Full lifecycle (17 steps)

### Security
- [ ] SEC-01 JWT required
- [ ] SEC-02 Cross-user data isolation
- [ ] SEC-03 No file uploads anywhere
- [ ] SEC-04 XSS attempt
- [ ] SEC-05 SQL injection attempt

### Edge Cases
- [ ] EDGE-01 Empty list pagination
- [ ] EDGE-02 Long text boundary
- [ ] EDGE-03 Decimal salary
- [ ] EDGE-04 Concurrent status change
- [ ] EDGE-05 Invalid URL format

---

**Total: 73 test cases**
