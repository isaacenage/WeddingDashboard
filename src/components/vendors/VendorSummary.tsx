'use client';

import { Vendor } from '@/types/vendor';

interface VendorSummaryProps {
  vendors: Vendor[];
  selectedVendors: Record<string, string>;
}

export default function VendorSummary({ vendors, selectedVendors }: VendorSummaryProps) {
  const selectedVendorDetails = Object.entries(selectedVendors).map(([serviceType, vendorId]) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return {
      serviceType,
      vendor
    };
  });

  const calculateTotal = () => {
    return selectedVendorDetails.reduce((total, { vendor }) => {
      return total + (vendor?.contractPrice || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {selectedVendorDetails.length === 0 ? (
        <p className="text-gray-500 italic">No vendors selected yet</p>
      ) : (
        <>
          {selectedVendorDetails.map(({ serviceType, vendor }) => (
            vendor && (
              <div key={serviceType} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{serviceType}</p>
                    <p className="text-sm text-gray-600">{vendor.name}</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    ₱{vendor.contractPrice.toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Contact: {vendor.contactNumber}</p>
                  <p>Email: {vendor.email}</p>
                  <p>Package: {vendor.packageName}</p>
                </div>
              </div>
            )
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">Total Cost</p>
              <p className="text-xl font-semibold text-gray-800">
                ₱{calculateTotal().toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 