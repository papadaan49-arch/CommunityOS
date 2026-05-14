# Security Specification for CommunityOS

## 1. Data Invariants
- A blueprint MUST have an `ownerId` matching the creator's UID.
- A blueprint MUST have `createdAt` and `updatedAt` as server timestamps.
- `ownerId` is immutable.
- `createdAt` is immutable.
- Collaborators must be an array of strings (UIDs).

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a blueprint with an `ownerId` belonging to another user. (REJECTED)
2. **Immutability Breach**: Attempt to change the `ownerId` of an existing blueprint. (REJECTED)
3. **Unauthorized Access**: User A attempts to read User B's private blueprint where User A is not a collaborator. (REJECTED)
4. **Unauthorized Update**: User A attempts to edit User B's blueprint without being a collaborator. (REJECTED)
5. **Ghost Field Injection**: Adding a `isAdmin: true` field to a blueprint document during update. (REJECTED)
6. **ID Poisoning**: Using a 2KB string as a `blueprintId`. (REJECTED)
7. **Timestamp Fraud**: Setting `createdAt` to a date in the past via client. (REJECTED)
8. **Public Leak**: Setting `isPublic` to true on another user's blueprint without permission. (REJECTED)
9. **PII Exposure**: Reading User B's private profile. (REJECTED if not owner/admin)
10. **Resource Exhaustion**: Sending a massive array (>1000 items) in `collaborators`. (REJECTED)
11. **Type Mismatch**: Sending a string to a field expected to be a number (e.g., in budget). (REJECTED via validation helper)
12. **Status Skipping**: If we had a terminal state (not yet defined here, but if we add one). (REJECTED)

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` will verify these rejections.
