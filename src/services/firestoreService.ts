import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase.ts';
import { OperationType, type JournalInteraction, type GeneralInquiry } from '../types.ts';

/**
 * Strict Undefined-Stripping Utility
 * Removes undefined fields from objects before sending to Firestore
 * to prevent zero-crash payload failures.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Save or overwrite an interaction under the user's isolated path:
 * /users/{userId}/interactions/{interactionId}
 */
export async function saveUserInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save an interaction');
  }
  const interactionPath = `users/${userId}/interactions`;
  const docRef = doc(db, interactionPath, interaction.id);
  const cleanData = sanitizePayload({
    ...interaction,
    userId, // Enforce matching ownership
    updatedAt: new Date().toISOString(),
  });

  try {
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${interactionPath}/${interaction.id}`);
  }
}

/**
 * Delete an interaction permanently
 */
export async function deleteUserInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  const interactionPath = `users/${userId}/interactions`;
  const docRef = doc(db, interactionPath, interactionId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${interactionPath}/${interactionId}`);
  }
}

/**
 * Real-time listener for the user's private interactions
 */
export function subscribeToUserInteractions(
  userId: string,
  onSuccess: (interactions: JournalInteraction[]) => void,
  onError: (error: Error) => void
): () => void {
  const interactionPath = `users/${userId}/interactions`;
  const colRef = collection(db, interactionPath);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalInteraction;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest first by createdAt or updatedAt
      items.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
      onSuccess(items);
    },
    (error) => {
      console.error('Snapshot listener error:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, interactionPath);
      } catch (wrappedErr) {
        onError(wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr)));
      }
    }
  );
}

/**
 * Save or overwrite a general knowledge inquiry under the user's isolated path:
 * /users/{userId}/general-inquiries/{inquiryId}
 */
export async function saveGeneralInquiry(
  userId: string,
  inquiry: GeneralInquiry
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save an inquiry');
  }
  const inquiryPath = `users/${userId}/general-inquiries`;
  const docRef = doc(db, inquiryPath, inquiry.id);
  const cleanData = sanitizePayload({
    ...inquiry,
    userId, // Enforce matching ownership
    updatedAt: new Date().toISOString(),
  });

  try {
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${inquiryPath}/${inquiry.id}`);
  }
}

/**
 * Delete a general knowledge inquiry permanently
 */
export async function deleteGeneralInquiry(
  userId: string,
  inquiryId: string
): Promise<void> {
  const inquiryPath = `users/${userId}/general-inquiries`;
  const docRef = doc(db, inquiryPath, inquiryId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${inquiryPath}/${inquiryId}`);
  }
}

/**
 * Real-time listener for the user's private general inquiries subcollection
 */
export function subscribeToGeneralInquiries(
  userId: string,
  onSuccess: (inquiries: GeneralInquiry[]) => void,
  onError: (error: Error) => void
): () => void {
  const inquiryPath = `users/${userId}/general-inquiries`;
  const colRef = collection(db, inquiryPath);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GeneralInquiry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as GeneralInquiry;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest first by createdAt
      items.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onSuccess(items);
    },
    (error) => {
      console.error('General inquiries listener error:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, inquiryPath);
      } catch (wrappedErr) {
        onError(wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr)));
      }
    }
  );
}
