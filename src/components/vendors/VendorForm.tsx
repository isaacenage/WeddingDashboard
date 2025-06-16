'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addVendor } from '@/lib/firebase/vendors';
import { VendorFormData } from '@/types/vendor';

interface VendorFormProps {
  serviceTypes: string[];
  onClose: () => void;
}

export default function VendorForm({ serviceTypes, onClose }: VendorFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    serviceType: '',
    contactNumber: '',
    email: '',
    packageName: '',
    contractPrice: 0,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Validate form data
    if (!formData.name || !formData.serviceType || !formData.contactNumber || !formData.contractPrice) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate contact number format (Philippine mobile number)
    const contactRegex = /^(09|\+639)\d{9}$/;
    if (!contactRegex.test(formData.contactNumber)) {
      setError('Please enter a valid Philippine mobile number (e.g., 09123456789)');
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await addVendor(user.uid, formData);
      onClose();
    } catch (err) {
      setError('Failed to add vendor. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'contractPrice' ? Number(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Vendor</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          <select
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          >
            <option value="">Select a service type</option>
            {serviceTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number *
          </label>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="e.g., 09123456789"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Package Name *
          </label>
          <input
            type="text"
            name="packageName"
            value={formData.packageName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Price (₱) *
          </label>
          <input
            type="number"
            name="contractPrice"
            value={formData.contractPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-pink-500 rounded-md hover:bg-pink-600 transition-colors"
          >
            Add Vendor
          </button>
        </div>
      </div>
    </form>
  );
} 