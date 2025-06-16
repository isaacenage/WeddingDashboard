import { ref, onValue, push, set, update } from 'firebase/database';
import { db } from './config';

export interface BudgetContribution {
  id: string;
  name: string;
  amount: number;
}

export interface BudgetExpense {
  id: string;
  vendor: string;
  vendorType: string;
  amount: number;
  date: string;
  paidBy: 'Andrea' | 'Isaac';
  notes?: string;
}

// Contributions
export const getBudgetContributions = (uid: string, callback: (contributions: BudgetContribution[]) => void) => {
  const contributionsRef = ref(db, `budgetContributions/${uid}`);
  
  return onValue(contributionsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const contributions = Object.entries(data).map(([id, contribution]: [string, any]) => ({
      id,
      name: contribution.name,
      amount: contribution.amount || 0
    }));

    callback(contributions);
  });
};

export const addBudgetContribution = async (uid: string, contribution: Omit<BudgetContribution, 'id'>) => {
  const contributionsRef = ref(db, `budgetContributions/${uid}`);
  const newContributionRef = push(contributionsRef);
  
  await set(newContributionRef, {
    name: contribution.name,
    amount: contribution.amount
  });
};

export const updateBudgetContribution = async (uid: string, contributionId: string, amount: number) => {
  const contributionRef = ref(db, `budgetContributions/${uid}/${contributionId}`);
  await update(contributionRef, { amount });
};

// Expenses
export const getBudgetExpenses = (uid: string, callback: (expenses: BudgetExpense[]) => void) => {
  const expensesRef = ref(db, `budgetExpenses/${uid}`);
  
  return onValue(expensesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const expenses = Object.entries(data).map(([id, expense]: [string, any]) => ({
      id,
      vendor: expense.vendor,
      vendorType: expense.vendorType,
      amount: expense.amount || 0,
      date: expense.date,
      paidBy: expense.paidBy,
      notes: expense.notes || ''
    }));

    callback(expenses);
  });
};

export const addBudgetExpense = async (uid: string, expense: Omit<BudgetExpense, 'id'>) => {
  const expensesRef = ref(db, `budgetExpenses/${uid}`);
  const newExpenseRef = push(expensesRef);
  
  await set(newExpenseRef, {
    vendor: expense.vendor,
    vendorType: expense.vendorType,
    amount: expense.amount,
    date: expense.date,
    paidBy: expense.paidBy,
    notes: expense.notes
  });
};

export const deleteBudgetExpense = async (uid: string, expenseId: string) => {
  const expenseRef = ref(db, `budgetExpenses/${uid}/${expenseId}`);
  await set(expenseRef, null);
}; 