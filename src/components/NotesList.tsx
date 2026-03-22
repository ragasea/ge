import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { Note, Category } from '../types';
import { Calendar, Tag, ChevronRight, FileText, ExternalLink, Trash2, Globe, Play } from 'lucide-react';
import LinkPreview from './LinkPreview';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotesListProps {
  notes: Note[];
  categories: Category[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  selectedCategoryId: string | null;
  selectedNoteIds: string[];
  onToggleSelection: (noteId: string) => void;
  showLinkPreviews: boolean;
}

export default function NotesList({ 
  notes, 
  categories, 
  onEditNote, 
  onDeleteNote, 
  selectedCategoryId,
  selectedNoteIds,
  onToggleSelection,
  showLinkPreviews
}: NotesListProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';
  };

  const filteredNotes = selectedCategoryId
    ? notes.filter((n) => n.categoryId === selectedCategoryId)
    : notes;

  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const categoryName = getCategoryName(note.categoryId);
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <FileText size={48} />
        </div>
        <p className="text-xl font-medium">No notes found</p>
        <p className="text-sm">Start by creating your first note!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 pb-20">
      {Object.entries(groupedNotes).map(([categoryName, categoryNotes]) => (
        <section key={categoryName} className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Tag size={16} className="text-indigo-500" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{categoryName}</h2>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
              {categoryNotes.length}
            </span>
          </div>

          <div className="space-y-2 sm:space-y-4">
            {categoryNotes.map((note) => {
              const isSelected = selectedNoteIds.includes(note.id);
              const urls = note.content.match(/(https?:\/\/[^\s]+)/g) || [];
              const firstUrl = urls[0];

              return (
                <article
                  key={note.id}
                  className={cn(
                    "group bg-white dark:bg-gray-900 border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-2.5 sm:gap-4 relative overflow-hidden",
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1">
                    <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-sm shrink-0">
                      {note.title.charAt(0).toUpperCase() || 'N'}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(note.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer dark:bg-gray-800"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white">
                        <span className="hover:underline truncate max-w-[100px] sm:max-w-none">{note.title}</span>
                        <span className="text-gray-400 font-medium">·</span>
                        <span className="text-gray-400 font-medium whitespace-nowrap">
                          {note.createdAt ? format(note.createdAt.toDate(), 'MMM d') : format(new Date(), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditNote(note);
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Edit note"
                        >
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    <div 
                      className="text-[11px] sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                      onClick={() => onEditNote(note)}
                    >
                      <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none line-clamp-2 sm:line-clamp-6">
                        <ReactMarkdown>{note.content}</ReactMarkdown>
                      </div>
                    </div>

                    {showLinkPreviews && firstUrl && <LinkPreview url={firstUrl} />}

                    <div className="mt-3 flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                        <Tag size={10} />
                        {categoryName}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
