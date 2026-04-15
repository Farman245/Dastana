export type GloveVariety = "Small Half" | "Medium Half" | "Large Half";

export interface YarnRecord {
  id?: string;
  date: string;
  bags: number;
  weight: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProductionRecord {
  id?: string;
  date: string;
  variety: GloveVariety;
  dozens: number;
  weight: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
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
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
