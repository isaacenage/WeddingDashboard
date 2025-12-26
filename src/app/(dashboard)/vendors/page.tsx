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
  const [isMasterlistModalOpen, setIsMasterlistModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
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
        {/* Action Buttons */}
        <div className="flex gap-3 justify-center sm:justify-start flex-wrap">
          <button
            onClick={() => setIsMasterlistModalOpen(true)}
            className="bg-gradient-to-r from-[#EC4899] to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-xl active:scale-95 transition-all font-semibold text-sm shadow-lg"
          >
            Vendor Masterlist
          </button>
          <button
            onClick={() => setIsSummaryModalOpen(true)}
            className="bg-gradient-to-r from-[#ffd5e0] to-[#fbcfe8] text-[#4a1d39] px-6 py-3 rounded-xl hover:shadow-xl active:scale-95 transition-all font-semibold text-sm shadow-lg"
          >
            Selected Vendors Summary
          </button>
        </div>

        {/* Vendor Groups - Full Width */}
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

      {/* Vendor Masterlist Modal */}
      {isMasterlistModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsMasterlistModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#EC4899] to-pink-600 p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Vendor Masterlist</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCleanup}
                  className="text-white/90 hover:text-white text-sm px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                >
                  Clean Up
                </button>
                <button
                  onClick={handleMigration}
                  disabled={isMigrating}
                  className={`text-white/90 hover:text-white text-sm px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all ${isMigrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isMigrating ? 'Migrating...' : 'Fix Vendor IDs'}
                </button>
                <button
                  onClick={() => setIsMasterlistModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Add Vendor Form */}
              <form onSubmit={handleAddVendor} className="mb-6 bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-[#EC4899] mb-3">Add New Vendor</h3>
                {formError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-3">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                      value={newVendor.serviceType}
                      onChange={(e) => {
                        setNewVendor(prev => ({ ...prev, serviceType: e.target.value }));
                        setFormError('');
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newVendor.email}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                      type="text"
                      value={newVendor.packageName}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, packageName: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Price (₱)</label>
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
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full bg-[#EC4899] text-white px-4 py-2.5 rounded-lg hover:bg-pink-600 active:scale-95 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newVendor.serviceType || !serviceTypes.includes(newVendor.serviceType)}
                >
                  Add Vendor
                </button>
              </form>

              {/* Vendor Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#fbcfe8] to-[#fce7f3]">
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Service Type</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Vendor Name</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Package</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Contact</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Email</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Price</th>
                      <th className="p-3 text-left text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Status</th>
                      <th className="p-3 text-center text-sm font-semibold text-[#4a1d39] border-b-2 border-[#EC4899]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-500">No vendors yet</td>
                      </tr>
                    ) : (
                      vendors.map(vendor => {
                        const isSelected = selectedVendors[vendor.serviceType]?.includes(vendor.id) || false;
                        const isEditing = editingVendor === vendor.id;

                        return (
                          <tr key={vendor.id} className={`border-b border-gray-200 hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                            {isEditing ? (
                              <>
                                <td className="p-2">
                                  <select
                                    value={editFormData.serviceType}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                    required
                                  >
                                    <option value="">Select</option>
                                    {serviceTypes.map(type => (
                                      <option key={type} value={type}>{type}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={editFormData.packageName}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, packageName: e.target.value }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="tel"
                                    value={editFormData.contactNumber}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                    required
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={editFormData.contractPrice || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, contractPrice: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                                    className="w-full p-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </td>
                                <td className="p-2"></td>
                                <td className="p-2">
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => handleSaveEdit(vendor.id)}
                                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors text-xs"
                                    >
                                      <FaSave size={12} />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors text-xs"
                                    >
                                      <FaTimes size={12} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3">
                                  <span className="inline-block bg-[#EC4899]/10 text-[#EC4899] text-xs font-medium px-2 py-1 rounded">
                                    {vendor.serviceType || '—'}
                                  </span>
                                </td>
                                <td className="p-3 text-sm font-medium text-[#4a1d39]">{vendor.name || '—'}</td>
                                <td className="p-3 text-sm text-gray-700">{vendor.packageName || '—'}</td>
                                <td className="p-3 text-sm text-gray-700">{vendor.contactNumber || '—'}</td>
                                <td className="p-3 text-sm text-gray-700">{vendor.email || '—'}</td>
                                <td className="p-3 text-sm font-semibold text-[#EC4899]">
                                  ₱{isNaN(vendor.contractPrice) ? '0' : vendor.contractPrice.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  {isSelected && (
                                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      ✓ Selected
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleEditClick(vendor)}
                                      className="bg-[#EC4899] text-white px-2 py-1 rounded hover:bg-pink-600 transition-colors text-xs"
                                      title="Edit"
                                    >
                                      <FaEdit size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVendor(vendor.id)}
                                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors text-xs"
                                      title="Delete"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Vendors Summary Modal */}
      {isSummaryModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsSummaryModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#ffd5e0] to-[#fbcfe8] p-4 sm:p-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#4a1d39]">Selected Vendors Summary</h2>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-[#4a1d39] hover:bg-white/30 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <VendorSummary
                vendors={vendors}
                selectedVendors={selectedVendors}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 