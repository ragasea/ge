import { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  User,
  deleteDoc,
  doc,
  updateDoc,
  handleFirestoreError,
  OperationType
} from './firebase';
import { Note, Category } from './types';
import Layout from './components/Layout';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import CategoryManager from './components/CategoryManager';
import QuickNote from './components/QuickNote';
import { LogIn, FileText, Sparkles, ShieldCheck, Zap, Copy, Check, Trash2, Archive, ArchiveRestore, Moon, Sun, CheckSquare, Square, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

import { localStore } from './services/localStore';
import { dataService } from './services/dataService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: boolean;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('isGuest') === 'true';
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showLinkPreviews, setShowLinkPreviews] = useState(() => {
    const saved = localStorage.getItem('showLinkPreviews');
    return saved ? JSON.parse(saved) : true;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('showLinkPreviews', JSON.stringify(showLinkPreviews));
  }, [showLinkPreviews]);

  const handleCopyAll = () => {
    const activeNotes = notes.filter(n => !n.isArchived);
    const notesToCopy = selectedCategoryId 
      ? activeNotes.filter(n => n.categoryId === selectedCategoryId)
      : activeNotes;

    if (notesToCopy.length === 0) return;

    const grouped = categories.reduce((acc, cat) => {
      acc[cat.name] = notesToCopy.filter(n => n.categoryId === cat.id);
      return acc;
    }, {} as Record<string, Note[]>);

    // Handle notes without a category if any
    const uncategorized = notesToCopy.filter(n => !categories.find(c => c.id === n.categoryId));
    if (uncategorized.length > 0) {
      grouped['Uncategorized'] = (grouped['Uncategorized'] || []).concat(uncategorized);
    }

    let copyText = selectedCategoryId 
      ? `# MindVault Export - ${categories.find(c => c.id === selectedCategoryId)?.name}\n\n`
      : '# MindVault Export - All Notes\n\n';
    
    // Sort categories by name for consistent export
    const sortedCategoryNames = Object.keys(grouped).sort();

    sortedCategoryNames.forEach((catName) => {
      const catNotes = grouped[catName];
      if (catNotes.length === 0) return;
      copyText += `# ${catName}\n\n`;
      catNotes.forEach(note => {
        const dateStr = note.createdAt ? format(note.createdAt.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        copyText += `## ${note.title}\n`;
        copyText += `${dateStr}\n\n`;
        copyText += `${note.content}\n\n`;
        copyText += `---\n\n`;
      });
    });

    navigator.clipboard.writeText(copyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await dataService.deleteNote(noteId, !!user?.isGuest);
      if (user?.isGuest) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
      setSelectedNoteIds(prev => prev.filter(id => id !== noteId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedNoteIds.length} notes?`)) return;

    try {
      await Promise.all(selectedNoteIds.map(id => dataService.deleteNote(id, !!user?.isGuest)));
      if (user?.isGuest) {
        setNotes(prev => prev.filter(n => !selectedNoteIds.includes(n.id)));
      }
      setSelectedNoteIds([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    if (selectedNoteIds.length === 0) return;
    try {
      await Promise.all(selectedNoteIds.map(id => 
        dataService.updateNote(id, { isArchived: archive }, !!user?.isGuest)
      ));
      if (user?.isGuest) {
        setNotes(prev => prev.map(n => selectedNoteIds.includes(n.id) ? { ...n, isArchived: archive } : n));
      }
      setSelectedNoteIds([]);
    } catch (error) {
      console.error('Bulk archive error:', error);
    }
  };

  const visibleNotes = notes.filter(n => {
    const matchesCategory = !selectedCategoryId || n.categoryId === selectedCategoryId;
    const matchesArchive = n.isArchived === showArchived;
    return matchesCategory && matchesArchive;
  });
  const visibleNoteIds = visibleNotes.map(n => n.id);
  const allVisibleSelected = visibleNoteIds.length > 0 && visibleNoteIds.every(id => selectedNoteIds.includes(id));

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedNoteIds(prev => prev.filter(id => !visibleNoteIds.includes(id)));
    } else {
      // Select all visible
      setSelectedNoteIds(prev => {
        const newIds = [...prev];
        visibleNoteIds.forEach(id => {
          if (!newIds.includes(id)) newIds.push(id);
        });
        return newIds;
      });
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    );
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        localStorage.removeItem('isGuest');
      } else if (isGuest) {
        setUser({
          uid: 'guest',
          displayName: 'Guest User',
          email: 'local@vault',
          photoURL: null,
          isGuest: true
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isGuest]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setCategories([]);
      return;
    }

    if (user.isGuest) {
      setNotes(localStore.getNotes());
      setCategories(localStore.getCategories());
      return;
    }

    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', user.uid),
      orderBy('name', 'asc')
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(notesData);
    });

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(categoriesData);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeCategories();
    };
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    setUser({
      uid: 'guest',
      displayName: 'Guest User',
      email: 'local@vault',
      photoURL: null,
      isGuest: true
    });
  };

  const handleSignOut = async () => {
    if (user?.isGuest) {
      setIsGuest(false);
      localStorage.removeItem('isGuest');
      setUser(null);
    } else {
      await auth.signOut();
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleExportVault = () => {
    if (notes.length === 0) {
      alert('No notes to export.');
      return;
    }

    // Sort categories by name
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    
    let mdContent = `# MindVault Export - ${new Date().toLocaleDateString()}\n`;
    mdContent += `Total Notes: ${notes.length} (${notes.filter(n => n.isArchived).length} archived)\n\n`;
    mdContent += `---\n\n`;

    // Group notes by category
    sortedCategories.forEach(cat => {
      const catNotes = notes.filter(n => n.categoryId === cat.id);
      if (catNotes.length > 0) {
        mdContent += `## 📁 ${cat.name}\n\n`;
        catNotes.forEach(note => {
          mdContent += `### ${note.title}${note.isArchived ? ' [ARCHIVED]' : ''}\n`;
          mdContent += `*Created: ${note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'N/A'}*\n\n`;
          mdContent += `${note.content}\n\n`;
          mdContent += `---\n\n`;
        });
      }
    });

    // Handle notes without category
    const uncategorizedNotes = notes.filter(n => !categories.find(c => c.id === n.categoryId));
    if (uncategorizedNotes.length > 0) {
      mdContent += `## 📁 Uncategorized\n\n`;
      uncategorizedNotes.forEach(note => {
        mdContent += `### ${note.title}${note.isArchived ? ' [ARCHIVED]' : ''}\n`;
        mdContent += `*Created: ${note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'N/A'}*\n\n`;
        mdContent += `${note.content}\n\n`;
        mdContent += `---\n\n`;
      });
    }

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindVault_Vault_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-indigo-600 font-bold animate-pulse">Loading MindVault...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden font-sans">
        {/* Hero Section */}
        <div className="flex-1 bg-indigo-600 p-12 md:p-24 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white p-3 rounded-2xl text-indigo-600 shadow-2xl">
                <FileText size={40} />
              </div>
              <h1 className="text-5xl font-black tracking-tighter">MindVault</h1>
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
              CAPTURE <br />
              <span className="text-indigo-200">EVERY</span> <br />
              THOUGHT.
            </h2>
            
            <p className="text-xl md:text-2xl font-medium text-indigo-100 max-w-xl mb-12 leading-relaxed">
              The ultimate workspace for your markdown notes, website links, and categorized wisdom. 
              Organized, secure, and always with you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="bg-indigo-500 p-2 rounded-xl"><Sparkles size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">Markdown Ready</h3>
                  <p className="text-sm text-indigo-100">Full support for rich formatting and code snippets.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="bg-indigo-500 p-2 rounded-xl"><ShieldCheck size={20} /></div>
                <div>
                  <h3 className="font-bold text-lg">Secure Vault</h3>
                  <p className="text-sm text-indigo-100">Your data is private and protected by Google Auth.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Login Section */}
        <div className="w-full md:w-[500px] bg-white p-12 md:p-24 flex flex-col justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mb-12">
              <h3 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h3>
              <p className="text-gray-500 font-medium">Sign in to access your vault</p>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-100 group mb-4"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              <span>Continue with Google</span>
              <Zap size={18} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={handleContinueAsGuest}
              className="w-full flex items-center justify-center gap-4 bg-gray-50 border-2 border-transparent py-4 px-6 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FileText size={20} className="text-indigo-500" />
              <span>Continue as Guest (Local Only)</span>
            </button>

            <div className="mt-12 pt-12 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Powered by Google AI Studio</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <Layout
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
      onNewNote={handleNewNote}
      onManageCategories={() => setIsCategoryManagerOpen(true)}
      user={user}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      onSignOut={handleSignOut}
      onExport={handleExportVault}
    >
      <div className="mb-6 sm:mb-12">
        {!isOnline && !user?.isGuest && (
          <div className="mb-4 sm:mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-xs sm:text-sm font-bold">Offline Mode: Changes will sync when you're back online</span>
          </div>
        )}
        {user?.isGuest && (
          <div className="mb-4 sm:mb-6 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl flex items-center gap-3">
            <Zap size={16} className="text-indigo-500" />
            <span className="text-xs sm:text-sm font-bold">Guest Mode: Data is stored locally on this device only.</span>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                {selectedCategoryId 
                  ? categories.find(c => c.id === selectedCategoryId)?.name 
                  : showArchived ? 'Archived' : 'All Notes'}
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showArchived 
                      ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                  )}
                  title={showArchived ? 'Show Active' : 'Show Archived'}
                >
                  {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  <span className="hidden sm:inline">{showArchived ? 'Active' : 'Archived'}</span>
                </button>
                <button
                  onClick={() => setShowLinkPreviews(!showLinkPreviews)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    showLinkPreviews 
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" 
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                  )}
                  title={showLinkPreviews ? 'Hide Previews' : 'Show Previews'}
                >
                  <Globe size={14} />
                  <span className="hidden sm:inline">Previews</span>
                </button>
                <button
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                  title={allVisibleSelected ? 'Deselect All' : 'Select All'}
                >
                  {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  <span className="hidden sm:inline">{allVisibleSelected ? 'None' : 'All'}</span>
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {notes.filter(n => showArchived ? n.isArchived : !n.isArchived).length} notes in this view
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedNoteIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-3 py-2 rounded-xl shadow-sm animate-in fade-in slide-in-from-right-4">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mr-2">{selectedNoteIds.length} SELECTED</span>
                <button
                  onClick={() => handleBulkArchive(!showArchived)}
                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                  title={showArchived ? "Restore selected" : "Archive selected"}
                >
                  {showArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                  title="Delete selected"
                >
                  <Trash2 size={18} />
                </button>
                <div className="w-px h-4 bg-indigo-200 dark:bg-indigo-800 mx-1" />
                <button
                  onClick={() => setSelectedNoteIds([])}
                  className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {notes.filter(n => !n.isArchived).length > 0 && !showArchived && (
              <button
                onClick={handleCopyAll}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all",
                  isCopied 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" 
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm"
                )}
                title="Copy All (Category-wise)"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                <span className="hidden sm:inline">{isCopied ? 'Copied All!' : 'Copy All'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {user && (
        <QuickNote 
          categories={categories} 
          userId={user.uid} 
          selectedCategoryId={selectedCategoryId}
          isGuest={!!user.isGuest}
          onNoteAdded={(note) => user.isGuest && setNotes(prev => [note, ...prev])}
        />
      )}

      <NotesList 
        notes={notes.filter(n => showArchived ? n.isArchived : !n.isArchived)}
        categories={categories}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        selectedCategoryId={selectedCategoryId}
        selectedNoteIds={selectedNoteIds}
        onToggleSelection={toggleNoteSelection}
        showLinkPreviews={showLinkPreviews}
      />

      <AnimatePresence>
        {isEditorOpen && user && (
          <NoteEditor
            note={editingNote}
            categories={categories}
            userId={user.uid}
            onClose={() => setIsEditorOpen(false)}
            isGuest={!!user.isGuest}
            onNoteSaved={(note) => {
              if (user.isGuest) {
                if (editingNote) {
                  setNotes(prev => prev.map(n => n.id === note.id ? note : n));
                } else {
                  setNotes(prev => [note, ...prev]);
                }
              }
            }}
          />
        )}
        {isCategoryManagerOpen && user && (
          <CategoryManager
            categories={categories}
            userId={user.uid}
            onClose={() => setIsCategoryManagerOpen(false)}
            isGuest={!!user.isGuest}
            onCategoriesChanged={(cats) => user.isGuest && setCategories(cats)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
