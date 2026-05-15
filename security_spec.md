# Security Specification - NutriCare Community

## 1. Data Invariants
- Users can only read and write their own profile, habit logs, meal plans, and health metrics.
- Admins can read all survey responses and user statistics.
- Survey responses are write-only for users (once submitted, cannot be modified except by admin).
- Timestamps must be server-generated.
- Health metrics (BMI, etc.) must be within realistic ranges.

## 2. The "Dirty Dozen" Payloads
1.  **Identity Spoofing**: Trying to create a user profile with a different UID.
2.  **Role Escalation**: Trying to set `role: 'admin'` during self-registration.
3.  **Cross-User Read**: Trying to fetch another user's meal plan.
4.  **Ghost Field Injection**: Adding `isPromoted: true` to a habit log.
5.  **Timestamp Spoofing**: Sending a manual string for `createdAt` instead of `request.time`.
6.  **ID Poisoning**: Using a 500-character string as a document ID.
7.  **Negative BMI**: Sending a health log with `bmi: -20`.
8.  **Orphaned Response**: Creating a survey response for a non-existent survey.
9.  **Terminal State Bypass**: Attempting to delete a submitted survey response.
10. **Shadow Key**: Adding fields not in the schema (e.g., `secretData` in user doc).
11. **Bulk Scrape**: Trying to list all users without being an admin.
12. **Malicious Enum**: Setting language to `fr` when only `en, te, hi, ta, kn` are allowed.

## 3. Test Runner (Draft)
A test suite will be implemented to ensure all the above fail.
