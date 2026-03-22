import { Note, Category } from '../types';

const NOTES_KEY = 'mindvault_notes';
const CATEGORIES_KEY = 'mindvault_categories';

export const localStore = {
  getNotes: (): Note[] => {
    const data = localStorage.getItem(NOTES_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return parsed.map((n: any) => ({
        ...n,
        createdAt: n.createdAt ? { toDate: () => new Date(n.createdAt) } : null
      }));
    } catch (e) {
      console.error('Failed to parse local notes', e);
      return [];
    }
  },

  saveNotes: (notes: Note[]) => {
    const data = notes.map(n => ({
      ...n,
      createdAt: n.createdAt?.toDate ? n.createdAt.toDate().toISOString() : n.createdAt
    }));
    localStorage.setItem(NOTES_KEY, JSON.stringify(data));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) return [
      { id: 'cat-1', name: 'General', userId: 'guest', createdAt: { toDate: () => new Date() } as any },
      { id: 'cat-2', name: 'Work', userId: 'guest', createdAt: { toDate: () => new Date() } as any },
      { id: 'cat-3', name: 'Personal', userId: 'guest', createdAt: { toDate: () => new Date() } as any },
    ];
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse local categories', e);
      return [];
    }
  },

  saveCategories: (categories: Category[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }
};
