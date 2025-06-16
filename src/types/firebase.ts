export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags: string[];
  accommodation?: string;
  transport?: string;
  rsvp: 'Attending' | "Won't Attend" | 'No Response';
  invitation: 'Sent' | 'Not Sent';
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  contact: string;
  email?: string;
  phone?: string;
  selected: boolean;
  notes?: string;
}

export interface Task {
  id: string;
  date: string;
  description: string;
  owner: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  done: boolean;
}

export interface BudgetContribution {
  id: string;
  contributor: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface BudgetExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  paid: boolean;
  notes?: string;
}

export interface SetupData {
  guestTags: string[];
  accommodations: string[];
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  currency: string;
} 