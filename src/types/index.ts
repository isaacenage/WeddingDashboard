export interface User {
  uid: string;
  email: string;
}

export interface WeddingSetup {
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingVenue: string;
  currency: string;
  guestTags: string[];
  accommodations: string[];
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvp: 'Attending' | "Won't Attend" | 'No Response';
  invitation: 'Sent' | 'Not Sent';
  transport: 'Van Rental' | 'Own Mode' | '';
  accommodation?: string;
  tags: string[];
}

export interface Task {
  id: string;
  task: string;
  completed: boolean;
  dueDate: string;
  assignedTo: string;
  notes: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  paid: number;
  dueDate: string;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  contact: string;
  email: string;
  amount: number;
  paid: number;
  dueDate: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
}

export interface BudgetContribution {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetExpense {
  id: string;
  date: string;
  vendorType: string;
  vendor: string;
  paidBy: 'Andrea' | 'Isaac' | 'Both';
  contract: number;
  paid: number;
  notes?: string;
} 