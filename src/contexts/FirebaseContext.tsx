'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import {
  Guest,
  Vendor,
  Task,
  ChecklistItem,
  BudgetContribution,
  BudgetExpense,
  SetupData
} from '@/types/firebase';

interface FirebaseContextType {
  // Setup Data
  setup: SetupData;
  updateGuestTags: (tags: string[]) => Promise<void>;
  updateAccommodations: (accommodations: string[]) => Promise<void>;

  // Guests
  guests: Guest[];
  addGuest: (guest: Omit<Guest, 'id'>) => Promise<void>;
  updateGuest: (id: string, guest: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;

  // Vendors
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  updateVendor: (id: string, vendor: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Checklist
  checklistItems: ChecklistItem[];
  addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => Promise<void>;
  updateChecklistItem: (id: string, item: Partial<ChecklistItem>) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;

  // Budget
  contributions: BudgetContribution[];
  expenses: BudgetExpense[];
  addContribution: (contribution: Omit<BudgetContribution, 'id'>) => Promise<void>;
  updateContribution: (id: string, contribution: Partial<BudgetContribution>) => Promise<void>;
  deleteContribution: (id: string) => Promise<void>;
  addExpense: (expense: Omit<BudgetExpense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<BudgetExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [setup, setSetup] = useState<SetupData>({
    guestTags: [],
    accommodations: [],
    groomName: '',
    brideName: '',
    weddingDate: '',
    weddingVenue: '',
    currency: '₱'
  });
  const [guests, setGuests] = useState<Guest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [contributions, setContributions] = useState<BudgetContribution[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);

  useEffect(() => {
    if (!user) return;

    // Setup data listener
    const setupRef = ref(db, `setup/${user.uid}`);
    const setupUnsubscribe = onValue(setupRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSetup({
        guestTags: data.guestTags || [],
        accommodations: data.accommodations || [],
        groomName: data.groomName || '',
        brideName: data.brideName || '',
        weddingDate: data.weddingDate || '',
        weddingVenue: data.weddingVenue || '',
        currency: data.currency || '₱'
      });
    });

    // Guests listener
    const guestsRef = ref(db, `guests/${user.uid}`);
    const guestsUnsubscribe = onValue(guestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGuests(Object.entries(data).map(([id, guest]: [string, any]) => ({
        id,
        ...guest,
        tags: guest.tags || [],
        rsvp: guest.rsvp || 'No Response',
        invitation: guest.invitation || 'Not Sent',
        transport: guest.transport || 'Not Set'
      })));
    });

    // Vendors listener
    const vendorsRef = ref(db, `vendors/${user.uid}`);
    const vendorsUnsubscribe = onValue(vendorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setVendors(Object.entries(data).map(([id, vendor]: [string, any]) => ({
        id,
        ...vendor,
        type: vendor.type || '',
        name: vendor.name || '',
        contact: vendor.contact || '',
        email: vendor.email || '',
        package: vendor.package || '',
        price: vendor.price || 0,
        final: vendor.final || false
      })));
    });

    // Tasks listener (Timeline)
    const tasksRef = ref(db, `checklist/${user.uid}`);
    const tasksUnsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTasks(Object.entries(data).map(([id, task]: [string, any]) => ({
        id,
        ...task,
        date: task.date || '',
        description: task.description || '',
        owner: task.owner || 'Isaac',
        priority: task.priority || 'Medium',
        completed: task.completed || false
      })));
    });

    // Checklist items listener
    const checklistRef = ref(db, `checklistItems/${user.uid}`);
    const checklistUnsubscribe = onValue(checklistRef, (snapshot) => {
      const data = snapshot.val() || {};
      setChecklistItems(Object.entries(data).map(([id, item]: [string, any]) => ({
        id,
        ...item,
        name: item.name || '',
        done: item.done || false,
        category: item.category || 'Others'
      })));
    });

