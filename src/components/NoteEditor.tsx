import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, X, Eye, Edit2, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { serverTimestamp } from '../firebase';
import { Note, Category } from '../types';
import { dataService } from '../services/dataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NoteEditorProps {
  note?: Note | null;
  categories: Category[];
  userId: string;
  onClose: () => void;
  isGuest?: boolean;
  onNoteSaved?: (note: Note) => void;
}

export default function NoteEditor({ note, categories, userId, onClose, isGuest = false, onNoteSaved }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [categoryId, setCategoryId] = useState(note?.categoryId || '');
  const [isArchived, setIsArchived] = useState(note?.isArchived || false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategoryId(note.categoryId);
      setIsArchived(note.isArchived || false);
    } else {
      setTitle('');
      setContent('');
      setCategoryId(categories[0]?.id || '');
      setIsArchived(false);
    }
  }, [note, categories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !categoryId) return;

    setIsSubmitting(true);
    try {
      let finalTitle = title.trim();
      if (!finalTitle) {
        const words = content.trim().split(/\s+/);
        finalTitle = words.slice(0, 2).join(' ') || 'Untitled Note';
      }

      if (note) {
        const updates = {
          title: finalTitle,
          content: content.trim(),
          categoryId,
          isArchived,
        };
        await dataService.updateNote(note.id, updates, isGuest);
        if (onNoteSaved) {
          onNoteSaved({ ...note, ...updates });
        }
      } else {
        const noteData = {
          title: finalTitle,
          content: content.trim(),
          categoryId,
          isArchived,
          createdAt: isGuest ? { toDate: () => new Date() } : serverTimestamp(),
          userId,
        };
        const newNote = await dataService.addNote(noteData as any, isGuest);
        if (newNote && onNoteSaved) {
          onNoteSaved(newNote);
        }
      }
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return;

    setIsSubmitting(true);
    try {
      await dataService.deleteNote(note.id, isGuest);
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{note ? 'Edit Note' : 'New Note'}</h2>
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-all",
                  !isPreview ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Edit2 size={16} className="inline mr-1" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-all",
                  isPreview ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <Eye size={16} className="inline mr-1" /> Preview
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {note && (
              <>
                <button
                  type="button"
                  onClick={() => setIsArchived(!isArchived)}
                  className={cn(
                    "p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold",
                    isArchived ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  title={isArchived ? "Restore note" : "Archive note"}
                >
                  {isArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
                  <span className="hidden sm:inline">{isArchived ? 'Archived' : 'Archive'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  title="Delete note"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title (optional)..."
                  className="w-full px-4 py-3 text-lg font-semibold border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                  disabled={isSubmitting}
                />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
                required
                disabled={isSubmitting}
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl">
              {!isPreview ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note in Markdown format..."
                  className="flex-1 w-full p-4 resize-none focus:outline-none font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
                  required
                  disabled={isSubmitting}
                />
              ) : (
                <div className="flex-1 w-full p-6 overflow-y-auto prose prose-indigo dark:prose-invert max-w-none bg-gray-50/50 dark:bg-gray-900/50">
                  <ReactMarkdown>{content || '*No content to preview*'}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || !categoryId}
              className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all flex items-center gap-2"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
