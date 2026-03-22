import { 
  db, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { Note, Category } from '../types';
import { localStore } from './localStore';

export const dataService = {
  addNote: async (note: Omit<Note, 'id'>, isGuest: boolean) => {
    if (isGuest) {
      const notes = localStore.getNotes();
      const newNote = { ...note, id: Date.now().toString() } as Note;
      localStore.saveNotes([newNote, ...notes]);
      return newNote;
    } else {
      try {
        const docRef = await addDoc(collection(db, 'notes'), note);
        return { ...note, id: docRef.id } as Note;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'notes');
      }
    }
  },

  updateNote: async (noteId: string, updates: Partial<Note>, isGuest: boolean) => {
    if (isGuest) {
      const notes = localStore.getNotes();
      const updatedNotes = notes.map(n => n.id === noteId ? { ...n, ...updates } : n);
      localStore.saveNotes(updatedNotes);
    } else {
      try {
        await updateDoc(doc(db, 'notes', noteId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
      }
    }
  },

  deleteNote: async (noteId: string, isGuest: boolean) => {
    if (isGuest) {
      const notes = localStore.getNotes();
      const filteredNotes = notes.filter(n => n.id !== noteId);
      localStore.saveNotes(filteredNotes);
    } else {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `notes/${noteId}`);
      }
    }
  },

  addCategory: async (category: Omit<Category, 'id'>, isGuest: boolean) => {
    if (isGuest) {
      const categories = localStore.getCategories();
      const newCategory = { ...category, id: Date.now().toString() } as Category;
      localStore.saveCategories([...categories, newCategory]);
      return newCategory;
    } else {
      try {
        const docRef = await addDoc(collection(db, 'categories'), category);
        return { ...category, id: docRef.id } as Category;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'categories');
      }
    }
  },

  updateCategory: async (categoryId: string, updates: Partial<Category>, isGuest: boolean) => {
    if (isGuest) {
      const categories = localStore.getCategories();
      const updatedCategories = categories.map(c => c.id === categoryId ? { ...c, ...updates } : c);
      localStore.saveCategories(updatedCategories);
    } else {
      try {
        await updateDoc(doc(db, 'categories', categoryId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `categories/${categoryId}`);
      }
    }
  },

  deleteCategory: async (categoryId: string, isGuest: boolean) => {
    if (isGuest) {
      const categories = localStore.getCategories();
      const filteredCategories = categories.filter(c => c.id !== categoryId);
      localStore.saveCategories(filteredCategories);
    } else {
      try {
        await deleteDoc(doc(db, 'categories', categoryId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${categoryId}`);
      }
    }
  }
};