    // Budget listeners
    const contributionsRef = ref(db, `budgetContributions/${user.uid}`);
    const contributionsUnsubscribe = onValue(contributionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setContributions(Object.entries(data).map(([id, contribution]: [string, any]) => ({
        id,
        ...contribution,
        name: contribution.name || '',
        amount: contribution.amount || 0
      })));
    });

    const expensesRef = ref(db, `budgetExpenses/${user.uid}`);
    const expensesUnsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setExpenses(Object.entries(data).map(([id, expense]: [string, any]) => ({
        id,
        ...expense,
        date: expense.date || '',
        vendorType: expense.vendorType || '',
        vendor: expense.vendor || '',
        paidBy: expense.paidBy || 'Isaac',
        contract: expense.contract || 0,
        paid: expense.paid || 0
      })));
    });

    return () => {
      setupUnsubscribe();
      guestsUnsubscribe();
      vendorsUnsubscribe();
      tasksUnsubscribe();
      checklistUnsubscribe();
      contributionsUnsubscribe();
      expensesUnsubscribe();
    };
  }, [user]);

  // Setup functions
  const updateGuestTags = async (tags: string[]) => {
    if (!user) return;
    await set(ref(db, `setup/${user.uid}/guestTags`), tags);
  };

  const updateAccommodations = async (accommodations: string[]) => {
    if (!user) return;
    // Ensure we're saving a de-duplicated array
    const uniqueAccommodations = Array.from(new Set(accommodations));
    await set(ref(db, `setup/${user.uid}/accommodations`), uniqueAccommodations);
  };

  // Guest functions
  const addGuest = async (guest: Omit<Guest, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `guests/${user.uid}`));
    await set(newRef, guest);
  };

  const updateGuest = async (id: string, guest: Partial<Guest>) => {
    if (!user) return;
    await update(ref(db, `guests/${user.uid}/${id}`), guest);
  };

  const deleteGuest = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `guests/${user.uid}/${id}`));
  };

  // Vendor functions
  const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `vendors/${user.uid}`));
    await set(newRef, vendor);
  };

  const updateVendor = async (id: string, vendor: Partial<Vendor>) => {
    if (!user) return;
    await update(ref(db, `vendors/${user.uid}/${id}`), vendor);
  };

  const deleteVendor = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `vendors/${user.uid}/${id}`));
  };

  // Task functions
  const addTask = async (task: Omit<Task, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `checklist/${user.uid}`));
    await set(newRef, task);
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    if (!user) return;
    await update(ref(db, `checklist/${user.uid}/${id}`), task);
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `checklist/${user.uid}/${id}`));
  };

  // Checklist functions
  const addChecklistItem = async (item: Omit<ChecklistItem, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `checklistItems/${user.uid}`));
    await set(newRef, item);
  };

  const updateChecklistItem = async (id: string, item: Partial<ChecklistItem>) => {
    if (!user) return;
    await update(ref(db, `checklistItems/${user.uid}/${id}`), item);
  };

  const deleteChecklistItem = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `checklistItems/${user.uid}/${id}`));
  };

  // Budget functions
  const addContribution = async (contribution: Omit<BudgetContribution, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `budgetContributions/${user.uid}`));
    await set(newRef, contribution);
  };

  const updateContribution = async (id: string, contribution: Partial<BudgetContribution>) => {
    if (!user) return;
    await update(ref(db, `budgetContributions/${user.uid}/${id}`), contribution);
  };

  const deleteContribution = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `budgetContributions/${user.uid}/${id}`));
  };

  const addExpense = async (expense: Omit<BudgetExpense, 'id'>) => {
    if (!user) return;
    const newRef = push(ref(db, `budgetExpenses/${user.uid}`));
    await set(newRef, expense);
  };

  const updateExpense = async (id: string, expense: Partial<BudgetExpense>) => {
    if (!user) return;
    await update(ref(db, `budgetExpenses/${user.uid}/${id}`), expense);
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `budgetExpenses/${user.uid}/${id}`));
  };

  return (
    <FirebaseContext.Provider
      value={{
        setup,
        updateGuestTags,
        updateAccommodations,
        guests,
        addGuest,
        updateGuest,
        deleteGuest,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        checklistItems,
        addChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        contributions,
        expenses,
        addContribution,
        updateContribution,
        deleteContribution,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
} 