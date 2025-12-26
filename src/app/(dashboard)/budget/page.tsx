'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVendors, getSelectedVendors } from '@/lib/firebase/vendors';
import {
  getBudgetExpenses,
  addBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
  getBudgetContributions,
  addBudgetContribution,
  updateBudgetContribution,
  BudgetExpense,
  BudgetContribution
} from '@/lib/firebase/budget';
import { Vendor } from '@/types/vendor';
import { FaTrash, FaPencilAlt, FaSave } from 'react-icons/fa';

export default function BudgetPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [contributions, setContributions] = useState<BudgetContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorType, setSelectedVendorType] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string[]>>({});
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editedExpense, setEditedExpense] = useState<{
    amount: string;
    date: string;
    paidBy: 'Andrea' | 'Isaac';
    notes: string;
  }>({
    amount: '',
    date: '',
    paidBy: 'Andrea',
    notes: ''
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

  const handleEditExpense = (expense: BudgetExpense) => {
    setEditingExpenseId(expense.id);
    setEditedExpense({
      amount: expense.amount.toString(),
      date: expense.date,
      paidBy: expense.paidBy,
      notes: expense.notes || ''
    });
  };

  const handleSaveExpense = async (id: string) => {
    if (!user?.uid) return;
    try {
      await updateBudgetExpense(user.uid, id, {
        amount: parseFloat(editedExpense.amount),
        date: editedExpense.date,
        paidBy: editedExpense.paidBy,
        notes: editedExpense.notes
      });
      setEditingExpenseId(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditedExpense({
      amount: '',
      date: '',
      paidBy: 'Andrea',
      notes: ''
    });
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
    // Get unique vendor IDs from expenses (avoid counting duplicate vendors)
    const uniqueVendorIds = new Set(expenses.map(expense => expense.vendor));

    // Sum contract prices for unique vendors only (each vendor counted once)
    const totalContractPrice = Array.from(uniqueVendorIds).reduce((sum, vendorId) => {
      const vendor = vendors.find(v => v.id === vendorId);
      return sum + (vendor?.contractPrice || 0);
    }, 0);

    // Total Amount Paid in Budget Page
    const totalPaid = calculateTotalPaid();

    return Math.max(0, totalContractPrice - totalPaid);
  };

  const calculateBudgetLeft = () => {
    return calculateTotalBudget() - calculateTotalPaid();
  };

  const calculateActualRemaining = () => {
    return calculateBudgetLeft() - calculateLeftToPay();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 flex flex-col justify-between h-full">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2 h-12 flex items-center">Wedding Budget</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateTotalBudget().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 flex flex-col justify-between h-full">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2 h-12 flex items-center">Total Paid</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateTotalPaid().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 flex flex-col justify-between h-full">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2 h-12 flex items-center">Left to Pay</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateLeftToPay().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 flex flex-col justify-between h-full">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2 h-12 flex items-center">Budget Left</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateBudgetLeft().toLocaleString()}
            </p>
          </div>
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 flex flex-col justify-between h-full">
            <h3 className="text-base sm:text-lg font-semibold text-[#EC4899] mb-2 h-12 flex items-center">Actual Remaining</h3>
            <p className="text-xl sm:text-2xl font-bold text-[#4a1d39]">
              ₱{calculateActualRemaining().toLocaleString()}
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
                  <th className="px-3 sm:px-4 py-2 text-center text-xs sm:text-sm font-bold text-pink-900">Date Paid</th>
                  <th className="px-3 sm:px-4 py-2 text-center text-xs sm:text-sm font-bold text-pink-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {(() => {
                  // Group expenses by vendor, then sort by earliest payment date
                  const sortedExpenses = (() => {
                    // Group expenses by vendor
                    const vendorGroups = expenses.reduce((groups, expense) => {
                      if (!groups[expense.vendor]) {
                        groups[expense.vendor] = [];
                      }
                      groups[expense.vendor].push(expense);
                      return groups;
                    }, {} as Record<string, BudgetExpense[]>);

                    // For each vendor group, sort by date and get earliest date
                    const sortedVendorGroups = Object.entries(vendorGroups).map(([vendorId, vendorExpenses]) => {
                      // Sort this vendor's expenses by date
                      const sorted = vendorExpenses.sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                      );
                      return {
                        vendorId,
                        expenses: sorted,
                        earliestDate: new Date(sorted[0].date).getTime()
                      };
                    });

                    // Sort vendor groups by their earliest date
                    sortedVendorGroups.sort((a, b) => a.earliestDate - b.earliestDate);

                    // Flatten back into a single array
                    return sortedVendorGroups.flatMap(group => group.expenses);
                  })();

                  // Track which vendor we're on for grouping
                  let currentVendor = '';
                  let vendorPaymentIndex = 0;

                  return sortedExpenses.map((expense, index) => {
                    const vendor = vendors.find(v => v.id === expense.vendor);
                    const vendorContract = vendor?.contractPrice || 0;

                    // Check if this is a new vendor or continuation
                    const isNewVendor = expense.vendor !== currentVendor;
                    if (isNewVendor) {
                      currentVendor = expense.vendor;
                      vendorPaymentIndex = 0;
                    } else {
                      vendorPaymentIndex++;
                    }

                    // Calculate cumulative paid amount up to and including this payment
                    // Get all payments for this vendor sorted by date
                    const vendorPayments = sortedExpenses
                      .filter(e => e.vendor === expense.vendor)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    // Find the index of current expense in the sorted vendor payments
                    const currentPaymentIndex = vendorPayments.findIndex(e => e.id === expense.id);

                    // Sum all payments up to and including current payment
                    const cumulativePaid = vendorPayments
                      .slice(0, currentPaymentIndex + 1)
                      .reduce((sum, e) => sum + e.amount, 0);

                    const remaining = Math.max(0, vendorContract - cumulativePaid);

                    const isEditing = editingExpenseId === expense.id;

                    return (
                      <tr key={expense.id} className={`${index % 2 === 0 ? 'bg-pink-50' : 'bg-pink-100'} hover:bg-white/30 transition-colors`}>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{expense.vendorType}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">
                          <div className={!isNewVendor ? 'pl-6 relative' : ''}>
                            {!isNewVendor && <span className="absolute left-0 text-[#EC4899]/50">└─</span>}
                            {vendor?.name || 'Unknown Vendor'}
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedExpense.notes}
                                onChange={(e) => setEditedExpense(prev => ({ ...prev, notes: e.target.value }))}
                                className="block w-full mt-1 text-xs p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                                placeholder="Notes"
                              />
                            ) : (
                              expense.notes && (
                                <span className="block text-xs text-[#EC4899]/70 mt-1">{expense.notes}</span>
                              )
                            )}
                          </div>
                        </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        ₱{vendorContract.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedExpense.amount}
                            onChange={(e) => setEditedExpense(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full text-right p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                            step="0.01"
                          />
                        ) : (
                          `₱${expense.amount.toLocaleString()}`
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                        ₱{remaining.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center">
                        {isEditing ? (
                          <select
                            value={editedExpense.paidBy}
                            onChange={(e) => setEditedExpense(prev => ({ ...prev, paidBy: e.target.value as 'Andrea' | 'Isaac' }))}
                            className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                          >
                            <option value="Andrea">Andrea</option>
                            <option value="Isaac">Isaac</option>
                          </select>
                        ) : (
                          <span className={`font-medium ${expense.paidBy === 'Andrea' ? 'text-[#b10057]' : 'text-[#9c27b0]'}`}>
                            {expense.paidBy}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center text-[#4a1d39]">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editedExpense.date}
                            onChange={(e) => setEditedExpense(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                          />
                        ) : (
                          new Date(expense.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveExpense(expense.id)}
                              className="text-green-600 hover:text-green-700 transition-colors p-1"
                              title="Save"
                            >
                              <FaSave size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-[#EC4899] hover:text-pink-700 transition-colors p-1"
                              title="Edit"
                            >
                              <FaPencilAlt size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
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