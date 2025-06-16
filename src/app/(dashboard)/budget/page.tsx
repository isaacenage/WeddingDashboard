'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVendors, getSelectedVendors } from '@/lib/firebase/vendors';
import { 
  getBudgetExpenses, 
  addBudgetExpense, 
  deleteBudgetExpense,
  getBudgetContributions,
  addBudgetContribution,
  updateBudgetContribution,
  BudgetExpense,
  BudgetContribution
} from '@/lib/firebase/budget';
import { Vendor } from '@/types/vendor';

export default function BudgetPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [contributions, setContributions] = useState<BudgetContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorType, setSelectedVendorType] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});
  const [newExpense, setNewExpense] = useState<{
    vendor: string;
    vendorType: string;
    amount: string;
    date: string;
    paidBy: 'Andrea' | 'Isaac';
    notes: string;
  }>({
    vendor: '',
    vendorType: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paidBy: 'Andrea',
    notes: ''
  });
  const [newContribution, setNewContribution] = useState({
    name: '',
    amount: ''
  });

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const unsubscribeVendors = getVendors(user.uid, (vendors) => {
      setVendors(vendors);
      setLoading(false);
    });

    const unsubscribeExpenses = getBudgetExpenses(user.uid, (expenses) => {
      setExpenses(expenses);
    });

    const unsubscribeContributions = getBudgetContributions(user.uid, (contributions) => {
      setContributions(contributions);
    });

    const unsubscribeSelectedVendors = getSelectedVendors(user.uid, (selectedVendors) => {
      setSelectedVendors(selectedVendors);
    });

    return () => {
      unsubscribeVendors();
      unsubscribeExpenses();
      unsubscribeContributions();
      unsubscribeSelectedVendors();
    };
  }, [user?.uid]);

  const handleVendorTypeChange = (type: string) => {
    setSelectedVendorType(type);
    setSelectedVendor(null);
    setNewExpense(prev => ({
      ...prev,
      vendorType: type,
      vendor: '',
      amount: ''
    }));
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendor(vendor || null);
    setNewExpense(prev => ({
      ...prev,
      vendor: vendorId
    }));
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !selectedVendor) return;

    try {
      await addBudgetExpense(user.uid, {
        vendor: selectedVendor.id,
        vendorType: selectedVendor.serviceType,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        paidBy: newExpense.paidBy,
        notes: newExpense.notes
      });

      // Reset form
      setNewExpense({
        vendor: '',
        vendorType: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paidBy: 'Andrea',
        notes: ''
      });
      setSelectedVendor(null);
      setSelectedVendorType('');
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      await addBudgetContribution(user.uid, {
        name: newContribution.name,
        amount: parseFloat(newContribution.amount)
      });

      // Reset form
      setNewContribution({
        name: '',
        amount: ''
      });
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  const handleContributionUpdate = async (id: string, amount: number) => {
    if (!user?.uid) return;
    try {
      await updateBudgetContribution(user.uid, id, amount);
    } catch (error) {
      console.error('Error updating contribution:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteBudgetExpense(user.uid, id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getVendorTypes = () => {
    return [...new Set(vendors.map(v => v.serviceType))].sort();
  };

  const getVendorsByType = (type: string) => {
    return vendors.filter(v => v.serviceType === type);
  };

  const calculateTotalBudget = () => {
    return contributions.reduce((total, contribution) => total + contribution.amount, 0);
  };

  const calculateTotalPaid = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const calculateLeftToPay = () => {
    const vendorTotals = new Map<string, number>();
    
    // Sum all payments per vendor
    expenses.forEach(expense => {
      const current = vendorTotals.get(expense.vendor) || 0;
      vendorTotals.set(expense.vendor, current + expense.amount);
    });

    // Calculate remaining for each selected vendor
    let totalLeft = 0;
    vendors.forEach(vendor => {
      if (selectedVendors[vendor.serviceType] === vendor.id) {
        const paid = vendorTotals.get(vendor.id) || 0;
        totalLeft += Math.max(0, vendor.contractPrice - paid);
      }
    });

    return totalLeft;
  };

  const calculateBudgetLeft = () => {
    return calculateTotalBudget() - calculateTotalPaid();
  };

  const calculatePersonalBreakdown = (person: 'Andrea' | 'Isaac') => {
    const promised = contributions.find(c => c.name === person)?.amount || 0;
    const spent = expenses
      .filter(e => e.paidBy === person)
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = promised - spent;

    return { promised, spent, remaining };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE5EC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2">Wedding Budget</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateTotalBudget().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2">Total Paid</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateTotalPaid().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2">Left to Pay</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateLeftToPay().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2">Budget Left</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateBudgetLeft().toLocaleString()}
            </p>
          </div>
        </div>

        {/* Personal Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {(['Andrea', 'Isaac'] as const).map(person => {
            const { promised, spent, remaining } = calculatePersonalBreakdown(person);
            return (
              <div key={person} className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-[#EC4899] mb-4">{person}</h3>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-[#4a1d39]">
                    Promised: <span className="font-semibold">₱{promised.toLocaleString()}</span>
                  </p>
                  <p className="text-sm sm:text-base text-[#4a1d39]">
                    Spent: <span className="font-semibold">₱{spent.toLocaleString()}</span>
                  </p>
                  <p className="text-sm sm:text-base text-[#4a1d39]">
                    Remaining: <span className="font-semibold">₱{remaining.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contributions Section */}
        <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Budget Contributions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Name</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-medium text-[#EC4899]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {contributions.map(contribution => (
                  <tr key={contribution.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{contribution.name}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                      <input
                        type="number"
                        value={contribution.amount}
                        onChange={(e) => handleContributionUpdate(contribution.id, parseFloat(e.target.value))}
                        className="w-full sm:w-32 text-right p-1.5 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-[#4a1d39] placeholder-[#EC4899]/70"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Contribution Form */}
          <form onSubmit={handleContributionSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newContribution.name}
              onChange={(e) => setNewContribution(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="flex-1 p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              required
            />
            <input
              type="number"
              value={newContribution.amount}
              onChange={(e) => setNewContribution(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className="w-full sm:w-32 p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              required
              min="0"
              step="0.01"
            />
            <button
              type="submit"
              className="bg-[#EC4899] text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
            >
              Add
            </button>
          </form>
        </div>

        {/* Expenses Table */}
        <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Expenses</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#ffcce4]">
                  <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold text-pink-900">Vendor Type</th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold text-pink-900">Description</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-bold text-pink-900">Amount</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-bold text-pink-900">Paid</th>
                  <th className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm font-bold text-pink-900">Remaining</th>
                  <th className="px-3 sm:px-4 py-2 text-center text-xs sm:text-sm font-bold text-pink-900">Paid By</th>
                  <th className="px-3 sm:px-4 py-2 text-center text-xs sm:text-sm font-bold text-pink-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {expenses.map((expense, index) => {
                  const vendor = vendors.find(v => v.id === expense.vendor);
                  const vendorContract = vendor?.contractPrice || 0;
                  const remaining = Math.max(0, vendorContract - expense.amount);
                  
                  return (
                    <tr key={expense.id} className={`${index % 2 === 0 ? 'bg-pink-50' : 'bg-pink-100'} hover:bg-white/30 transition-colors`}>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{expense.vendorType}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">
                        {vendor?.name || 'Unknown Vendor'}
                        {expense.notes && (
                          <span className="block text-xs text-[#EC4899]/70 mt-1">{expense.notes}</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        ₱{vendorContract.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        ₱{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        ₱{remaining.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center">
                        <span className={`font-medium ${expense.paidBy === 'Andrea' ? 'text-[#b10057]' : 'text-[#9c27b0]'}`}>
                          {expense.paidBy}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center">
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-[#EC4899] hover:text-pink-700 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Form */}
        <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Add Expense</h2>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Vendor Type</label>
                <select
                  value={selectedVendorType}
                  onChange={(e) => handleVendorTypeChange(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
                  required
                >
                  <option value="" className="text-[#EC4899]/70">Select Type</option>
                  {getVendorTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Vendor</label>
                <select
                  value={selectedVendor?.id || ''}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
                  required
                  disabled={!selectedVendorType}
                >
                  <option value="" className="text-[#EC4899]/70">Select Vendor</option>
                  {getVendorsByType(selectedVendorType).map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Amount</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
                  required
                />
              </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Paid By</label>
                <select
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, paidBy: e.target.value as 'Andrea' | 'Isaac' }))}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
                  required
                >
                  <option value="Andrea">Andrea</option>
                  <option value="Isaac">Isaac</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Notes</label>
                <input
                  type="text"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#EC4899] text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
            >
              Add Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 