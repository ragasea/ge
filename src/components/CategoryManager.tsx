import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Category } from '../types';
import { dataService } from '../services/dataService';

interface CategoryManagerProps {
  categories: Category[];
  userId: string;
  onClose: () => void;
  isGuest?: boolean;
  onCategoriesChanged?: (categories: Category[]) => void;
}

export default function CategoryManager({ categories, userId, onClose, isGuest = false, onCategoriesChanged }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const newCat = await dataService.addCategory({
        name: newCategoryName.trim(),
        userId,
      }, isGuest);
      
      if (isGuest && newCat && onCategoriesChanged) {
        onCategoriesChanged([...categories, newCat]);
      }
      
      setNewCategoryName('');
    } catch (error) {
      console.error('Add category error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Notes in this category will remain but will be uncategorized.')) return;

    try {
      await dataService.deleteCategory(categoryId, isGuest);
      if (isGuest && onCategoriesChanged) {
        onCategoriesChanged(categories.filter(c => c.id !== categoryId));
      }
    } catch (error) {
      console.error('Delete category error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Categories</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
            >
              <Plus size={24} />
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4 italic">No categories yet. Add one above!</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300">{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
