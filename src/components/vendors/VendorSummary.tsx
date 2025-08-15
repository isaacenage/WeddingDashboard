'use client';

import { Vendor } from '@/types/vendor';

interface VendorSummaryProps {
  vendors: Vendor[];
  selectedVendors: Record<string, string[]>;
}

export default function VendorSummary({ vendors, selectedVendors }: VendorSummaryProps) {
  const selectedVendorDetails = Object.entries(selectedVendors).flatMap(([serviceType, vendorIds]) => {
    return vendorIds.map(vendorId => {
      const vendor = vendors.find(v => v.id === vendorId);
      return {
        serviceType,
        vendor
      };
    }).filter(item => item.vendor); // Filter out vendors that weren't found
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
          {selectedVendorDetails.map(({ serviceType, vendor }, index) => (
            vendor && (
              <div key={`${serviceType}-${vendor.id}`} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{serviceType}</p>
                    <p className="text-sm text-gray-600">{vendor.name}</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                      Multiple Selection
                    </span>
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