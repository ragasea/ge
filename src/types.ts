import { Timestamp } from './firebase';

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt?: Timestamp;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  createdAt: Timestamp;
  userId: string;
  isArchived?: boolean;
}
