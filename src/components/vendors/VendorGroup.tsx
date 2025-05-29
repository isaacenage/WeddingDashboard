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
  selectedVendors: Record<string, string>;
  onVendorSelect: (serviceType: string, vendorId: string) => void;
}

export default function VendorGroup({ group, selectedVendors, onVendorSelect }: VendorGroupProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

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
      if (selectedVendors[group.serviceType] === vendor.id) {
        await unselectVendor(user.uid, group.serviceType);
        onVendorSelect(group.serviceType, '');
      } else {
        await selectVendor(user.uid, group.serviceType, vendor.id);
        onVendorSelect(group.serviceType, vendor.id);
      }
    } catch (error) {
      console.error('Error selecting vendor:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">{group.serviceType}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.vendors.map(vendor => {
          const { percentage, color, totalPaid } = getVendorProgress(vendor);
          const isSelected = selectedVendors[group.serviceType] === vendor.id;
          
          return (
            <div key={vendor.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-semibold text-gray-800">{vendor.name}</h4>
                <button
                  onClick={() => handleVendorSelect(vendor)}
                  disabled={isSelecting}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
                  } ${isSelecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSelected ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Selected
                    </span>
                  ) : (
                    'Pick This Vendor'
                  )}
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-600">
                  Contract Price: <span className="font-semibold">₱{vendor.contractPrice.toLocaleString()}</span>
                </p>
                <p className="text-gray-600">
                  Contact: <span className="font-semibold">{vendor.contactNumber}</span>
                </p>
                <p className="text-gray-600">
                  Email: <span className="font-semibold">{vendor.email}</span>
                </p>
                <p className="text-gray-600">
                  Package: <span className="font-semibold">{vendor.packageName}</span>
                </p>
                {vendor.notes && (
                  <p className="text-gray-600">
                    Notes: <span className="font-semibold">{vendor.notes}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Payment Progress</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Paid: ₱{totalPaid.toLocaleString()}</span>
                  <span>Left: ₱{(vendor.contractPrice - totalPaid).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 