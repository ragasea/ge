import React, { useState } from 'react';
import { Send, Image as ImageIcon, Link as LinkIcon, Tag } from 'lucide-react';
import { serverTimestamp } from '../firebase';
import { Category, Note } from '../types';
import { dataService } from '../services/dataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuickNoteProps {
  categories: Category[];
  userId: string;
  selectedCategoryId: string | null;
  isGuest?: boolean;
  onNoteAdded?: (note: Note) => void;
}

export default function QuickNote({ categories, userId, selectedCategoryId, isGuest = false, onNoteAdded }: QuickNoteProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [categoryId, setCategoryId] = useState(selectedCategoryId || (categories.length > 0 ? categories[0].id : ''));
  
  React.useEffect(() => {
    if (selectedCategoryId) {
      setCategoryId(selectedCategoryId);
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [selectedCategoryId, categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !categoryId) return;

    setIsSubmitting(true);
    try {
      // Extract title from first two words of content
      const words = content.trim().split(/\s+/);
      const title = words.slice(0, 2).join(' ') || 'Untitled Note';

      const noteData = {
        title,
        content: content.trim(),
        categoryId,
        isArchived: false,
        createdAt: isGuest ? { toDate: () => new Date() } : serverTimestamp(),
        userId,
      };

      const newNote = await dataService.addNote(noteData as any, isGuest);
      if (newNote && onNoteAdded) {
        onNoteAdded(newNote);
      }
      
      setContent('');
      setShowOptions(false);
    } catch (error) {
      console.error('QuickNote error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-6 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
      <form onSubmit={handleSubmit}>
        <div className="p-3 sm:p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setShowOptions(true)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 resize-none min-h-[40px] sm:min-h-[60px] text-base sm:text-lg leading-relaxed"
            disabled={isSubmitting}
          />
        </div>

        {showOptions && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-2 sm:pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
                <Tag size={12} className="text-indigo-500" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 p-0 pr-4 sm:pr-6"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors">
                <ImageIcon size={16} />
              </button>
              <button type="button" className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors">
                <LinkIcon size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setContent('');
                  setShowOptions(false);
                }}
                className="text-xs sm:text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1 sm:px-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
              >
                {isSubmitting ? '...' : (
                  <>
                    <span className="hidden sm:inline">Post Note</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
