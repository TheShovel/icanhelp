# Firebase

## Overview

Firebase is Google's BaaS (Backend-as-a-Service) platform. Core products: **Firestore** (NoSQL document DB), **Authentication**, **Cloud Functions** (serverless compute), **Hosting** (static/CDN), **Cloud Storage** (file/S3-like), **Security Rules** (access control). Tight integration with Google Cloud. SDKs for web, mobile (iOS/Android), Flutter, Unity, C++, admin (Node.js/Python/Go/Java).

## Firestore (NoSQL Database)

### Data Model

- **Documents**: key-value records (max 1 MiB)
- **Collections**: groups of documents (no schema)
- **Subcollections**: documents nested under a document (for hierarchical data)
- **Reference type**: `ref` field pointing to another document

```js
// Document structure
{
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  createdAt: Timestamp.fromDate(new Date()),
  address: { city: "NYC", zip: "10001" },    // nested map
  tags: ["admin", "beta"],                     // array
  manager: db.doc("users/bob")                 // reference
}
```

### Queries

```js
const db = getFirestore();

// Basic
const snapshot = await getDocs(collection(db, "users"));
snapshot.forEach(doc => console.log(doc.id, doc.data()));

// Filtering
const q = query(collection(db, "users"),
  where("age", ">=", 18),
  where("tags", "array-contains", "admin"),
  orderBy("age", "desc"),
  limit(10)
);
const snap = await getDocs(q);

// Compound indexes: Firebase auto-creates indexes for simple queries.
// Complex queries (equality on one field + range/order on another) require
// manual index creation in Firebase Console or via CLI.

// Pagination (cursor-based)
const next = query(collection(db, "users"), orderBy("name"), startAfter(lastDoc), limit(10));
```

### Real-time Listeners

```js
const unsub = onSnapshot(doc(db, "users", "alice"), (snap) => {
  if (snap.exists()) console.log("Current data:", snap.data());
});

const unsub2 = onSnapshot(query(collection(db, "users"), where("age", ">", 18)),
  (snapshot) => snapshot.docChanges().forEach(change => {
    if (change.type === "added") { /* new doc */ }
    if (change.type === "modified") { /* changed doc */ }
    if (change.type === "removed") { /* deleted doc */ }
  })
);
// Call unsub() to detach listener
```

- Web SDK uses WebSocket (long-polling fallback). Mobile uses gRPC.
- Cache: `onSnapshot` reads from local cache first, syncs with server
- Offline persistence enabled by default on mobile; on web: `initializeFirestore(app, { localCache: persistentLocalCache(/*...*/) })`

### Batched & Transactional Writes

```js
// Batch (atomic multi-document write)
const batch = writeBatch(db);
batch.set(doc(db, "users", "alice"), { name: "Alice" });
batch.update(doc(db, "users", "bob"), { age: 31 });
batch.delete(doc(db, "users", "charlie"));
await commitBatch(batch);

// Transaction (read + write isolation)
await runTransaction(db, async (transaction) => {
  const doc = await transaction.get(docRef);
  if (!doc.exists()) throw "Document does not exist!";
  transaction.update(docRef, { counter: doc.data().counter + 1 });
});
```

- Batches: max 500 operations. Writes are committed atomically.
- Transactions: max 10 document reads before writing. Retries on conflict.
- `set()` with `{ merge: true }`: merge instead of overwrite

### Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.data.age is number;
    }
    match /posts/{postId} {
      allow read: if true;  // public
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

- `request.auth`: authenticated user payload (`uid`, `token` claims)
- `request.resource.data`: incoming data (after write)
- `resource.data`: existing data in the document
- `exists()`, `get()`: cross-document validation
- Rules are evaluated **every request** — deny by default

### Firestore Limits

- Max write rate: 10,000 writes/second per database (burst to 40k)
- Max document reads/sec: 100,000 sustained
- Max document writes/sec to a single document: ~1 (use sharding for counters)
- Max document size: 1 MiB (store files in Cloud Storage)
- Max field nesting: 20 levels
- Index entries per document: 200

## Authentication

```js
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();
// Google
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const user = result.user; // uid, displayName, email, photoURL, phoneNumber

// Email/Password
await createUserWithEmailAndPassword(auth, email, password);
await signInWithEmailAndPassword(auth, email, password);

// Anonymous
await signInAnonymously(auth);

// Custom claims (admin role via Admin SDK)
admin.auth().setCustomUserClaims(uid, { admin: true });
```

- Providers: Google, Apple, Facebook, Twitter, GitHub, Microsoft, Yahoo
- Phone (SMS OTP), Email link (passwordless), SAML/OIDC custom
- Firebase UI: drop-in auth widget
- `onAuthStateChanged(auth, (user) => { ... })` — listen to auth state
- Multi-tenancy: Auth supports tenant isolation for SaaS

## Cloud Functions

Serverless functions (Node.js 20, Python, Go, Java, .NET, PHP, Ruby, C#):

```js
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();

// HTTP trigger
exports.helloWorld = functions.https.onRequest((req, res) => {
  res.json({ message: "Hello from Firebase!" });
});

// Firestore trigger
exports.onUserCreated = functions.firestore
  .onDocumentCreated("users/{userId}", (event) => {
    const snapshot = event.data;
    // send welcome email, etc.
  });

// Auth trigger
exports.onUserSignup = functions.auth.user().onCreate((user) => {
  // create profile in Firestore
});

// Scheduled (cron)
exports.scheduledJob = functions.scheduler.onSchedule("every 24 hours", () => { ... });
```

- Cold starts: ~400ms (Node.js Gen 1), ~100ms (Gen 2 with Cloud Run infra)
- Gen 2: retry policies, min/max instances, concurrency, secrets manager
- `functions.runWith({ secrets: ["STRIPE_KEY"] })`
- `require('firebase-functions/logger')` — structured logging

## Cloud Storage

File storage (Google Cloud Storage backed):

```js
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const storage = getStorage();
const storageRef = ref(storage, "users/alice/avatar.jpg");

// Upload
const snapshot = await uploadBytes(storageRef, file);
const url = await getDownloadURL(snapshot.ref);

// Download
const url = await getDownloadURL(ref(storage, "users/alice/avatar.jpg"));

// Delete
await deleteObject(ref(storage, "users/alice/avatar.jpg"));
```

Security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.startsWith('image/');
    }
  }
}
```

## Firebase Hosting

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy --only hosting
```

- Global CDN (Cloud CDN). Custom domain + SSL.
- `firebase.json`: configure rewrites, redirects, headers, 404 page
- SPA rewrites: `{"source": "**", "destination": "/index.html"}`
- Cloud Functions integration: `{"source": "/api/**", "function": "api"}`
- Preview channels: `firebase hosting:channel:deploy preview-name`
- Rollback via Firebase Console

## Admin SDK (Server-Side)

```js
const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.applicationDefault() });

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Bypass security rules
await db.collection("users").doc(uid).set({ ... });
await auth.getUser(uid);
```

- Admin SDK runs with full privileges — no security rules
- Use in Cloud Functions, backend services, or CI/CD
- Initialize with service account (JSON key) or ADC
- Real-time listener not available in Admin SDK

## Firebase vs Supabase

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| Database | Firestore (NoSQL) | PostgreSQL (SQL) |
| Query | Document-centric, limited joins | Full SQL, JOINs, CTEs |
| Real-time | Built-in (WebSocket) | Built-in (Realtime via WebSocket + Postgres Replication) |
| Auth | 15+ providers | ~12 providers + Row Level Security |
| Schema | Schemaless | SQL schema (migrations) |
| Pricing | Pay-as-you-go (usage-based) | Fixed + usage-based (cheaper at scale) |
| Lock-in risk | High (proprietary) | Lower (Postgres open source) |
| Offline | Excellent (mobile) | Limited (via sync engine) |
| Search | Third-party (Algolia, Meilisearch) | Full-text search (pg_search) |
| Serverless | Cloud Functions | Edge Functions (Deno) |
| Storage | GCS-backed | S3-compatible |
| Migration | Requires data export | Standard Postgres migration |
| Local dev | Emulator Suite | `supabase start` (Dockerized) |
| Open source | Partial (SDKs open, backend closed) | Fully open source (AGPL v3) |

## Firebase Emulator Suite

```bash
firebase init emulators
firebase emulators:start        # local Firestore, Auth, Functions, etc.
firebase emulators:start --import=./data
```

- Products: Firestore, Auth, Functions, Hosting, Storage, PubSub, Extensions
- Data persists via `--export-dir` flag
- Web UI at `http://localhost:4000`
- Useful for offline development and integration tests

## Cost Management

- **Spark (free tier)**: 50k reads/day, 20k writes/day, 1 GB storage, Auth (50k MAUs), Cloud Functions (2M invocations/month)
- **Blaze (pay-as-you-go)**: no caps — auto-scales to unlimited. Required for Cloud Functions, Cloud Scheduler.
- Big cost drivers: Firestore reads (writing many listeners on large collections), Storage downloads, Cloud Functions CPU time (Gen 1).
- Use Firestore `select()` to fetch only needed fields. Use composite indexes to avoid full scans. Limit real-time listeners to active views.
