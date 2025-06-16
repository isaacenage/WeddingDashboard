'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, set, onValue } from 'firebase/database';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WeddingSetup } from '@/types';

const initialSetup: WeddingSetup = {
  groomName: '',
  brideName: '',
  weddingDate: '',
  weddingVenue: '',
  currency: '₱',
  guestTags: [],
  accommodations: [],
};

export default function SetupPage() {
  const { user } = useAuth();
  const [setup, setSetup] = useState<WeddingSetup>(initialSetup);
  const [newTag, setNewTag] = useState('');
  const [newAccommodation, setNewAccommodation] = useState('');

  useEffect(() => {
    if (!user) return;

    const setupRef = ref(db, `setup/${user.uid}`);
    const unsubscribe = onValue(setupRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Merge the fetched data with initial state to ensure all fields exist
        setSetup({
          ...initialSetup,
          ...data,
          guestTags: data.guestTags || [],
          accommodations: data.accommodations || [],
        });
      } else {
        // If no data exists, set the initial state
        setSetup(initialSetup);
        set(ref(db, `setup/${user.uid}`), initialSetup);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (field: keyof WeddingSetup, value: string) => {
    const newSetup = { ...setup, [field]: value };
    setSetup(newSetup);
    if (user) {
      set(ref(db, `setup/${user.uid}/${field}`), value);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const newTags = [...setup.guestTags, newTag.trim()];
    setSetup({ ...setup, guestTags: newTags });
    if (user) {
      set(ref(db, `setup/${user.uid}/guestTags`), newTags);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = setup.guestTags.filter(tag => tag !== tagToRemove);
    setSetup({ ...setup, guestTags: newTags });
    if (user) {
      set(ref(db, `setup/${user.uid}/guestTags`), newTags);
    }
  };

  const handleAddAccommodation = () => {
    if (!newAccommodation.trim()) return;
    
    // Sanitize the accommodation name by replacing invalid Firebase characters
    const sanitizedAccommodation = newAccommodation.trim()
      .replace(/\s+/g, ' '); // Normalize spaces only - no need to sanitize special chars anymore
    
    // De-duplicate the accommodations array
    const newAccommodations = Array.from(new Set([...setup.accommodations, sanitizedAccommodation]));
    
    setSetup({ ...setup, accommodations: newAccommodations });
    if (user) {
      // Save directly as an array of strings
      set(ref(db, `setup/${user.uid}/accommodations`), newAccommodations);
    }
    setNewAccommodation('');
  };

  const handleRemoveAccommodation = (accommodationToRemove: string) => {
    const newAccommodations = setup.accommodations.filter(acc => acc !== accommodationToRemove);
    setSetup({ ...setup, accommodations: newAccommodations });
    if (user) {
      // Save as an object with sanitized accommodation names as keys
      const accommodationsObj = newAccommodations.reduce((acc, accommodation) => {
        acc[accommodation] = true;
        return acc;
      }, {} as Record<string, boolean>);
      set(ref(db, `setup/${user.uid}/accommodations`), accommodationsObj);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Info */}
            <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899]">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Groom's Name</label>
                <input
                  type="text"
                  value={setup.groomName}
                  onChange={(e) => handleInputChange('groomName', e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Bride's Name</label>
                <input
                  type="text"
                  value={setup.brideName}
                  onChange={(e) => handleInputChange('brideName', e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Wedding Date</label>
                <input
                  type="date"
                  value={setup.weddingDate}
                  onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Wedding Venue</label>
                <input
                  type="text"
                  value={setup.weddingVenue}
                  onChange={(e) => handleInputChange('weddingVenue', e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Currency</label>
                <input
                  type="text"
                  value={setup.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                />
              </div>
            </div>

            {/* Tags and Accommodations */}
            <div className="space-y-4 sm:space-y-6">
              {/* Guest Tags */}
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Guest Tags</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a new tag"
                    className="flex-1 p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button
                    onClick={handleAddTag}
                    className="bg-[#EC4899] text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {setup.guestTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-white/50 text-[#4a1d39] px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-white/70 transition-colors"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#EC4899] hover:text-pink-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Accommodations */}
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Accommodations</h2>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAccommodation}
                    onChange={(e) => setNewAccommodation(e.target.value)}
                    placeholder="Add a new accommodation"
                    className="flex-1 p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAccommodation()}
                  />
                  <button
                    onClick={handleAddAccommodation}
                    className="bg-[#EC4899] text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-[#4a1d39]/70 mb-4">
                  Add accommodation types for your guests (e.g., "Catering/Styling", "Hotel Room", etc).
                </p>
                <div className="flex flex-wrap gap-2">
                  {setup.accommodations.map((acc) => (
                    <span
                      key={acc}
                      className="bg-white/50 text-[#4a1d39] px-3 py-1 rounded-full text-sm flex items-center gap-2 hover:bg-white/70 transition-colors"
                    >
                      {acc}
                      <button
                        onClick={() => handleRemoveAccommodation(acc)}
                        className="text-[#EC4899] hover:text-pink-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 