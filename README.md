# Gemini Journal & Reflections

A production-grade, user-authenticated web application built with **Google AI Studio**, powered by **Gemini 3.6 Flash**, **Firebase Authentication (Google Federated Identity)**, and **Cloud Firestore** with Zero-Trust Attribute-Based Access Control (ABAC).

---

## Features & Architecture Overview

- **User Identity (Firebase Auth)**: Secure Google Sign-In with federated identity. No custom credentials or passwords stored in the application database.
- **AI Processing Engine (Gemini 3.6 Flash)**: Multi-turn conversational journaling and reflection engine with a built-in resilient fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
- **Tagging & Categorization**: Tag journal entries with presets (`#Work`, `#Personal`, `#Ideas`, `#Goals`) or custom tags, and filter history by tags.
- **General Inquiries Mode**: Dedicated mode for direct, wide-ranging knowledge questions to Gemini with automatic Firestore persistence in `general-inquiries`.
- **User Data Isolation (Cloud Firestore)**: Every journal entry is saved under `/users/{userId}/interactions/{interactionId}` and general inquiries under `/users/{userId}/general-inquiries/{inquiryId}`.
- **Zero-Trust Security**: Strict Firestore Security Rules deny all public access, enforce identity immutability, and guarantee that users can never read, modify, or list entries belonging to another account.
- **Full-Stack Proxy**: Express backend proxies all Gemini API requests, ensuring `GEMINI_API_KEY` is never exposed in browser bundles.

---

## 1. Prerequisites & Environment Setup

Ensure you have installed:
- [Node.js (v20+)](https://nodejs.org/)
- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI (`firebase-tools`)](https://firebase.google.com/docs/cli)

Set your active Google Cloud project:
```bash
gcloud config set project smartupai-501516
```

Enable required Google Cloud APIs:
```bash
gcloud services enable run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 2. Cloud Firestore Security Rules Configuration

Deploy the owner-isolated security rules to guarantee data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/general-inquiries/{inquiryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Secret Management Setup

Create the `GEMINI_API_KEY` secret in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run runtime service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Local Development

Install dependencies and start the development server:
```bash
npm install
npm run dev
```

The unified full-stack server starts at `http://localhost:3000`.

---

## 5. Deployment to Google Cloud Run

Build and deploy the application container to Google Cloud Run:

```bash
# Build and deploy from source
gcloud run deploy gemini-journal \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

---

## 6. Required Campaign Verification Binding

To register the deployed service for automated challenge verification, apply the mandatory resource label:

```bash
gcloud run services update gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 7. Security & Compliance Checklist

- [x] **No hardcoded credentials**: `GEMINI_API_KEY` loaded server-side only via Secret Manager or environment variables.
- [x] **Verified Token `userId`**: Server derives user identity strictly from Firebase ID token claims, never request body parameters.
- [x] **Owner-Bound Path Checking**: Firestore access restricted to `request.auth.uid == userId`.
- [x] **Prompt Injection Defense**: Separation of system instructions and user input in Gemini calls; input length constraints enforced.
- [x] **Safe Output Encoding**: Stripping HTML tags and using safe React Markdown rendering.
