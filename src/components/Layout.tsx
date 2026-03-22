import React, { useState } from 'react';
import { LogOut, Plus, Settings, Search, Menu, X, LayoutDashboard, Tag, FileText, ChevronRight, Sun, Moon, Download, Smartphone, Trash2, Info } from 'lucide-react';
import { auth, signOut } from '../firebase';
import { Category } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { usePWA } from '../hooks/usePWA';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onNewNote: () => void;
  onManageCategories: () => void;
  user: any;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void;
  onExport: () => void;
}

export default function Layout({ 
  children, 
  categories, 
  selectedCategoryId, 
  onSelectCategory, 
  onNewNote, 
  onManageCategories, 
  user,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
  onExport
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUninstallInfo, setShowUninstallInfo] = useState(false);
  const { isInstallable, isInstalled, installPWA } = usePWA();

  const handleSignOut = () => {
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col md:flex-row font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <FileText size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight dark:text-white">MindVault</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 hidden md:flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-100">
            <FileText size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">MindVault</h1>
        </div>

        <div className="px-6 mb-8">
          <button
            onClick={() => { onNewNote(); setIsSidebarOpen(false); }}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            <Plus size={20} />
            New Note
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="px-4 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">Navigation</p>
          </div>
          
          <button
            onClick={() => { onSelectCategory(null); setIsSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group",
              selectedCategoryId === null ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={18} />
              <span>All Notes</span>
            </div>
            {selectedCategoryId === null && <ChevronRight size={16} />}
          </button>

          <div className="px-4 mt-8 mb-2 flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">Categories</p>
            <button 
              onClick={onManageCategories}
              className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
              title="Manage Categories"
            >
              <Settings size={14} />
            </button>
          </div>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => { onSelectCategory(category.id); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all group",
                selectedCategoryId === category.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Tag size={18} />
                <span className="truncate">{category.name}</span>
              </div>
              {selectedCategoryId === category.id && <ChevronRight size={16} />}
            </button>
          ))}

          {/* PWA Installation Section */}
          {(isInstallable || isInstalled) && (
            <div className="px-4 mt-8 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">App Management</p>
            </div>
          )}

          {isInstallable && (
            <button
              onClick={() => { installPWA(); setIsSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
            >
              <Smartphone size={18} />
              <span>Install App</span>
            </button>
          )}

          {isInstalled && (
            <button
              onClick={() => setShowUninstallInfo(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 transition-all"
            >
              <Trash2 size={18} />
              <span>Uninstall Info</span>
            </button>
          )}
        </nav>

        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=6366f1&color=fff`} 
                alt={user.displayName}
                className="w-10 h-10 rounded-xl border-2 border-white dark:border-gray-800 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName || 'User'}</p>
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <button
            onClick={onExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all mb-2"
          >
            <Download size={16} />
            Export Vault (.md)
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Uninstall Info Modal */}
      {showUninstallInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Info size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">How to Uninstall</h2>
            </div>
            
            <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
              <p>To uninstall this app from your phone or desktop:</p>
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>Go to your device's home screen or app drawer.</li>
                <li>Find the <span className="text-indigo-600 dark:text-indigo-400 font-bold">MindVault</span> icon.</li>
                <li>Long-press the icon and select <span className="text-red-500 font-bold">Uninstall</span> or <span className="text-red-500 font-bold">Remove App</span>.</li>
                <li>On desktop browsers, you can also go to <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">chrome://apps</code> and right-click to remove.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowUninstallInfo(false)}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
}
