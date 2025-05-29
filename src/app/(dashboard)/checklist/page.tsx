'use client';

import { useState } from 'react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { ChecklistItem } from '@/types/firebase';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_CATEGORIES = [
  'Legalities',
  'Venue & Reception',
  'Outfits & Attire',
  'Food & Beverage',
  'Entertainment',
  'Decorations',
  'Photography & Video',
  'Transportation',
  'Accommodations',
  'Gifts & Favors',
  'Others'
];

export default function ChecklistPage() {
  const { checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useFirebase();
  const [newItems, setNewItems] = useState<{ [key: string]: string }>({});

  // Group items by category
  const groupedItems = checklistItems.reduce((acc, item) => {
    const category = item.category || 'Others';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as { [key: string]: ChecklistItem[] });

  const handleAddItem = async (category: string) => {
    const itemDescription = newItems[category]?.trim();
    if (!itemDescription) return;

    await addChecklistItem({
      description: itemDescription,
      category,
      done: false
    });

    setNewItems(prev => ({ ...prev, [category]: '' }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, category: string) => {
    if (e.key === 'Enter') {
      handleAddItem(category);
    }
  };

  const handleToggleDone = async (item: ChecklistItem) => {
    await updateChecklistItem(item.id, { done: !item.done });
  };

  const handleDelete = async (itemId: string) => {
    await deleteChecklistItem(itemId);
  };

  return (
    <div className="min-h-screen bg-[#FFE5EC] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEFAULT_CATEGORIES.map((category) => {
            const items = groupedItems[category] || [];
            const doneCount = items.filter(item => item.done).length;
            const totalCount = items.length;

            return (
              <div
                key={category}
                className="bg-[#ffe0f0] rounded-lg shadow-md p-4 space-y-3 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">{category}</h2>
                  <span className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded-full">
                    {doneCount} of {totalCount} done
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between group bg-white/50 rounded-md p-2 hover:bg-white/70 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDone(item)}
                          className="h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                        />
                        <span
                          className={`text-sm ${
                            item.done
                              ? 'line-through text-green-600'
                              : 'text-gray-700 group-hover:font-medium'
                          }`}
                        >
                          {item.description}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newItems[category] || ''}
                    onChange={(e) =>
                      setNewItems((prev) => ({ ...prev, [category]: e.target.value }))
                    }
                    onKeyPress={(e) => handleKeyPress(e, category)}
                    placeholder="Add new item..."
                    className="flex-1 text-sm bg-white/50 border-0 rounded-md shadow-sm focus:ring-2 focus:ring-pink-500 focus:bg-white"
                  />
                  <button
                    onClick={() => handleAddItem(category)}
                    className="p-1 text-pink-600 hover:text-pink-700 bg-white/50 rounded-md hover:bg-white/70 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 