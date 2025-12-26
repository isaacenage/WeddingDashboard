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
        <div className="text-center py-12">
          <p className="text-gray-500 italic text-lg">No vendors selected yet</p>
          <p className="text-sm text-gray-400 mt-2">Select vendors from the vendor groups to see them here</p>
        </div>
      ) : (
        <>
          {/* Total Budget Card */}
          <div className="bg-gradient-to-r from-[#EC4899] to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg opacity-90">Total Budget Allocated</p>
                <p className="text-sm opacity-75">{selectedVendorDetails.length} vendor{selectedVendorDetails.length !== 1 ? 's' : ''} selected</p>
              </div>
              <p className="text-3xl sm:text-4xl font-bold">
                ₱{calculateTotal().toLocaleString()}
              </p>
            </div>
          </div>

          {/* Selected Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedVendorDetails.map(({ serviceType, vendor }) => (
              vendor && (
                <div key={`${serviceType}-${vendor.id}`} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all border border-[#EC4899]/20">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-block bg-[#EC4899]/10 text-[#EC4899] text-xs font-medium px-2 py-1 rounded-full">
                      {serviceType}
                    </span>
                    <p className="text-base font-bold text-[#4a1d39]">
                      ₱{vendor.contractPrice.toLocaleString()}
                    </p>
                  </div>
                  <h4 className="font-semibold text-[#4a1d39] text-base mb-1">{vendor.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{vendor.packageName}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p className="flex items-center gap-2">
                      <span>📞</span>
                      <span className="truncate">{vendor.contactNumber}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>✉️</span>
                      <span className="truncate">{vendor.email}</span>
                    </p>
                  </div>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
} 