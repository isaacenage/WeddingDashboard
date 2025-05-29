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
    const newAccommodations = [...setup.accommodations, newAccommodation.trim()];
    setSetup({ ...setup, accommodations: newAccommodations });
    if (user) {
      set(ref(db, `setup/${user.uid}/accommodations`), newAccommodations);
    }
    setNewAccommodation('');
  };

  const handleRemoveAccommodation = (accommodationToRemove: string) => {
    const newAccommodations = setup.accommodations.filter(acc => acc !== accommodationToRemove);
    setSetup({ ...setup, accommodations: newAccommodations });
    if (user) {
      set(ref(db, `setup/${user.uid}/accommodations`), newAccommodations);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Groom's Name</label>
              <input
                type="text"
                value={setup.groomName}
                onChange={(e) => handleInputChange('groomName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bride's Name</label>
              <input
                type="text"
                value={setup.brideName}
                onChange={(e) => handleInputChange('brideName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Wedding Date</label>
              <input
                type="date"
                value={setup.weddingDate}
                onChange={(e) => handleInputChange('weddingDate', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Wedding Venue</label>
              <input
                type="text"
                value={setup.weddingVenue}
                onChange={(e) => handleInputChange('weddingVenue', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <input
                type="text"
                value={setup.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Tags and Accommodations */}
          <div className="space-y-6">
            {/* Guest Tags */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Guest Tags</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a new tag"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {setup.guestTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-pink-600 hover:text-pink-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Accommodations */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Accommodations</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newAccommodation}
                  onChange={(e) => setNewAccommodation(e.target.value)}
                  placeholder="Add a new accommodation"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAccommodation()}
                />
                <button
                  onClick={handleAddAccommodation}
                  className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {setup.accommodations.map((acc) => (
                  <span
                    key={acc}
                    className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {acc}
                    <button
                      onClick={() => handleRemoveAccommodation(acc)}
                      className="text-pink-600 hover:text-pink-800"
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
    </ProtectedRoute>
  );
} 