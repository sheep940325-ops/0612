# Security Model Specification for Illustration Portfolio System

This document outlines the Zero-Trust security rules designed to protect user identity, illustration data integrity, interaction validity, and to prevent "Denial of Wallet" resource consumption attempts in Firestore.

## 1. Core Data Invariants

1. **User Identity Isolation**: A user profile document can only be created and edited by the owner matching the Firestore document key. Reading of other user's detailed profiles can be performed by any authentic users, but blanket list-scraping is strictly restricted.
2. **Illustration Ownership Proof**: An illustration can only be registered if the author’s UID perfectly matches the authenticated session (`request.auth.uid`). Once created, the immutable fields `id`, `imageUrl`, `creatorId`, and `createdAt` cannot be altered.
3. **Like Uniqueness**: A user's like trace is mapped to `/illustrations/{id}/likes/{userId}`. Since the key is `{userId}`, a user is physically constrained by Firestore key collision to a maximum of 1 like per illustration document.
4. **Likes Count Integrity**: Any update that alters `likesCount` is strictly audited to ensure no other values are touched (preventing description/title hijack), and the count can only move up or down by exactly `1` per transaction.
5. **Traceability of Comments**: Comments must carry the `uid` of the authenticated composer, and deleting comments is strictly gated to the author of that comment.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following attack vectors are engineered to test our Firestore rules and must be blocked:

1. **Identity Hijacking on Registration**: Creating profile document `/users/victim_uid` using session of `attacker_uid`.
2. **Privilege Escalation Shadow Field**: Attempting to register profile with unrequested fields (e.g. `isAdmin: true` or `role: 'editor'`).
3. **ID Poisoning Resource Attack**: Saving a 1MB random special characters string as the `{illustrationId}` document key to exhaust indexing storage.
4. **Artwork Ownership Spoofing**: Submitting a design to `/illustrations/art_101` with `creatorId: "victim_uid"` using an attacker's token.
5. **Creation Metadata Override**: Trying to update an existing illustration and rewriting the `createdAt` or `creatorId` fields.
6. **Description Hijack during Like Increment**: Performing an update to a design with an affected key set containing both `likesCount` and `description` to sneakily change descriptions during a like action.
7. **Likes Count Poisoning**: Incrementing `likesCount` by `1000` or setting it directly to a negative integer during like interaction.
8. **Double Liked Footprint Injection**: Submitting a like document to `/illustrations/art_101/likes/victim_uid` with attacker's auth token.
9. **Comment Impersonation**: Posting comment with `userId: "victim_uid"` from an attacker's session.
10. **Victim's Feedback Erasure**: Deleting a comment belonging to `victim_uid` using the session of `attacker_uid`.
11. **Malicious Tag Array Injection**: Crafting an array of 5,000 tags on an illustration to flood system querying speeds.
12. **Blanket User Profile Scraping**: Issuing a list query across the `/users` collection without specifying an individual target ID.

---

## 3. Test Runner Design (`firestore.rules.test.ts`)

A test suite wrapping our security rules using standard firebase local emulator:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { setDoc, getDoc, getDocs, collection, doc, deleteDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "project-402184260335997740",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Deny Identity Hijacking on register", async () => {
  const attackerDb = testEnv.authenticatedContext("attacker_123").firestore();
  const res = setDoc(doc(attackerDb, "users", "victim_456"), {
    uid: "victim_456",
    displayName: "Victim",
    email: "victim@example.com",
    createdAt: new Date()
  });
  await expect(res).rejects.toThrow("PERMISSION_DENIED");
});

test("Deny Shadow Field injections", async () => {
  const attackerDb = testEnv.authenticatedContext("attacker_123").firestore();
  const res = setDoc(doc(attackerDb, "users", "attacker_123"), {
    uid: "attacker_123",
    displayName: "Attacker",
    email: "attacker@gmail.com",
    isAdmin: true, // shadow field
    createdAt: new Date()
  });
  await expect(res).rejects.toThrow("PERMISSION_DENIED");
});
```
