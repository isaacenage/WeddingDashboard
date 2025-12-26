'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVendors, getSelectedVendors, getServiceTypes, addVendor, updateVendor, deleteVendor, migrateVendorKeys, cleanupSelectedVendors } from '@/lib/firebase/vendors';
import { Vendor, VendorFormData } from '@/types/vendor';
import VendorGroup from '@/components/vendors/VendorGroup';
import VendorSummary from '@/components/vendors/VendorSummary';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

export default function VendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<Record<string, string[]>>({});
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMasterlistOpen, setIsMasterlistOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<VendorFormData>({
    name: '',
    serviceType: '',
    contactNumber: '',
    email: '',
    packageName: '',
    contractPrice: 0
  });
  const [newVendor, setNewVendor] = useState<VendorFormData>({
    name: '',
    serviceType: '',
    contactNumber: '',
    email: '',
    packageName: '',
    contractPrice: 0
  });
  const [formError, setFormError] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

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

  // Clean up selectedVendors to remove any vendor IDs that no longer exist
  useEffect(() => {
    if (!user?.uid || !vendors.length || Object.keys(selectedVendors).length === 0) return;

    const validVendorIds = new Set(vendors.map(v => v.id));

    // Check if there are any invalid vendor IDs
    const hasInvalidIds = Object.values(selectedVendors).some(vendorIds =>
      vendorIds.some(id => !validVendorIds.has(id))
    );

    if (hasInvalidIds) {
      // Clean up the Firebase database immediately
      console.log('Found orphaned vendor IDs, cleaning up...');
      cleanupSelectedVendors(user.uid, validVendorIds)
        .then(() => {
          console.log('Cleanup completed successfully');
        })
        .catch(error => {
          console.error('Error cleaning up selected vendors:', error);
        });
    }
  }, [user?.uid, vendors, selectedVendors]);


  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Reset error state
    setFormError('');

    try {
      // Trim all string values
      const trimmedVendor = {
        ...newVendor,
        name: newVendor.name.trim(),
        serviceType: newVendor.serviceType.trim(),
        contactNumber: newVendor.contactNumber.trim(),
        email: newVendor.email.trim(),
        packageName: newVendor.packageName.trim(),
      };

      // Validate all required fields
      if (!trimmedVendor.name) {
        setFormError('Please enter a vendor name');
        return;
      }

      if (!trimmedVendor.serviceType || !serviceTypes.includes(trimmedVendor.serviceType)) {
        setFormError('Please select a valid service type');
        return;
      }

      if (!trimmedVendor.contactNumber) {
        setFormError('Please enter a contact number');
        return;
      }

      // Validate contact number format (Philippine mobile number)
      const contactRegex = /^(09|\+639)\d{9}$/;
      if (!contactRegex.test(trimmedVendor.contactNumber)) {
        setFormError('Please enter a valid Philippine mobile number (e.g., 09123456789)');
        return;
      }

      // Validate email format if provided
      if (trimmedVendor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedVendor.email)) {
        setFormError('Please enter a valid email address');
        return;
      }

      if (!trimmedVendor.packageName) {
        setFormError('Please enter a package name');
        return;
      }

      if (!trimmedVendor.contractPrice || trimmedVendor.contractPrice <= 0) {
        setFormError('Please enter a valid contract price');
        return;
      }

      // Add the vendor and get the ID
      const vendorId = await addVendor(user.uid, trimmedVendor);

      // Reset form after successful submission
      setNewVendor({
        name: '',
        serviceType: '',
        contactNumber: '',
        email: '',
        packageName: '',
        contractPrice: 0
      });
      setFormError('');

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'text-green-600 text-sm bg-green-50 p-2 rounded-lg mb-4';
      successMessage.textContent = 'Vendor added successfully!';
      const form = document.querySelector('form');
      form?.insertBefore(successMessage, form.firstChild);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Error adding vendor. Please try again.');
      }
      console.error('Error adding vendor:', error);
    }
  };

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor(vendor.id);
    setEditFormData({
      name: vendor.name,
      serviceType: vendor.serviceType,
      contactNumber: vendor.contactNumber,
      email: vendor.email,
      packageName: vendor.packageName,
      contractPrice: vendor.contractPrice
    });
  };

  const handleCancelEdit = () => {
    setEditingVendor(null);
    setEditFormData({
      name: '',
      serviceType: '',
      contactNumber: '',
      email: '',
      packageName: '',
      contractPrice: 0
    });
  };

  const handleSaveEdit = async (vendorId: string) => {
    if (!user?.uid) return;

    try {
      await updateVendor(user.uid, vendorId, editFormData);
      setEditingVendor(null);
      setEditFormData({
        name: '',
        serviceType: '',
        contactNumber: '',
        email: '',
        packageName: '',
        contractPrice: 0
      });
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!user?.uid || !window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await deleteVendor(user.uid, vendorId);
    } catch (error) {
      console.error('Error deleting vendor:', error);
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

  const handleCleanup = async () => {
    if (!user?.uid) return;

    try {
      const validVendorIds = new Set(vendors.map(v => v.id));
      await cleanupSelectedVendors(user.uid, validVendorIds);

      // Show success message
      const message = document.createElement('div');
      message.className = 'text-green-600 text-sm bg-green-50 p-2 rounded-lg mb-4';
      message.textContent = 'Cleanup completed: Orphaned vendor selections removed';
      const container = document.querySelector('.bg-[#ffd5e0]/90');
      container?.insertBefore(message, container.firstChild);
      setTimeout(() => message.remove(), 3000);
    } catch (error) {
      console.error('Cleanup failed:', error);
      // Show error message
      const message = document.createElement('div');
      message.className = 'text-red-600 text-sm bg-red-50 p-2 rounded-lg mb-4';
      message.textContent = 'Failed to cleanup. Please try again.';
      const container = document.querySelector('.bg-[#ffd5e0]/90');
      container?.insertBefore(message, container.firstChild);
      setTimeout(() => message.remove(), 3000);
    }
  };

  const handleMigration = async () => {
    if (!user?.uid || isMigrating) return;

    try {
      setIsMigrating(true);
      const stats = await migrateVendorKeys(user.uid);

      // Show success message with stats
      const message = document.createElement('div');
      message.className = 'text-green-600 text-sm bg-green-50 p-2 rounded-lg mb-4';
      message.textContent = stats
        ? `Migration completed: ${stats.migrated} vendors migrated, ${stats.skipped} skipped, ${stats.errors} errors`
        : 'Migration completed: No vendors needed migration';
      const container = document.querySelector('.bg-[#ffd5e0]/90');
      container?.insertBefore(message, container.firstChild);
      setTimeout(() => message.remove(), 5000);
    } catch (error) {
      console.error('Migration failed:', error);
      // Show error message
      const message = document.createElement('div');
      message.className = 'text-red-600 text-sm bg-red-50 p-2 rounded-lg mb-4';
      message.textContent = 'Failed to migrate vendors. Please try again.';
      const container = document.querySelector('.bg-[#ffd5e0]/90');
      container?.insertBefore(message, container.firstChild);
      setTimeout(() => message.remove(), 5000);
    } finally {
      setIsMigrating(false);
    }
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
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Two-column layout for Masterlist and Selected Vendors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Vendor Masterlist */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-[#EC4899]">Vendor Masterlist</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCleanup}
                  className="text-[#EC4899] hover:text-pink-700 text-sm"
                >
                  Clean Up
                </button>
                <button
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className={`text-[#EC4899] hover:text-pink-700 text-sm ${isMigrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isMigrating ? 'Migrating...' : 'Fix Vendor IDs'}
                </button>
                <button
                  onClick={() => setIsMasterlistOpen(!isMasterlistOpen)}
                  className="flex items-center gap-2 text-[#EC4899] hover:text-pink-700"
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
            </div>

            {isMasterlistOpen && (
              <>
                {/* Add Vendor Form */}
                <form onSubmit={handleAddVendor} className="mb-6 space-y-4">
                  {formError && (
                    <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">Vendor Name</label>
                      <input
                        type="text"
                        value={newVendor.name}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">
                        Service Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newVendor.serviceType}
                        onChange={(e) => {
                          setNewVendor(prev => ({ ...prev, serviceType: e.target.value }));
                          setFormError(''); // Clear error when selection changes
                        }}
                        className={`w-full p-2 sm:p-3 border ${formError && !newVendor.serviceType ? 'border-red-500' : 'border-[#EC4899]/30'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm ${newVendor.serviceType ? 'text-[#4a1d39]' : 'text-[#EC4899]/70'}`}
                        required
                      >
                        <option value="" className="text-[#EC4899]/70">Select Type</option>
                        {serviceTypes.map(type => (
                          <option key={type} value={type} className="text-[#4a1d39]">
                            {type}
                          </option>
                        ))}
                      </select>
                      {formError && !newVendor.serviceType && (
                        <p className="mt-1 text-xs text-red-500">Please select a service type</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">Contact Number</label>
                      <input
                        type="tel"
                        value={newVendor.contactNumber}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, contactNumber: e.target.value }))}
                        className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">Email</label>
                      <input
                        type="email"
                        value={newVendor.email}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">Package Name</label>
                      <input
                        type="text"
                        value={newVendor.packageName}
                        onChange={(e) => setNewVendor(prev => ({ ...prev, packageName: e.target.value }))}
                        className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#EC4899] mb-1">Contract Price (₱)</label>
                      <input
                        type="number"
                        value={newVendor.contractPrice || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewVendor(prev => ({
                            ...prev,
                            contractPrice: value === '' ? 0 : parseFloat(value)
                          }));
                        }}
                        className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#EC4899] text-white px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newVendor.serviceType || !serviceTypes.includes(newVendor.serviceType)}
                  >
                    Add Vendor
                  </button>
                </form>

                {/* Vendor List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/30">
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39]">Service Type</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39]">Vendor Name</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39] text-right">Contract Price</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39]">Contact Info</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39]">Email</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39]">Package Name</th>
                        <th className="px-2 sm:px-3 py-3 text-xs sm:text-sm font-medium text-[#4a1d39] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/50">
                      {vendors.map(vendor => {
                        const isSelected = selectedVendors[vendor.serviceType]?.includes(vendor.id) || false;
                        const isEditing = editingVendor === vendor.id;

                        // Format vendor data with fallbacks
                        const vendorType = vendor.serviceType || '—';
                        const vendorName = vendor.name || '—';
                        const contactNumber = vendor.contactNumber || '—';
                        const email = vendor.email || '—';
                        const packageName = vendor.packageName || '—';
                        const price = isNaN(vendor.contractPrice) ? '₱0' : `₱${vendor.contractPrice.toLocaleString()}`;

                        return (
                          <tr key={vendor.id} className={`hover:bg-white/30 transition-colors ${isSelected ? 'bg-white/50' : ''}`}>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39]">
                              {isEditing ? (
                                <select
                                  value={editFormData.serviceType}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899] text-[#4a1d39]"
                                  required
                                >
                                  <option value="" className="text-[#EC4899]/70">Select Type</option>
                                  {serviceTypes.map(type => (
                                    <option key={type} value={type} className="text-[#4a1d39]">
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                vendorType
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39]">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                                  required
                                />
                              ) : (
                                vendorName
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39] text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editFormData.contractPrice || ''}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, contractPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899] text-right"
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              ) : (
                                price
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39]">
                              {isEditing ? (
                                <input
                                  type="tel"
                                  value={editFormData.contactNumber}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                                  required
                                />
                              ) : (
                                contactNumber
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39]">
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editFormData.email}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                                />
                              ) : (
                                email
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-[#4a1d39]">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFormData.packageName}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, packageName: e.target.value }))}
                                  className="w-full p-1 border border-[#EC4899]/30 rounded focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                                  required
                                />
                              ) : (
                                packageName
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3 text-xs sm:text-sm text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleSaveEdit(vendor.id)}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title="Save"
                                  >
                                    <FaSave size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                    title="Cancel"
                                  >
                                    <FaTimes size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditClick(vendor)}
                                    className="text-[#EC4899] hover:text-pink-700 transition-colors"
                                    title="Edit"
                                  >
                                    <FaEdit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVendor(vendor.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash size={16} />
                                  </button>
                                </div>
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
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899]">Selected Vendors</h2>
              <button
                onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                className="flex items-center gap-2 text-[#EC4899] hover:text-pink-700"
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
        <div className="space-y-4 sm:space-y-6">
          {getVendorGroups().map(group => (
            <VendorGroup
              key={group.serviceType}
              group={group}
              selectedVendors={selectedVendors}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 