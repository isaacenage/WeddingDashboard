'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Vendor } from '@/types/vendor';
import { selectVendor, unselectVendor } from '@/lib/firebase/vendors';
import { getBudgetExpenses, BudgetExpense } from '@/lib/firebase/budget';

interface VendorGroupProps {
  group: {
    serviceType: string;
    vendors: Vendor[];
  };
  selectedVendors: Record<string, string[]>;
  onVendorSelect: (serviceType: string, vendorId: string) => void;
}

export default function VendorGroup({ group, selectedVendors, onVendorSelect }: VendorGroupProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

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
      await selectVendor(user.uid, group.serviceType, vendor.id);
      onVendorSelect(group.serviceType, vendor.id);
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
          {selectedVendors[group.serviceType]?.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {selectedVendors[group.serviceType].length} selected
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
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[9999px] overflow-y-auto'}`}
      >
        <div className="bg-[#ffe5ec]/90 rounded-b-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {group.vendors.map(vendor => {
          const { percentage, color, totalPaid } = getVendorProgress(vendor);
          const isSelected = selectedVendors[group.serviceType]?.includes(vendor.id) || false;
          
          return (
                <div
                  key={vendor.id}
                  className="card relative w-full sm:w-[300px] md:w-[320px] lg:w-[350px] min-h-[500px] flex flex-col justify-between transition-all duration-300 rounded-bl-xl rounded-tr-3xl shadow-[0px_15px_20px_-5px_rgba(0,0,0,0.5)]"
                  style={{ transform: 'scale(1)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                <button
                  onClick={() => handleVendorSelect(vendor)}
                  disabled={isSelecting}
                    className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full shadow transition z-10 ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? 'bg-green-200 text-green-800' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
                  >
                    {isSelected ? 'Selected' : 'Select Vendor'}
                  </button>

                  <div className="relative rounded-bl-xl rounded-tr-3xl h-[180px] overflow-hidden">
                    <div
                      className="img bg-[#fcb6cc] w-full h-full transition-all duration-300"
                      style={{ transform: 'scale(1)' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    ></div>
                    <div className="absolute top-0 left-0 w-full px-4 pt-4 pb-3 z-[5] pr-20">
                      <div className="text-[#b10057] font-bold text-base sm:text-lg break-words">
                        {vendor.name}
                      </div>
                      {vendor.packageName && (
                        <div className="text-[#cc5b94] font-medium text-xs sm:text-sm mt-1 break-words">
                          {vendor.packageName}
                        </div>
                  )}
                    </div>
              </div>
              
                  <div className="description text-left p-4 w-full backdrop-filter backdrop-blur-sm bg-black bg-opacity-30 text-white transition-all duration-500 ease-in-out overflow-visible rounded-b-xl flex-1">
                    <div className="text-xs sm:text-sm text-white whitespace-normal leading-tight break-words space-y-1">
                      {vendor.email && <div>Email: {vendor.email}</div>}
                      {vendor.contactNumber && <div>Contact: {vendor.contactNumber}</div>}
                      {vendor.contractPrice > 0 && <div>Contract Price: ₱{vendor.contractPrice.toLocaleString()}</div>}
                    </div>
              </div>

                  <div className="space-y-2 mt-4 p-4">
                    <div className="flex justify-between text-xs sm:text-sm text-[#4a1d39]">
                  <span>Payment Progress</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                    <div className="flex justify-between text-xs sm:text-sm text-[#4a1d39]">
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