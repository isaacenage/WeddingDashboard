'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Vendor } from '@/types/vendor';
import { selectVendor } from '@/lib/firebase/vendors';
import { getBudgetExpenses, BudgetExpense } from '@/lib/firebase/budget';

interface VendorGroupProps {
  group: {
    serviceType: string;
    vendors: Vendor[];
  };
  selectedVendors: Record<string, string[]>;
}

export default function VendorGroup({ group, selectedVendors }: VendorGroupProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Get valid vendor IDs only (filter out orphaned IDs)
  const validVendorIds = group.vendors.map(v => v.id);
  const validSelectedVendorIds = selectedVendors[group.serviceType]?.filter(id =>
    validVendorIds.includes(id)
  ) || [];

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getBudgetExpenses(user.uid, (expenses) => {
      setExpenses(expenses);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getVendorProgress = (vendor: Vendor) => {
    const totalPaid = expenses
      .filter(expense => expense.vendor === vendor.id)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const progress = totalPaid / vendor.contractPrice;
    const percentage = Math.min(progress * 100, 100);

    let color = 'bg-red-500';
    if (percentage >= 100) {
      color = 'bg-green-500';
    } else if (percentage >= 50) {
      color = 'bg-orange-500';
    }

    return {
      percentage,
      color,
      totalPaid
    };
  };

  const handleVendorSelect = async (vendor: Vendor) => {
    if (!user?.uid || isSelecting) return;

    try {
      setIsSelecting(true);
      // Save to Firebase - the listener will update local state automatically
      await selectVendor(user.uid, group.serviceType, vendor.id);
    } catch (error) {
      console.error('Error selecting vendor:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <div
        className="bg-[#fbcfe8] p-4 sm:p-6 rounded-t-2xl flex justify-between items-center cursor-pointer shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-semibold text-[#4a1d39]">{group.serviceType}</h3>
          {validSelectedVendorIds.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {validSelectedVendorIds.length} selected
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-[#4a1d39] transform transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[9999px]'}`}
      >
        <div className="bg-[#ffe5ec]/90 rounded-b-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {group.vendors.map(vendor => {
              const { percentage, color, totalPaid } = getVendorProgress(vendor);
              const isSelected = validSelectedVendorIds.includes(vendor.id);

              return (
                <div
                  key={vendor.id}
                  className="card relative w-full h-full flex flex-col justify-between transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl bg-white overflow-hidden"
                >
                  <button
                    onClick={() => handleVendorSelect(vendor)}
                    disabled={isSelecting}
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full shadow-md transition z-10 ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'bg-green-200 text-green-800' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>

                  <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#fcb6cc] to-[#f48fb1]">
                    <div className="absolute top-0 left-0 w-full px-3 pt-3 pb-2 z-[5] pr-16">
                      <div className="text-white font-bold text-sm line-clamp-1">
                        {vendor.name}
                      </div>
                      {vendor.packageName && (
                        <div className="text-white/90 font-medium text-xs mt-0.5 line-clamp-1">
                          {vendor.packageName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-3 bg-white">
                    <div className="text-xs text-gray-700 space-y-1.5">
                      {vendor.email && (
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-[#EC4899] min-w-fit">Email:</span>
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.contactNumber && (
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-[#EC4899] min-w-fit">Contact:</span>
                          <span className="truncate">{vendor.contactNumber}</span>
                        </div>
                      )}
                      {vendor.contractPrice > 0 && (
                        <div className="flex items-start gap-1">
                          <span className="font-semibold text-[#EC4899] min-w-fit">Price:</span>
                          <span className="truncate">₱{vendor.contractPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-700">
                      <span className="font-semibold">Payment Progress</span>
                      <span className="font-bold text-[#EC4899]">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Paid: ₱{totalPaid.toLocaleString()}</span>
                      <span>Left: ₱{(vendor.contractPrice - totalPaid).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 