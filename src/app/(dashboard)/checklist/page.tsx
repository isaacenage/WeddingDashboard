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
    <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {DEFAULT_CATEGORIES.map((category) => {
            const items = groupedItems[category] || [];
            const doneCount = items.filter(item => item.done).length;
            const totalCount = items.length;

            return (
              <div
                key={category}
                className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#EC4899]">{category}</h2>
                  <span className="text-sm text-[#4a1d39] bg-white/50 px-2 py-1 rounded-full">
                    {doneCount} of {totalCount} done
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between group bg-white/50 rounded-lg p-2 hover:bg-white/70 transition-colors"
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleToggleDone(item)}
                          className="h-4 w-4 text-[#EC4899] rounded border-[#EC4899]/30 focus:ring-[#EC4899]"
                        />
                        <span
                          className={`text-sm ${
                            item.done
                              ? 'line-through text-[#4a1d39]/50'
                              : 'text-[#4a1d39] group-hover:font-medium'
                          }`}
                        >
                          {item.description}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#EC4899] hover:text-pink-700 transition-opacity"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItems[category] || ''}
                    onChange={(e) =>
                      setNewItems((prev) => ({ ...prev, [category]: e.target.value }))
                    }
                    onKeyPress={(e) => handleKeyPress(e, category)}
                    placeholder="Add new item..."
                    className="flex-1 text-sm bg-white/50 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-[#4a1d39] placeholder-[#EC4899]/70 p-2"
                  />
                  <button
                    onClick={() => handleAddItem(category)}
                    className="p-2 text-[#EC4899] hover:text-pink-700 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
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