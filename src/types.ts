export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize' | 'chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  response: string;
  mode: ReflectionMode;
  messages: ChatMessage[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  modelUsed?: string;
}

export interface GeneralInquiry {
  id: string;
  userId: string;
  question: string;
  response: string;
  category?: string;
  modelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppSection = 'journal' | 'inquiries';

export interface UserAuthProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
