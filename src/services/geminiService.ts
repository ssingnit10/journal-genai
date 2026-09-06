import type { User } from 'firebase/auth';
import type { ChatMessage, ReflectionMode } from '../types.ts';

interface ReflectResponse {
  response: string;
  model: string;
  userId: string;
}

export async function requestGeminiReflection(
  user: User,
  prompt: string,
  mode: ReflectionMode,
  messages: ChatMessage[] = []
): Promise<ReflectResponse> {
  // Ensure token is fresh
  const token = await user.getIdToken(false);

  const res = await fetch('/api/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      mode,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || `Server responded with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export interface InquiryResponse {
  response: string;
  model: string;
  userId: string;
}

export async function requestGeneralInquiry(
  user: User,
  question: string,
  category: string = 'General'
): Promise<InquiryResponse> {
  const token = await user.getIdToken(false);

  const res = await fetch('/api/inquiry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question,
      category,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.error || `Server responded with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}
