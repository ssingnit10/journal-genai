# Security Specification & Threat Audit (Zero-Trust Firestore ABAC)

## 1. Data Invariants
1. **Strict User Ownership**: An interaction document can ONLY be created, read, updated, or deleted by the user whose UID matches the `userId` in the path `/users/{userId}/interactions/{interactionId}`.
2. **Identity Immutability**: The `userId` field inside the document payload must equal `request.auth.uid` on creation and CANNOT be modified during updates.
3. **No Cross-User Access**: Unauthenticated users and authenticated users with foreign UIDs cannot list, read, update, or delete another user's interactions.
4. **Volumetric Boundaries**: Document IDs must be alphanumeric and <= 128 characters (`isValidId`). Prompts must be <= 10,000 chars, responses <= 25,000 chars, title <= 300 chars.
5. **Mode Whitelist**: Modes are restricted strictly to `['reflect', 'brainstorm', 'summarize', 'chat']`.

## 2. The "Dirty Dozen" Malicious Payloads
| # | Test Scenario | Malicious Payload / Action | Expected Result |
|---|---|---|---|
| 1 | Foreign User Read | User `attacker_123` requests `GET /users/victim_456/interactions/int_001` | `PERMISSION_DENIED` |
| 2 | Unauthenticated Read | Anonymous request `GET /users/victim_456/interactions/int_001` | `PERMISSION_DENIED` |
| 3 | Cross-User Interaction Injection | User `attacker_123` writes to `/users/victim_456/interactions/fake_01` | `PERMISSION_DENIED` |
| 4 | Identity Spoofing in Payload | User `attacker_123` writes to `/users/attacker_123/interactions/int_1` with payload `{ userId: 'victim_456' }` | `PERMISSION_DENIED` |
| 5 | Oversized Denial-of-Wallet Prompt | Payload with `prompt` of 500,000 characters | `PERMISSION_DENIED` |
| 6 | ID Poisoning Attack | Document ID containing `../`, `<script>`, or 2,000 junk characters | `PERMISSION_DENIED` |
| 7 | Invalid Mode Injection | Payload with `mode: 'execute_shell'` or unrecognized mode | `PERMISSION_DENIED` |
| 8 | Ownership Theft via Update | User attempts to update `existing().userId` to another UID | `PERMISSION_DENIED` |
| 9 | Wildcard Root Read | Querying `GET /users` or collection group without owner scoping | `PERMISSION_DENIED` |
| 10 | Unbounded Tags Array Bomb | Attempting to write `tags` array with 5,000 items | `PERMISSION_DENIED` |
| 11 | Unverified Email Manipulation | User with unverified fake email impersonating privileged roles | `PERMISSION_DENIED` |
| 12 | Blanket List Scraping | Client attempting `allow list` query without `where('userId', '==', request.auth.uid)` filter matching path | `PERMISSION_DENIED` |

## 3. Red Team Security Verification
All 12 dirty payloads are intercepted and rejected by the hardened `firestore.rules`.
