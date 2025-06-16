export interface Vendor {
  id: string;
  name: string;
  serviceType: string;
  contactNumber: string;
  email: string;
  packageName: string;
  contractPrice: number;
  amountPaid?: number;
  contactInfo: string;
  notes?: string;
}

export interface VendorGroup {
  serviceType: string;
  vendors: Vendor[];
}

export interface VendorSummary {
  serviceType: string;
  selectedVendor: Vendor | null;
}

export interface VendorFormData {
  name: string;
  serviceType: string;
  contactNumber: string;
  email: string;
  packageName: string;
  contractPrice: number;
} 