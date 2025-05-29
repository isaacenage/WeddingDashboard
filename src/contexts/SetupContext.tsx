'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';

interface SetupData {
  guestTags: string[];
  accommodations: string[];
}

interface SetupContextType {
  guestTags: string[];
  accommodations: string[];
  updateGuestTags: (tags: string[]) => Promise<void>;
  updateAccommodations: (accommodations: string[]) => Promise<void>;
}

const SetupContext = createContext<SetupContextType | null>(null);

export function SetupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [guestTags, setGuestTags] = useState<string[]>([]);
  const [accommodations, setAccommodations] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Listen for setup data changes
    const setupRef = ref(db, `setup/${user.uid}`);
    const unsubscribe = onValue(setupRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGuestTags(data.guestTags || []);
      setAccommodations(data.accommodations || []);
    });

    return () => unsubscribe();
  }, [user]);

  const updateGuestTags = async (tags: string[]) => {
    if (!user) return;
    await set(ref(db, `setup/${user.uid}/guestTags`), tags);
  };

  const updateAccommodations = async (accommodations: string[]) => {
    if (!user) return;
    await set(ref(db, `setup/${user.uid}/accommodations`), accommodations);
  };

  return (
    <SetupContext.Provider
      value={{
        guestTags,
        accommodations,
        updateGuestTags,
        updateAccommodations,
      }}
    >
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup() {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within a SetupProvider');
  }
  return context;
} 