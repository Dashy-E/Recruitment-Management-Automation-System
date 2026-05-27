# Business Rules

## Candidate Progression

- A candidate can only move to interview scheduling after screening is completed.
- Training cannot start until the candidate is selected and offer acceptance is recorded.
- Exam links cannot be generated until training completion is marked.
- Offer letters can only be generated for selected candidates with approved CTC.
- Appointment letters can only be generated after offer acceptance.

## Exam Failure

- Failed candidates move to `FAILED`.
- Retakes are allowed up to the configured attempt limit, defaulting to two attempts.
- After the final failed attempt, HR must either reject the candidate or place the candidate on hold.

## Training Incomplete

- Candidate status remains `TRAINING_PENDING`.
- Exam generation is blocked.
- Training remarks are mandatory when marking incomplete.

## Interview Disagreement

- Interview feedback scores are averaged.
- If panel recommendations conflict, HR final review is required.
- HR must enter a final decision reason.

## Offer Rejected

- Candidate status becomes `OFFER_REJECTED`.
- HR can re-negotiate, close application, or return the candidate to the active pipeline.

## Probation Extended

- Extension duration is configurable.
- Manager remarks are mandatory.
- Employee and relevant managers receive notifications.

## Duplicate Candidate Detection

- Match on email and phone number.
- If either matches an active or soft-deleted candidate, warn the recruiter before saving.

## Audit Rollback

- Critical changes log previous and next values.
- Admin users can restore supported records from audit history.
