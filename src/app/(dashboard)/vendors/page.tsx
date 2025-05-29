'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVendors, getSelectedVendors, getServiceTypes, addVendor } from '@/lib/firebase/vendors';
import { Vendor, VendorFormData } from '@/types/vendor';
import VendorGroup from '@/components/vendors/VendorGroup';
import VendorSummary from '@/components/vendors/VendorSummary';

export default function VendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string>>({});
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMasterlistOpen, setIsMasterlistOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<VendorFormData>({
    name: '',
    serviceType: '',
    contactNumber: '',
    email: '',
    packageName: '',
    contractPrice: 0
  });

  // Initialize collapse states from localStorage after mount
  useEffect(() => {
    const hasSession = localStorage.getItem('hasSession');
    if (hasSession) {
      setIsMasterlistOpen(localStorage.getItem('isMasterlistOpen') === 'true');
      setIsSummaryOpen(localStorage.getItem('isSummaryOpen') === 'true');
    }
  }, []);

  // Update localStorage when collapse states change
  useEffect(() => {
    localStorage.setItem('isMasterlistOpen', isMasterlistOpen.toString());
    localStorage.setItem('isSummaryOpen', isSummaryOpen.toString());
  }, [isMasterlistOpen, isSummaryOpen]);

  // Set session flag when user logs in
  useEffect(() => {
    if (user?.uid) {
      localStorage.setItem('hasSession', 'true');
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const unsubscribeVendors = getVendors(user.uid, (vendors) => {
      setVendors(vendors);
      setLoading(false);
    });

    const unsubscribeSelectedVendors = getSelectedVendors(user.uid, (selectedVendors) => {
      setSelectedVendors(selectedVendors);
    });

    const unsubscribeServiceTypes = getServiceTypes(user.uid, (types) => {
      setServiceTypes(types);
    });

    return () => {
      unsubscribeVendors();
      unsubscribeSelectedVendors();
      unsubscribeServiceTypes();
    };
  }, [user?.uid]);

  const handleVendorSelect = (serviceType: string, vendorId: string) => {
    setSelectedVendors(prev => ({
      ...prev,
      [serviceType]: vendorId
    }));
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      await addVendor(user.uid, newVendor);
      setNewVendor({
        name: '',
        serviceType: '',
        contactNumber: '',
        email: '',
        packageName: '',
        contractPrice: 0
      });
    } catch (error) {
      console.error('Error adding vendor:', error);
    }
  };

  const getVendorGroups = () => {
    const groups = vendors.reduce((acc, vendor) => {
      if (!acc[vendor.serviceType]) {
        acc[vendor.serviceType] = [];
      }
      acc[vendor.serviceType].push(vendor);
      return acc;
    }, {} as Record<string, Vendor[]>);

    return Object.entries(groups).map(([serviceType, vendors]) => ({
      serviceType,
      vendors
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE5EC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE5EC] p-6">
      <div className="max-w-7xl mx-auto">

        {/* Two-column layout for Masterlist and Selected Vendors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Vendor Masterlist */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Vendor Masterlist</h2>
              <button
                onClick={() => setIsMasterlistOpen(!isMasterlistOpen)}
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
              >
                {isMasterlistOpen ? 'Hide' : 'Show'} Masterlist
                <svg
                  className={`w-5 h-5 transform transition-transform ${isMasterlistOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isMasterlistOpen && (
              <>
                {/* Add Vendor Form */}
                <form onSubmit={handleAddVendor} className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                      <input
                        type="text"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select
                        value={newVendor.serviceType}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, serviceType: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Type</option>
                        {serviceTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        value={newVendor.contactNumber}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, contactNumber: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                      <input
                        type="text"
                        value={newVendor.packageName}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, packageName: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contract Price (₱)</label>
                      <input
                        type="number"
                        value={newVendor.contractPrice}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, contractPrice: parseFloat(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-pink-500 text-white py-2 rounded-md hover:bg-pink-600 transition-colors"
                  >
                    Add Vendor
                  </button>
                </form>

                {/* Vendor List */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Service Type</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Vendor Name</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Contract Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Contact Info</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {vendors.map(vendor => {
                        const isSelected = selectedVendors[vendor.serviceType] === vendor.id;
                        return (
                          <tr key={vendor.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-900">{vendor.serviceType}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{vendor.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              ₱{vendor.contractPrice.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{vendor.contactNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{vendor.email}</td>
                            <td className="px-4 py-3 text-sm text-center">
                              {isSelected && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Selected
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Selected Vendors Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Selected Vendors</h2>
              <button
                onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700"
              >
                {isSummaryOpen ? 'Hide' : 'Show'} Selected Vendors
                <svg
                  className={`w-5 h-5 transform transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {isSummaryOpen && (
              <VendorSummary
                vendors={vendors}
                selectedVendors={selectedVendors}
              />
            )}
          </div>
        </div>

        {/* Vendor Groups */}
        <div className="space-y-8">
          {getVendorGroups().map(group => (
            <VendorGroup
              key={group.serviceType}
              group={group}
              selectedVendors={selectedVendors}
              onVendorSelect={handleVendorSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 